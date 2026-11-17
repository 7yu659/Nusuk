package com.nusuk.automator.codes;

import android.content.Context;
import android.util.AtomicFile;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import com.nusuk.automator.stats.Stats;

public class KeyRepository {
    private static final String TAG = "KeyRepo";
    private static final String STATE_FILE = "keys_state.json";
    private static final int CODES_ORDER_VERSION = 2; // 2 = newest-first sequential order
    private static final Pattern VALID_CODE = Pattern.compile("^NG-[A-Za-z0-9]{8}$", Pattern.CASE_INSENSITIVE);
    /**
     * Tried before anything else, once per phone (a tested or globally-invalid code is never tried again).
     */
    private static final String[] PRIORITY_CODES = {"NG-WO4DFqSh", "NG-qlVHTrFa"};
    private static KeyRepository instance;

    public interface ChangeListener {
        void onKeysChanged();
    }

    private final Context context;
    private final List<String> allCodes = new ArrayList<>();
    private final Set<String> successCodes = new LinkedHashSet<>();
    private final Set<String> invalidCodes = new LinkedHashSet<>();
    // Nusuk said "already used": this account added the code before (another phone, by hand, an
    // older install). Never tried again for this user, and NEVER marks the code invalid for others.
    private final Set<String> alreadyCodes = new LinkedHashSet<>();
    // Shared list from the server: codes that failed on several phones and never worked anywhere.
    private final Set<String> deadCodes = new HashSet<>();
    // Shared list from Firestore (invalid_codes): any code marked invalid (not "already used") by ANY user.
    private final Set<String> globalInvalidCodes = new LinkedHashSet<>();
    private final Set<String> pendingFirestoreInvalid = new LinkedHashSet<>();
    private String firestoreInvalidSince = "";
    private long deadSince = 0;       // server cursor for dead-list changes
    private final List<ChangeListener> listeners = new java.util.concurrent.CopyOnWriteArrayList<>();
    private Set<String> codeKeys = null; // upper-case copy of allCodes, for de-duplicating downloads
    private long codesCursor = 0;    // server key id the downloaded list is complete up to
    private boolean apiCodesDone = false; // true only once /api/app/codes has returned done=true
    private int codesOrderVersion = CODES_ORDER_VERSION;
    private int remainingCache = -1;  // untested codes in the current list; -1 = recount
    private int scanHint = 0;        // lowest candidate index in allCodes for O(1) sequential newest-first scan
    // Codes that got no answer this session; not persisted, so they are tried again later.
    private final Set<String> deferredCodes = new HashSet<>();
    // Priority keys last received from the server & Firestore pinned list (persisted).
    private final List<String> serverPriority = new ArrayList<>();
    private final List<String> firestorePinned = new ArrayList<>();
    // Results not yet backed up to the server (persisted, so a kill never loses them).
    private final Set<String> pendingSuccess = new LinkedHashSet<>();
    private final Set<String> pendingInvalid = new LinkedHashSet<>();
    private final Set<String> pendingAlready = new LinkedHashSet<>();
    // false until this install has pulled its history from the server (after reinstall) and
    // pushed everything it already had (first run of a version with backup).
    private boolean restored = false;

    // The saved state (about 20k codes) is parsed on a background thread so the first screen
    // doesn't wait for it. The loader holds this object's lock while it works, so every
    // synchronized method (the automation's) simply waits for it; the UI-facing counters below
    // return 0 instead of waiting, and listeners are notified when loading is done.
    private volatile boolean loaded = false;
    private final List<Runnable> whenLoaded = new ArrayList<>();

    private KeyRepository(Context context) {
        this.context = context.getApplicationContext();
        final java.util.concurrent.CountDownLatch lockTaken = new java.util.concurrent.CountDownLatch(1);
        new Thread(() -> {
            List<Runnable> run;
            synchronized (this) {
                lockTaken.countDown();
                loadState();
            }
            synchronized (whenLoaded) {
                loaded = true;
                run = new ArrayList<>(whenLoaded);
                whenLoaded.clear();
            }
            for (Runnable r : run) {
                try { r.run(); } catch (Exception e) { Log.e(TAG, "whenLoaded", e); }
            }
            notifyListeners();
            CodeSync.syncSoon(this.context, 0);
        }, "keys-load").start();
        try { lockTaken.await(); } catch (InterruptedException ignored) {}
    }

