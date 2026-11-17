package com.nusuk.automator.codes;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import com.nusuk.automator.core.Http;

/**
 * Pulls the shared code database into {@link KeyRepository}.
 * Downloads BOTH:
 * 1) Firestore (nusukhub / nusuk_codes) ordered newest-first (createdAt DESC), so recently
 *    uploaded data-page codes are placed at the front and tried first.
 * 2) The full /api/app/codes database (all 50-60k+ / 134k+ pages until done=true), retrying
 *    transient errors per page so every code in the database is guaranteed to be fetched.
 */
public final class CodeDownloader {
    private static final String TAG = "CodeDownloader";
    private static final long RECHECK_MS = 15 * 60 * 1000L;
    private static final String FIRESTORE_DOCUMENTS_URL =
            "https://firestore.googleapis.com/v1/projects/nusukhub/databases/(default)/documents";
    private static final String FIRESTORE_CODES_URL = FIRESTORE_DOCUMENTS_URL + "/nusuk_codes";
    private static final String FIRESTORE_RUN_QUERY_URL = FIRESTORE_DOCUMENTS_URL + ":runQuery";
    private static final Pattern VALID_CODE = Pattern.compile("^NG-[A-Za-z0-9]{8}$", Pattern.CASE_INSENSITIVE);

    public static volatile boolean running = false;
    public static volatile boolean failed = false;
    public static volatile boolean firestoreSynced = false;
    public static volatile int serverTotal = 0;
    public static volatile Runnable onProgress; // set by the screen that shows progress (any thread)
    private static volatile long lastDone = 0;

    private CodeDownloader() {}

    /** True once the entire /api/app/codes database AND Firestore have completed syncing cleanly. */
    public static boolean isFullySynced(KeyRepository repo) {
        return repo != null && repo.isLoaded() && repo.isApiCodesDone() && firestoreSynced && repo.getTotalCount() > 0;
    }

    /** Starts a download if the list is incomplete, or the last full check is old. `force` skips the age check. */
    public static synchronized void start(Context ctx, boolean force) {
        if (running) return;
        Context app = ctx.getApplicationContext();
        KeyRepository repo = KeyRepository.getInstance(app);
        if (!repo.isLoaded()) { // saved list still loading: decide once it is (else it looks empty)
            repo.whenLoaded(() -> start(app, force));
            return;
        }
        boolean incomplete = !isFullySynced(repo);
        if (!force && !incomplete && System.currentTimeMillis() - lastDone < RECHECK_MS) return;
        running = true;
        failed = false;
        changed();
        new Thread(() -> run(app, repo), "code-download").start();
    }

    private static void run(Context ctx, KeyRepository repo) {
        boolean fsOk = false;
        boolean apiOk = false;
        List<String> firestoreCodes = new ArrayList<>();
        List<String> pinnedCodes = new ArrayList<>();
        long prevCursor = repo.codesCursor();
        boolean wasApiDone = repo.isApiCodesDone();

        try {
            try {
                fsOk = fetchFromFirestore(firestoreCodes, pinnedCodes);
                if (fsOk) {
                    firestoreSynced = true;
                    boolean forcePromote = (repo.getTotalCount() == 0) || !wasApiDone;
                    repo.applyFirestoreCodes(firestoreCodes, pinnedCodes, forcePromote);
                }
            } catch (Exception fsErr) {
                Log.w(TAG, "Firestore code fetch failed: " + fsErr.getMessage());
            }

            try {
                apiOk = fetchFromApi(ctx, repo);
            } catch (Exception apiErr) {
                Log.w(TAG, "API code fetch failed: " + apiErr.getMessage());
            }

            // On an initial or resumed bulk API download, re-promote Firestore newest codes to index 0
            // so the most recently uploaded data-page codes are tried right before bulk API codes.
            if (fsOk && !firestoreCodes.isEmpty() && (!wasApiDone || prevCursor == 0)) {
                repo.applyFirestoreCodes(firestoreCodes, pinnedCodes, true);
            }

            if (fsOk && apiOk && repo.isApiCodesDone()) {
                lastDone = System.currentTimeMillis();
                failed = false;
            } else {
                // Only mark failed if neither source managed anything or the API bulk list is still incomplete.
                failed = !repo.isApiCodesDone() || (!fsOk && !apiOk);
            }
            Log.i(TAG, "Code sync finished: total=" + repo.getTotalCount()
                    + ", fsOk=" + fsOk + ", apiOk=" + apiOk + ", apiDone=" + repo.isApiCodesDone());
        } catch (Exception e) {
            Log.w(TAG, "Code download failed", e);
            failed = true;
        } finally {
            running = false;
            changed();
        }
    }