    public boolean isLoaded() { return loaded; }

    /** Runs `r` now if the saved state is loaded, else right after it is (on the loader thread). */
    public void whenLoaded(Runnable r) {
        synchronized (whenLoaded) {
            if (!loaded) { whenLoaded.add(r); return; }
        }
        r.run();
    }

    public static synchronized KeyRepository getInstance(Context context) {
        if (instance == null) {
            instance = new KeyRepository(context);
        }
        return instance;
    }

    public void registerListener(ChangeListener listener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    public void unregisterListener(ChangeListener listener) {
        listeners.remove(listener);
    }

    /** Lets other counters (quiz stats) refresh the same listeners. */
    public void notifyChanged() {
        notifyListeners();
    }

    private void notifyListeners() {
        for (ChangeListener l : new ArrayList<>(listeners)) {
            try {
                l.onKeysChanged();
            } catch (Exception e) {
                Log.e(TAG, "Listener error", e);
            }
        }
    }

    public int getTotalCount() {
        if (!loaded) return 0; // never block the UI thread on the initial load
        synchronized (this) { return allCodes.size(); }
    }

    public int getSuccessCount() {
        if (!loaded) return 0; // never block the UI thread on the initial load
        synchronized (this) { return successCodes.size(); }
    }

    public int getInvalidCount() {
        if (!loaded) return 0; // never block the UI thread on the initial load
        synchronized (this) { return invalidCodes.size(); }
    }

    public int getAlreadyCount() {
        if (!loaded) return 0; // never block the UI thread on the initial load
        synchronized (this) { return alreadyCodes.size(); }
    }

    /** Codes in the CURRENT list not tested yet (history can include codes from older lists). */
    public int getRemainingCount() {
        if (!loaded) return 0;
        synchronized (this) {
            if (remainingCache < 0) {
                int n = 0;
                for (String c : allCodes) {
                    if (isUntriedExceptDefer(c)) n++;
                }
                remainingCache = n;
            }
            return remainingCache;
        }
    }

    private boolean isTested(String code) {
        String norm = code.toUpperCase(Locale.US);
        return successCodes.contains(norm) || invalidCodes.contains(norm) || alreadyCodes.contains(norm);
    }

    /** Priority keys (bundled + Firestore pinned + from the server) in try order, no duplicates. */
    private List<String> priorityCodes() {
        LinkedHashMap<String, String> m = new LinkedHashMap<>();
        for (String c : PRIORITY_CODES) m.put(c.toUpperCase(Locale.US), c);
        for (String c : firestorePinned) m.putIfAbsent(c.toUpperCase(Locale.US), c);
        for (String c : serverPriority) m.putIfAbsent(c.toUpperCase(Locale.US), c);
        return new ArrayList<>(m.values());
    }

    /** True if at least one untested priority, downloaded, or user-added code is available to run. */
    public boolean hasRunnableCodes() {
        if (!loaded) return false;
        synchronized (this) {
            for (String code : priorityCodes()) {
                if (isUntried(code)) return true;
            }
            for (String code : allCodes) {
                if (isUntried(code)) return true;
            }
            return false;
        }
    }

    /** True if `code` can still be attempted on this phone right now. */
    public synchronized boolean isCodeAvailable(String code) {
        return code != null && !code.trim().isEmpty() && isUntried(code);
    }

    public synchronized String getNextCode() {
        for (String code : priorityCodes()) {
            if (isUntried(code)) return code;
        }
        // Main list is kept newest-first: pick sequentially from the top (index 0) onward,
        // never skipping an untried code and never repeating a tested or globally-invalid code.
        int n = allCodes.size();
        if (n == 0) return null;
        int start = Math.max(0, Math.min(scanHint, n));
        for (int i = start; i < n; i++) {
            String code = allCodes.get(i);
            if (isUntried(code)) {
                scanHint = i;
                return code;
            }
        }
        for (int i = 0; i < start; i++) {
            String code = allCodes.get(i);
            if (isUntried(code)) {
                scanHint = i;
                return code;
            }
        }
        scanHint = n;
        return null;
    }

    private boolean isUntriedExceptDefer(String code) {
        String u = code.toUpperCase(Locale.US);
        return !successCodes.contains(u)
                && !invalidCodes.contains(u)
                && !alreadyCodes.contains(u)
                && !deadCodes.contains(u)
                && !globalInvalidCodes.contains(u);
    }

    private boolean isUntried(String code) {
        String u = code.toUpperCase(Locale.US);
        return !isTested(code)
                && !deferredCodes.contains(u)
                && !deadCodes.contains(u)
                && !globalInvalidCodes.contains(u);
    }

    public synchronized void defer(String code) {
        if (code != null) deferredCodes.add(code.toUpperCase(Locale.US));
    }

    public void markSuccess(String code) {
        if (code == null) return;
        synchronized (this) {
            String c = code.trim().toUpperCase(Locale.US);
            if (successCodes.add(c)) Stats.codeAdded(context);
            invalidCodes.remove(c);
            alreadyCodes.remove(c);
            pendingAlready.remove(c);
            pendingSuccess.add(c);
            pendingInvalid.remove(c);
            remainingCache = -1;
            CodeSync.syncSoon(context, CodeSync.PUSH_DELAY_MS);
            saveState();
        }
        notifyListeners(); // outside the lock: listeners may call back into the repository
    }

    /** Nusuk: "already used" = this account has this code. Skipped on this user only, never marked invalid globally. */
    public void markAlready(String code) {
        if (code == null) return;
        synchronized (this) {
            String c = code.trim().toUpperCase(Locale.US);
            if (successCodes.contains(c)) return;
            invalidCodes.remove(c);
            pendingInvalid.remove(c);
            if (alreadyCodes.add(c)) pendingAlready.add(c);
            remainingCache = -1;
            CodeSync.syncSoon(context, CodeSync.PUSH_DELAY_MS);
            saveState();
        }
        notifyListeners();
    }

    /** Nusuk: invalid (not "already used") = bad everywhere. Blocked locally + pushed globally immediately. */
    public void markInvalid(String code) {
        if (code == null) return;
        synchronized (this) {
            String c = code.trim().toUpperCase(Locale.US);
            if (!successCodes.contains(c) && !alreadyCodes.contains(c)) {
                invalidCodes.add(c);
                deadCodes.add(c);
                globalInvalidCodes.add(c);
                pendingInvalid.add(c);
                boolean queuedFs = VALID_CODE.matcher(c).matches() && pendingFirestoreInvalid.add(c);
                scanHint = 0;
                remainingCache = -1;
                CodeSync.syncSoon(context, queuedFs ? CodeSync.FAST_PUSH_DELAY_MS : CodeSync.PUSH_DELAY_MS);
                saveState();
            }
        }
        notifyListeners();
    }

    /** Cursor of the code download (server key id); 0 = nothing downloaded yet. */
    synchronized long codesCursor() {
        return codesCursor;
    }

    public synchronized boolean isApiCodesDone() {
        return apiCodesDone;
    }

    /** Saves user-pasted codes at the very front so they are tried right away. */
    public int addLocalCodes(List<String> keys, List<String> addedOut, List<String> duplicateOut) {
        if (keys == null || keys.isEmpty()) return 0;
        int added = 0;
        synchronized (this) {
            ensureCodeKeysLocked(keys.size());
            List<String> toPrepend = new ArrayList<>();
            for (String raw : keys) {
                if (raw == null) continue;
                String c = raw.trim();
                if (c.length() != 11 || !c.regionMatches(true, 0, "NG-", 0, 3)) continue;
                c = "NG-" + c.substring(3);
                if (codeKeys.add(c.toUpperCase(Locale.US))) {
                    toPrepend.add(c);
                    added++;
                    if (addedOut != null) addedOut.add(c);
                } else {
                    if (duplicateOut != null) duplicateOut.add(c);
                }
            }
            if (!toPrepend.isEmpty()) {
                allCodes.addAll(0, toPrepend);
                scanHint = 0;
                remainingCache = -1;
                saveCodes();
                saveState();
            }
        }
        if (added > 0) notifyListeners();
        return added;
    }

    /**
     * Prepends a page returned by /api/app/codes (which arrives oldest-to-newest within the page).
     * Reversing the page and inserting at index 0 places the most recent server codes first.
     */
    int prependApiPage(List<String> pageOldestToNewest, long cursor, boolean done) {
        int added = 0;
        boolean stateChanged = false;
        synchronized (this) {
            List<String> page = pageOldestToNewest != null ? pageOldestToNewest : Collections.emptyList();
            ensureCodeKeysLocked(page.size());
            List<String> toPrepend = new ArrayList<>();
            for (int i = page.size() - 1; i >= 0; i--) {
                String raw = page.get(i);
                if (raw == null) continue;
                String c = raw.trim();
                if (c.length() <= 3 || !c.regionMatches(true, 0, "NG-", 0, 3)) continue;
                c = "NG-" + c.substring(3);
                if (codeKeys.add(c.toUpperCase(Locale.US))) {
                    toPrepend.add(c);
                    added++;
                }
            }
            if (!toPrepend.isEmpty()) {
                allCodes.addAll(0, toPrepend);
                scanHint = 0;
                remainingCache = -1;
                saveCodes();
                stateChanged = true;
            }
            long prevCursor = codesCursor;
            codesCursor = Math.max(codesCursor, cursor);
            boolean prevDone = apiCodesDone;
            if (done) apiCodesDone = true;
            if (codesCursor != prevCursor || apiCodesDone != prevDone) {
                stateChanged = true;
            }
            if (stateChanged) {
                saveState();
            }
        }
        if (added > 0) notifyListeners();
        return added;
    }

    /**
     * Applies codes fetched newest-first from Firestore (`nusuk_codes`, createdAt DESC).
     * Pinned codes go into `firestorePinned`; new codes are prepended at index 0.
     * If `forcePromote` is true, existing entries matching `newestFirst` are moved to index 0..k
     * so the most recently uploaded data-page codes are always tried before older bulk codes.
     */
    void applyFirestoreCodes(List<String> newestFirst, List<String> pinned, boolean forcePromote) {
        boolean notify = false;
        synchronized (this) {
            boolean stateChanged = false;
            boolean codesChanged = false;

            List<String> cleanPinned = new ArrayList<>();
            if (pinned != null) {
                for (String p : pinned) {
                    if (p == null) continue;
                    String c = p.trim();
                    if (c.length() > 3 && c.regionMatches(true, 0, "NG-", 0, 3)) {
                        cleanPinned.add("NG-" + c.substring(3));
                    }
                }
            }
            if (!cleanPinned.equals(firestorePinned)) {
                firestorePinned.clear();
                firestorePinned.addAll(cleanPinned);
                stateChanged = true;
                notify = true;
            }

            List<String> normalized = new ArrayList<>();
            Set<String> normUpper = new LinkedHashSet<>();
            if (newestFirst != null) {
                for (String raw : newestFirst) {
                    if (raw == null) continue;
                    String c = raw.trim();
                    if (c.length() <= 3 || !c.regionMatches(true, 0, "NG-", 0, 3)) continue;
                    c = "NG-" + c.substring(3);
                    if (normUpper.add(c.toUpperCase(Locale.US))) {
                        normalized.add(c);
                    }
                }
            }

            if (!normalized.isEmpty()) {
                ensureCodeKeysLocked(normalized.size());
                if (forcePromote) {
                    boolean alreadyAtFront = allCodes.size() >= normalized.size();
                    if (alreadyAtFront) {
                        for (int i = 0; i < normalized.size(); i++) {
                            if (!allCodes.get(i).equalsIgnoreCase(normalized.get(i))) {
                                alreadyAtFront = false;
                                break;
                            }
                        }
                    }
                    if (!alreadyAtFront) {
                        List<String> merged = new ArrayList<>(normalized.size() + allCodes.size());
                        merged.addAll(normalized);
                        for (String existing : allCodes) {
                            if (!normUpper.contains(existing.toUpperCase(Locale.US))) {
                                merged.add(existing);
                            }
                        }
                        allCodes.clear();
                        allCodes.addAll(merged);
                        codeKeys.addAll(normUpper);
                        codesChanged = true;
                    }
                } else {
                    List<String> toPrepend = new ArrayList<>();
                    for (String c : normalized) {
                        if (codeKeys.add(c.toUpperCase(Locale.US))) {
                            toPrepend.add(c);
                        }
                    }
                    if (!toPrepend.isEmpty()) {
                        allCodes.addAll(0, toPrepend);
                        codesChanged = true;
                    }
                }
            }

            if (codesChanged) {
                scanHint = 0;
                remainingCache = -1;
                saveCodes();
                notify = true;
            }
            if (stateChanged || codesChanged) {
                saveState();
            }
        }
        if (notify) notifyListeners();
    }

    private void ensureCodeKeysLocked(int extraCapacity) {
        if (codeKeys == null) {
            codeKeys = new HashSet<>(allCodes.size() * 2 + extraCapacity);
            for (String c : allCodes) codeKeys.add(c.toUpperCase(Locale.US));
        }
    }

    /** Legacy helper kept for compatibility: delegates to newest-first prepend. */
    int appendCodes(List<String> page, long cursor) {
        return prependApiPage(page, cursor, false);
    }

    // ---- persistence ----
    // keys_state.json = progress (index + success + invalid): small, rewritten after results,
    // debounced and written off the calling thread. keys_codes.json = the code list: large,
    // written only when the list itself changes. Both via AtomicFile, so a kill mid-write
    // leaves the previous good copy instead of a corrupt file.
    private static final String CODES_FILE = "keys_codes.json";
    private static final long SAVE_DEBOUNCE_MS = 500;
    private final ScheduledExecutorService io = Executors.newSingleThreadScheduledExecutor();
    private boolean savePending = false; // a write is queued and hasn't read the data yet
    private ScheduledFuture<?> saveFuture = null;

    /** Schedules a progress save; many results within SAVE_DEBOUNCE_MS become one write. */
    private synchronized void saveState() {
        if (savePending) return; // the queued write will read the latest data
        savePending = true;
        saveFuture = io.schedule(this::writeState, SAVE_DEBOUNCE_MS, TimeUnit.MILLISECONDS);
    }

    /** Ensures any debounced state write hits disk promptly (e.g., when stopping automation). */
    public void flushState() {
        if (!loaded) return;
        boolean pending;
        synchronized (this) {
            pending = savePending;
            if (pending && saveFuture != null) {
                saveFuture.cancel(false);
                saveFuture = null;
            }
        }
        if (pending) {
            try {
                io.submit(this::writeState).get(2, TimeUnit.SECONDS);
            } catch (Exception ignored) {
                writeState();
            }
        }
    }

    private void writeState() {
        // Copy under the lock (fast), build the JSON outside it: the UI thread reads the counters
        // under the same lock, and ~135k codes of JSON used to hold it for a visible stall.
        final long cursor, dSince;
        final boolean rest, apiDone;
        final int orderVer;
        final String fsInvalidSince;
        final List<String> succ, inv, pSucc, pInv, already, pAlready, dead, prio, fsPinned, gInv, pFsInv;
        synchronized (this) {
            savePending = false; // changes from here on schedule another write
            saveFuture = null;
            cursor = codesCursor; dSince = deadSince; rest = restored;
            apiDone = apiCodesDone; orderVer = codesOrderVersion;
            fsInvalidSince = firestoreInvalidSince;
            succ = new ArrayList<>(successCodes);
            inv = new ArrayList<>(invalidCodes);
            pSucc = new ArrayList<>(pendingSuccess);
            pInv = new ArrayList<>(pendingInvalid);
            already = new ArrayList<>(alreadyCodes);
            pAlready = new ArrayList<>(pendingAlready);
            dead = new ArrayList<>(deadCodes);
            prio = new ArrayList<>(serverPriority);
            fsPinned = new ArrayList<>(firestorePinned);
            gInv = new ArrayList<>(globalInvalidCodes);
            pFsInv = new ArrayList<>(pendingFirestoreInvalid);
        }
        String data;
        try {
            JSONObject json = new JSONObject();
            json.put("codesCursor", cursor);
            json.put("apiCodesDone", apiDone);
            json.put("codesOrderVersion", orderVer);
            json.put("success", new JSONArray(succ));
            json.put("invalid", new JSONArray(inv));
            json.put("pendingSuccess", new JSONArray(pSucc));
            json.put("pendingInvalid", new JSONArray(pInv));
            json.put("already", new JSONArray(already));
            json.put("pendingAlready", new JSONArray(pAlready));
            json.put("dead", new JSONArray(dead));
            json.put("deadSince", dSince);
            json.put("globalInvalid", new JSONArray(gInv));
            json.put("pendingFirestoreInvalid", new JSONArray(pFsInv));
            json.put("firestoreInvalidSince", fsInvalidSince);
            json.put("serverPriority", new JSONArray(prio));
            json.put("firestorePinned", new JSONArray(fsPinned));
            json.put("restored", rest);
            data = json.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error building state", e);
            return;
        }
        writeAtomic(STATE_FILE, data);
    }

    private synchronized void saveCodes() {
        final List<String> snap = new ArrayList<>(allCodes); // cheap copy; the slow part runs off the lock
        io.execute(() -> {
            JSONArray codesArr = new JSONArray();
            for (String s : snap) codesArr.put(s);
            writeAtomic(CODES_FILE, codesArr.toString());
        });
    }

    private void writeAtomic(String name, String data) {
        AtomicFile f = new AtomicFile(new File(context.getFilesDir(), name));
        FileOutputStream out = null;
        try {
            out = f.startWrite();
            out.write(data.getBytes(StandardCharsets.UTF_8));
            f.finishWrite(out);
        } catch (Exception e) {
            Log.e(TAG, "Error saving " + name, e);
            if (out != null) f.failWrite(out);
        }
    }

    private String readAtomic(String name) {
        AtomicFile f = new AtomicFile(new File(context.getFilesDir(), name));
        if (!f.getBaseFile().exists()) return null;
        try {
            return new String(f.readFully(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            Log.e(TAG, "Error reading " + name, e);
            return null;
        }
    }

    private void loadState() {
        String raw = readAtomic(STATE_FILE);
        boolean hadLegacyOrder = false;
        if (raw != null) try {
            JSONObject json = new JSONObject(raw);

            codesCursor = json.optLong("codesCursor", 0);
            apiCodesDone = json.optBoolean("apiCodesDone", false);
            codesOrderVersion = json.optInt("codesOrderVersion", 1);
            if (codesOrderVersion < CODES_ORDER_VERSION) hadLegacyOrder = true;

            readIntoUpper(json.optJSONArray("success"), successCodes);
            readIntoUpper(json.optJSONArray("invalid"), invalidCodes);
            readIntoUpper(json.optJSONArray("pendingSuccess"), pendingSuccess);
            readIntoUpper(json.optJSONArray("pendingInvalid"), pendingInvalid);
            readIntoUpper(json.optJSONArray("already"), alreadyCodes);
            readIntoUpper(json.optJSONArray("pendingAlready"), pendingAlready);
            readIntoUpper(json.optJSONArray("dead"), deadCodes);
            deadSince = json.optLong("deadSince", 0);
            readIntoUpper(json.optJSONArray("globalInvalid"), globalInvalidCodes);
            readIntoUpper(json.optJSONArray("pendingFirestoreInvalid"), pendingFirestoreInvalid);
            firestoreInvalidSince = json.optString("firestoreInvalidSince", "").trim();
            readIntoTrimmed(json.optJSONArray("serverPriority"), serverPriority);
            readIntoTrimmed(json.optJSONArray("firestorePinned"), firestorePinned);
            restored = json.optBoolean("restored", false);

            // Older versions kept the code list inside the state file: migrate it once.
            JSONArray legacy = json.optJSONArray("codes");
            if (legacy != null && legacy.length() > 0 && readAtomic(CODES_FILE) == null) {
                for (int i = 0; i < legacy.length(); i++) {
                    if (legacy.isNull(i)) continue;
                    String s = legacy.optString(i, "").trim();
                    if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) allCodes.add(s);
                }
                if (hadLegacyOrder && !allCodes.isEmpty()) {
                    Collections.reverse(allCodes);
                }
                codesOrderVersion = CODES_ORDER_VERSION;
                hadLegacyOrder = false;
                saveCodes();
                saveState(); // rewrites the state file without the big list
            }
        } catch (Exception e) {
            Log.e(TAG, "Error loading state", e);
        }

        String codesRaw = readAtomic(CODES_FILE);
        if (codesRaw != null && allCodes.isEmpty()) try {
            JSONArray codesArr = new JSONArray(codesRaw);
            for (int i = 0; i < codesArr.length(); i++) {
                if (codesArr.isNull(i)) continue;
                String s = codesArr.optString(i, "").trim();
                if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) allCodes.add(s);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error loading codes", e);
        }

        if (hadLegacyOrder || codesOrderVersion < CODES_ORDER_VERSION) {
            if (!allCodes.isEmpty()) {
                Collections.reverse(allCodes);
                saveCodes();
            }
            codesOrderVersion = CODES_ORDER_VERSION;
            saveState();
        }
    }

    private static void readIntoUpper(JSONArray arr, Collection<String> out) {
        if (arr == null) return;
        for (int i = 0; i < arr.length(); i++) {
            if (arr.isNull(i)) continue;
            String s = arr.optString(i, "").trim();
            if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) out.add(s.toUpperCase(Locale.US));
        }
    }

    private static void readIntoTrimmed(JSONArray arr, Collection<String> out) {
        if (arr == null) return;
        for (int i = 0; i < arr.length(); i++) {
            if (arr.isNull(i)) continue;
            String s = arr.optString(i, "").trim();
            if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) out.add(s);
        }
    }