    private static boolean fetchFromApi(Context ctx, KeyRepository repo) throws Exception {
        long after = repo.codesCursor();
        while (true) {
            JSONObject r = postWithRetry(ctx, after, 3);
            JSONArray arr = r.optJSONArray("codes");
            List<String> page = new ArrayList<>();
            if (arr != null) {
                for (int i = 0; i < arr.length(); i++) {
                    if (arr.isNull(i)) continue;
                    String s = arr.optString(i, "").trim();
                    if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) page.add(s);
                }
            }
            long last = r.optLong("last", after);
            boolean done = r.optBoolean("done", true);
            serverTotal = Math.max(serverTotal, r.optInt("total", serverTotal));
            repo.prependApiPage(page, last, done);
            after = last;
            changed();
            if (done || page.isEmpty()) break;
        }
        return repo.isApiCodesDone();
    }

    private static JSONObject postWithRetry(Context ctx, long after, int maxAttempts) throws Exception {
        Exception lastErr = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return post(ctx, after);
            } catch (Exception e) {
                lastErr = e;
                Log.w(TAG, "API codes page after=" + after + " attempt " + attempt + " failed: " + e.getMessage());
                if (attempt < maxAttempts) {
                    try { Thread.sleep(800L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw e; }
                }
            }
        }
        throw lastErr;
    }

    private static boolean fetchFromFirestore(List<String> outCodes, List<String> outPinned) throws Exception {
        try {
            fetchFirestoreOrdered(outCodes, outPinned);
            return true;
        } catch (Exception queryErr) {
            Log.w(TAG, "Firestore runQuery failed, falling back to document list: " + queryErr.getMessage());
            outCodes.clear();
            outPinned.clear();
            fetchFirestoreUnordered(outCodes, outPinned);
            return true;
        }
    }

    /** Fetches Firestore `nusuk_codes` ordered by `createdAt DESCENDING` (newest-first). */
    private static void fetchFirestoreOrdered(List<String> outCodes, List<String> outPinned) throws Exception {
        final int pageSize = 500;
        int offset = 0;
        int guard = 0;
        while (guard++ < 500) { // up to 250,000 docs
            JSONObject select = new JSONObject().put("fields", new JSONArray()
                    .put(new JSONObject().put("fieldPath", "code"))
                    .put(new JSONObject().put("fieldPath", "status"))
                    .put(new JSONObject().put("fieldPath", "isPinned")));
            JSONObject order = new JSONObject()
                    .put("field", new JSONObject().put("fieldPath", "createdAt"))
                    .put("direction", "DESCENDING");
            JSONObject structured = new JSONObject()
                    .put("from", new JSONArray().put(new JSONObject().put("collectionId", "nusuk_codes")))
                    .put("select", select)
                    .put("orderBy", new JSONArray().put(order))
                    .put("offset", offset)
                    .put("limit", pageSize);
            JSONObject payload = new JSONObject().put("structuredQuery", structured);

            JSONArray rows = postFirestoreQueryWithRetry(payload, 2);
            int docCount = 0;
            for (int i = 0; i < rows.length(); i++) {
                JSONObject row = rows.optJSONObject(i);
                if (row == null) continue;
                JSONObject doc = row.optJSONObject("document");
                if (doc == null) continue;
                docCount++;
                collectFirestoreDoc(doc, outCodes, outPinned);
            }
            serverTotal = Math.max(serverTotal, outCodes.size());
            changed();
            if (docCount < pageSize) break;
            offset += docCount;
        }
        Log.i(TAG, "Firestore ordered sync complete: " + outCodes.size() + " valid codes (" + outPinned.size() + " pinned)");
    }

    private static void fetchFirestoreUnordered(List<String> outCodes, List<String> outPinned) throws Exception {
        String pageToken = "";
        int guard = 0;
        while (guard++ < 1000) { // up to 300,000 codes safely
            StringBuilder url = new StringBuilder(FIRESTORE_CODES_URL)
                    .append("?pageSize=300")
                    .append("&mask.fieldPaths=code")
                    .append("&mask.fieldPaths=status")
                    .append("&mask.fieldPaths=isPinned");
            if (!pageToken.isEmpty()) {
                url.append("&pageToken=").append(URLEncoder.encode(pageToken, "UTF-8"));
            }

            JSONObject r = getJson(url.toString());
            JSONArray docs = r.optJSONArray("documents");
            if (docs != null) {
                for (int i = 0; i < docs.length(); i++) {
                    JSONObject doc = docs.optJSONObject(i);
                    if (doc != null) collectFirestoreDoc(doc, outCodes, outPinned);
                }
            }
            serverTotal = Math.max(serverTotal, outCodes.size());
            changed();

            pageToken = r.optString("nextPageToken", "").trim();
            if (pageToken.isEmpty() || docs == null || docs.length() == 0) break;
        }
        Log.i(TAG, "Firestore list sync complete: " + outCodes.size() + " valid codes (" + outPinned.size() + " pinned)");
    }

    private static void collectFirestoreDoc(JSONObject doc, List<String> outCodes, List<String> outPinned) {
        JSONObject fields = doc.optJSONObject("fields");
        if (fields == null) return;
        String status = strField(fields, "status");
        if ("invalid".equalsIgnoreCase(status) || "dead".equalsIgnoreCase(status)) return;
        String code = strField(fields, "code");
        if (!VALID_CODE.matcher(code).matches()) return;
        code = "NG-" + code.substring(3);
        outCodes.add(code);
        if (boolField(fields, "isPinned")) {
            outPinned.add(code);
        }
    }

    private static JSONArray postFirestoreQueryWithRetry(JSONObject payload, int maxAttempts) throws Exception {
        Exception lastErr = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return postFirestoreQuery(payload);
            } catch (Exception e) {
                lastErr = e;
                if (attempt < maxAttempts) {
                    try { Thread.sleep(600L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw e; }
                }
            }
        }
        throw lastErr;
    }

    private static JSONArray postFirestoreQuery(JSONObject payload) throws Exception {
        byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
        HttpURLConnection conn = (HttpURLConnection) new URL(FIRESTORE_RUN_QUERY_URL).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(25_000);
        conn.setDoOutput(true);
        conn.setFixedLengthStreamingMode(bytes.length);
        try {
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
            }
            int status = conn.getResponseCode();
            java.io.InputStream in = status < 400 ? conn.getInputStream() : conn.getErrorStream();
            StringBuilder sb = new StringBuilder();
            if (in != null) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                    char[] buf = new char[16384];
                    int n;
                    while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
                }
            }
            if (status != 200) throw new Exception("Firestore query HTTP " + status);
            String body = sb.toString().trim();
            if (body.isEmpty()) return new JSONArray();
            return new JSONArray(body);
        } finally {
            conn.disconnect();
        }
    }

    private static String strField(JSONObject fields, String name) {
        JSONObject f = fields.optJSONObject(name);
        if (f == null) return "";
        return f.optString("stringValue", "").trim();
    }

    private static boolean boolField(JSONObject fields, String name) {
        JSONObject f = fields.optJSONObject(name);
        return f != null && f.optBoolean("booleanValue", false);
    }

    private static JSONObject getJson(String urlStr) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "application/json");
        conn.setInstanceFollowRedirects(true);
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(25_000);
        try {
            int status = conn.getResponseCode();
            java.io.InputStream in = status < 400 ? conn.getInputStream() : conn.getErrorStream();
            StringBuilder sb = new StringBuilder();
            if (in != null) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                    char[] buf = new char[16384];
                    int n;
                    while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
                }
            }
            if (status != 200) throw new Exception("Firestore HTTP " + status);
            return new JSONObject(sb.toString());
        } finally {
            conn.disconnect();
        }
    }

    private static void changed() {
        Runnable r = onProgress;
        if (r != null) r.run();
    }

    private static JSONObject post(Context ctx, long after) throws Exception {
        Http.Response r = Http.postJson(ctx, "/api/app/codes", new JSONObject().put("after", after), 12_000, 30_000);
        if (r.status != 200) throw new Exception("HTTP " + r.status);
        return new JSONObject(r.body);
    }
}