    // ---- server backup (used by CodeSync, on its own thread) ----

    /** Before the first restore on this install, everything already tested goes up too. */
    public synchronized boolean needsRestore() {
        return !restored;
    }

    /** Copies of everything tested: [0] = success, [1] = invalid, [2] = already used. */
    synchronized List<List<String>> snapshotTested() {
        return Arrays.asList(new ArrayList<>(successCodes), new ArrayList<>(invalidCodes), new ArrayList<>(alreadyCodes));
    }

    /** Up to `max` results not backed up yet: [0] = success, [1] = invalid, [2] = already used. */
    synchronized List<List<String>> nextPending(int max) {
        List<String> s = new ArrayList<>(), i = new ArrayList<>(), a = new ArrayList<>();
        for (String c : pendingSuccess) { if (s.size() >= max) break; s.add(c); }
        for (String c : pendingAlready) { if (s.size() + a.size() >= max) break; a.add(c); }
        for (String c : pendingInvalid) { if (s.size() + a.size() + i.size() >= max) break; i.add(c); }
        return Arrays.asList(s, i, a);
    }

    /** The server stored these results. */
    synchronized void onUploaded(List<String> success, List<String> invalid, List<String> already) {
        pendingSuccess.removeAll(success);
        pendingInvalid.removeAll(invalid);
        pendingAlready.removeAll(already);
        saveState();
    }

    synchronized List<String> nextPendingFirestoreInvalid(int max) {
        List<String> out = new ArrayList<>();
        for (String c : pendingFirestoreInvalid) {
            if (out.size() >= max) break;
            out.add(c);
        }
        return out;
    }

    synchronized void onFirestoreInvalidUploaded(List<String> sent) {
        if (sent == null || sent.isEmpty()) return;
        pendingFirestoreInvalid.removeAll(sent);
        saveState();
    }

    synchronized String firestoreInvalidSince() {
        return firestoreInvalidSince;
    }

    void onFirestoreInvalidFetched(List<String> codes, String newSince) {
        boolean changed = false;
        synchronized (this) {
            boolean stateChanged = false;
            if (codes != null) {
                for (String c : codes) {
                    if (c == null) continue;
                    String u = c.trim().toUpperCase(Locale.US);
                    if (!u.isEmpty() && globalInvalidCodes.add(u)) {
                        changed = true;
                        stateChanged = true;
                    }
                }
            }
            if (newSince != null && !newSince.isEmpty()
                    && (firestoreInvalidSince.isEmpty() || newSince.compareTo(firestoreInvalidSince) > 0)) {
                firestoreInvalidSince = newSince;
                stateChanged = true;
            }
            if (changed) {
                scanHint = 0;
                remainingCache = -1;
            }
            if (stateChanged) {
                saveState();
            }
        }
        if (changed) notifyListeners();
    }

    synchronized long deadSince() {
        return deadSince;
    }

    /** Changes to the shared dead-code list since `deadSince`. */
    void onDead(List<String> dead, List<String> alive, long cursor) {
        boolean changed = false;
        synchronized (this) {
            if (dead.isEmpty() && alive.isEmpty() && cursor == deadSince) return;
            for (String c : dead) {
                if (c == null) continue;
                String u = c.trim().toUpperCase(Locale.US);
                if (!u.isEmpty()) deadCodes.add(u);
            }
            for (String c : alive) {
                if (c == null) continue;
                String u = c.trim().toUpperCase(Locale.US);
                if (!u.isEmpty()) deadCodes.remove(u);
            }
            deadSince = Math.max(deadSince, cursor);
            if (!dead.isEmpty() || !alive.isEmpty()) {
                Log.i(TAG, "Shared dead codes: +" + dead.size() + " -" + alive.size() + " = " + deadCodes.size());
                scanHint = 0;
                remainingCache = -1;
                changed = true;
            }
            saveState();
        }
        if (changed) notifyListeners();
    }

    synchronized void onPriority(List<String> priority) {
        if (priority == null || priority.equals(serverPriority)) return;
        serverPriority.clear();
        for (String p : priority) {
            if (p != null) {
                String t = p.trim();
                if (!t.isEmpty()) serverPriority.add(t);
            }
        }
        saveState();
    }

    /** The server's whole saved history for this phone (e.g. from before a reinstall). */
    void onRestored(List<String> serverSuccess, List<String> serverInvalid, List<String> serverAlready) {
        synchronized (this) {
            restoreLocked(serverSuccess, serverInvalid, serverAlready);
        }
        notifyListeners();
    }

    private void restoreLocked(List<String> serverSuccess, List<String> serverInvalid, List<String> serverAlready) {
        int before = successCodes.size() + invalidCodes.size() + alreadyCodes.size();
        for (String c : serverSuccess) {
            if (c == null) continue;
            String u = c.trim().toUpperCase(Locale.US);
            if (u.isEmpty()) continue;
            successCodes.add(u);
            invalidCodes.remove(u);
            alreadyCodes.remove(u);
        }
        for (String c : serverAlready) {
            if (c == null) continue;
            String u = c.trim().toUpperCase(Locale.US);
            if (u.isEmpty() || successCodes.contains(u)) continue;
            invalidCodes.remove(u);
            alreadyCodes.add(u);
        }
        for (String c : serverInvalid) {
            if (c == null) continue;
            String u = c.trim().toUpperCase(Locale.US);
            if (!u.isEmpty() && !successCodes.contains(u) && !alreadyCodes.contains(u)) {
                invalidCodes.add(u);
                deadCodes.add(u);
            }
        }
        restored = true;
        int added = successCodes.size() + invalidCodes.size() + alreadyCodes.size() - before;
        Log.i(TAG, "Server backup in sync" + (added > 0 ? ", restored " + added + " tested codes" : ""));
        scanHint = 0;
        remainingCache = -1;
        saveState();
    }
}
