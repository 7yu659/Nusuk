package com.nusuk.automator.quiz;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * On-device quiz answer store (SQLite), checked before the server.
 *
 * Multi-tier matching:
 *  1. Exact normalized question + exact normalized on-screen option.
 *  2. Exact normalized question + unambiguous flexible option match (units, articles, transliteration).
 *  3. Shared server answer from nusuk.minbars.net (exact question+options hash, or verified qnorm).
 *  4. Canonicalized exact question match (honorifics, Mecca/Makkah, Allah/God, Surah/Surat, numbers) + unique option match.
 *  5. Unverified local answer (exact/canonical).
 */
public final class QuizStore extends SQLiteOpenHelper {
    private static final String TAG = "QuizStore";
    private static final String DB_NAME = "quiz.db";
    private static final int DB_VERSION = 5; // 5: purge stale server/unverified answers & remove fuzzy cross-question matching
    private static final String SEED_ASSET = "quiz_seed.json";

    private static QuizStore instance;
    private final Context appContext;
    private final ExecutorService writer = Executors.newSingleThreadExecutor();
    private volatile List<CachedRow> cachedAnswers = null;

    private static final class CachedRow {
        final String qnorm, qcanon, question, answer, anorm, acanon, source;
        final boolean verified;
        final long updatedAt;

        CachedRow(String qnorm, String question, String anorm, String answer, String source, boolean verified, long updatedAt) {
            this.qnorm = qnorm;
            this.qcanon = canonical(question);
            this.question = question;
            this.anorm = anorm;
            this.answer = answer;
            this.acanon = canonical(answer);
            this.source = source;
            this.verified = verified;
            this.updatedAt = updatedAt;
        }
    }

    public static synchronized QuizStore get(Context c) {
        if (instance == null) instance = new QuizStore(c.getApplicationContext());
        return instance;
    }

    private QuizStore(Context c) {
        super(c, DB_NAME, null, DB_VERSION);
        appContext = c;
        setWriteAheadLoggingEnabled(true);
    }

    /**
     * Same idea as the server's normQ (lowercase, every run of non-letters/digits -> one space),
     * but Unicode-aware so Arabic/Urdu/Bangla questions don't all collapse to "".
     * Strips calligraphic honorific ligatures and invisible marks so live Nusuk text matches seed/server text.
     */
    public static String norm(String s) {
        if (s == null) return "";
        String cleaned = s.replaceAll("[\\uFDF0-\\uFDFF\\u200B-\\u200F\\uFEFF\\u0640]", " ");
        return cleaned.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    }

    // ---- Canonical normalization & matching tables ----

    private static final Pattern DIACRITICS_RE = Pattern.compile("[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\p{Mn}]");
    private static final Pattern HONORIFIC_RE = Pattern.compile(
            "\\b(?:peace and blessings of (?:allah|god) be upon him|peace be upon (?:him|them|her)|" +
            "may (?:allah|god) be pleased with (?:him|her|them)|" +
            "sallallahu alayhi wa ?sallam|radiyallahu anh[ua]?|subhanahu wa ta ?ala|pbuh|saas|swt)\\b");
    private static final Pattern LEADING_Q_NUM_RE = Pattern.compile("^(?:q(?:uestion)?\\s*\\d*|\\d+)\\s*[:.)-]\\s*");
    private static final Pattern STANDALONE_S_RE = Pattern.compile("\\bs\\b");
    private static final Pattern MULTI_SPACE_RE = Pattern.compile("\\s+");
    private static final Pattern ARABIC_ARTICLE_RE = Pattern.compile("\\b(?:al|as|ash|at|ar|an|az|ad)\\s+");
    private static final Pattern LEADING_THE_RE = Pattern.compile("^the\\s+");
    private static final Pattern UNIT_TAIL_RE = Pattern.compile(
            "\\s+(?:verses?|years?|months?|days?|prayers?|times?|pebbles?|circuits?|rakah|surahs?|juz|hizb|prophets?|ce|ah)$");

    private static final Map<String, String> WORD_SYNONYMS = new HashMap<>();
    static {
        WORD_SYNONYMS.put("allah", "god");
        WORD_SYNONYMS.put("mecca", "makkah");
        WORD_SYNONYMS.put("makka", "makkah");
        WORD_SYNONYMS.put("medina", "madinah");
        WORD_SYNONYMS.put("madina", "madinah");
        WORD_SYNONYMS.put("kaabah", "kaaba");
        WORD_SYNONYMS.put("kabah", "kaaba");
        WORD_SYNONYMS.put("surat", "surah");
        WORD_SYNONYMS.put("sura", "surah");
        WORD_SYNONYMS.put("ayat", "ayah");
        WORD_SYNONYMS.put("aishah", "aisha");
        WORD_SYNONYMS.put("ayesha", "aisha");
        WORD_SYNONYMS.put("omar", "umar");
        WORD_SYNONYMS.put("othman", "uthman");
        WORD_SYNONYMS.put("khadijah", "khadija");
        WORD_SYNONYMS.put("fatimah", "fatima");
        WORD_SYNONYMS.put("hafsah", "hafsa");
        WORD_SYNONYMS.put("sumayya", "sumayyah");
        WORD_SYNONYMS.put("harithah", "haritha");
        WORD_SYNONYMS.put("hagar", "hajar");
        WORD_SYNONYMS.put("marwah", "marwa");
        WORD_SYNONYMS.put("arafat", "arafah");
        WORD_SYNONYMS.put("arafa", "arafah");
        WORD_SYNONYMS.put("tawba", "tawbah");
        WORD_SYNONYMS.put("taubah", "tawbah");
        WORD_SYNONYMS.put("baqara", "baqarah");
        WORD_SYNONYMS.put("fatiha", "fatihah");
        WORD_SYNONYMS.put("kawther", "kawthar");
        WORD_SYNONYMS.put("kausar", "kawthar");
        WORD_SYNONYMS.put("bismillah", "bismala");
        WORD_SYNONYMS.put("basmala", "bismala");
        WORD_SYNONYMS.put("hijrah", "hijra");
        WORD_SYNONYMS.put("muhajirin", "muhajirun");
        WORD_SYNONYMS.put("hudaybiyah", "hudaybiyyah");
        WORD_SYNONYMS.put("hudaibiyah", "hudaybiyyah");
        WORD_SYNONYMS.put("hudaibiyyah", "hudaybiyyah");
        WORD_SYNONYMS.put("rakaat", "rakah");
        WORD_SYNONYMS.put("rakahs", "rakah");
        WORD_SYNONYMS.put("juzz", "juz");
        WORD_SYNONYMS.put("solomon", "sulayman");
        WORD_SYNONYMS.put("sulaiman", "sulayman");
        WORD_SYNONYMS.put("moses", "musa");
        WORD_SYNONYMS.put("jesus", "isa");
        WORD_SYNONYMS.put("abraham", "ibrahim");
        WORD_SYNONYMS.put("noah", "nuh");
        WORD_SYNONYMS.put("joseph", "yusuf");
        WORD_SYNONYMS.put("david", "dawud");
        WORD_SYNONYMS.put("dawood", "dawud");
        WORD_SYNONYMS.put("ishmael", "ismail");
        WORD_SYNONYMS.put("ismael", "ismail");
        WORD_SYNONYMS.put("jonah", "yunus");
        WORD_SYNONYMS.put("job", "ayyub");
        WORD_SYNONYMS.put("shuaib", "shuayb");
        WORD_SYNONYMS.put("saleh", "salih");
        WORD_SYNONYMS.put("lot", "lut");
        WORD_SYNONYMS.put("gabriel", "jibril");
        WORD_SYNONYMS.put("jibreel", "jibril");
        WORD_SYNONYMS.put("one", "1");
        WORD_SYNONYMS.put("two", "2");
        WORD_SYNONYMS.put("three", "3");
        WORD_SYNONYMS.put("four", "4");
        WORD_SYNONYMS.put("five", "5");
        WORD_SYNONYMS.put("six", "6");
        WORD_SYNONYMS.put("seven", "7");
        WORD_SYNONYMS.put("eight", "8");
        WORD_SYNONYMS.put("nine", "9");
        WORD_SYNONYMS.put("ten", "10");
        WORD_SYNONYMS.put("eleven", "11");
        WORD_SYNONYMS.put("twelve", "12");
        WORD_SYNONYMS.put("thirteen", "13");
        WORD_SYNONYMS.put("twenty", "20");
        WORD_SYNONYMS.put("thirty", "30");
        WORD_SYNONYMS.put("forty", "40");
        WORD_SYNONYMS.put("fifty", "50");
        WORD_SYNONYMS.put("sixty", "60");
        WORD_SYNONYMS.put("seventy", "70");
        WORD_SYNONYMS.put("eighty", "80");
        WORD_SYNONYMS.put("ninety", "90");
        WORD_SYNONYMS.put("hundred", "100");
        WORD_SYNONYMS.put("thousand", "1000");
        WORD_SYNONYMS.put("first", "1st");
        WORD_SYNONYMS.put("second", "2nd");
        WORD_SYNONYMS.put("third", "3rd");
        WORD_SYNONYMS.put("fourth", "4th");
        WORD_SYNONYMS.put("fifth", "5th");
        WORD_SYNONYMS.put("sixth", "6th");
        WORD_SYNONYMS.put("seventh", "7th");
        WORD_SYNONYMS.put("eighth", "8th");
        WORD_SYNONYMS.put("ninth", "9th");
        WORD_SYNONYMS.put("tenth", "10th");
        WORD_SYNONYMS.put("eleventh", "11th");
        WORD_SYNONYMS.put("twelfth", "12th");
        WORD_SYNONYMS.put("thirteenth", "13th");
    }

    public static String canonical(String s) {
        if (s == null) return "";
        String cleaned = s.replaceAll("[\\uFDF0-\\uFDFF\\u200B-\\u200F\\uFEFF\\u0640]", " ");
        cleaned = Normalizer.normalize(cleaned, Normalizer.Form.NFKD);
        cleaned = DIACRITICS_RE.matcher(cleaned).replaceAll("");
        cleaned = cleaned.toLowerCase(Locale.ROOT);
        cleaned = LEADING_Q_NUM_RE.matcher(cleaned).replaceFirst("");
        cleaned = cleaned.replaceAll("[’']s\\b", " ");
        cleaned = cleaned.replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
        cleaned = STANDALONE_S_RE.matcher(cleaned).replaceAll(" ");
        cleaned = MULTI_SPACE_RE.matcher(cleaned).replaceAll(" ").trim();
        cleaned = HONORIFIC_RE.matcher(cleaned).replaceAll(" ");
        cleaned = cleaned.replace("holy quran", "quran")
                .replace("noble quran", "quran")
                .replace("glorious quran", "quran")
                .replace("noble mushaf", "quran")
                .replace("prophet muhammad", "prophet")
                .replace("messenger muhammad", "prophet")
                .replace("our prophet", "prophet")
                .replace("the messenger", "the prophet")
                .replace("shu ayb", "shuayb")
                .replace("ma idah", "maidah")
                .replace("rak ah", "rakah")
                .replace("rak ahs", "rakah");
        String[] parts = MULTI_SPACE_RE.matcher(cleaned).replaceAll(" ").trim().split(" ");
        StringBuilder out = new StringBuilder();
        for (String p : parts) {
            if (p.isEmpty()) continue;
            String mapped = WORD_SYNONYMS.get(p);
            if (out.length() > 0) out.append(' ');
            out.append(mapped != null ? mapped : p);
        }
        return out.toString();
    }

    private static String stripArabicArticles(String canon) {
        if (canon == null || canon.isEmpty()) return "";
        String s = ARABIC_ARTICLE_RE.matcher(canon).replaceAll(" ");
        s = LEADING_THE_RE.matcher(s.trim()).replaceFirst("");
        return MULTI_SPACE_RE.matcher(s).replaceAll(" ").trim();
    }

    private static String stripUnitTail(String s) {
        if (s == null || s.isEmpty()) return "";
        String stripped = UNIT_TAIL_RE.matcher(s).replaceFirst("").trim();
        return stripped.isEmpty() ? s : stripped;
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE answers (" +
                "qnorm TEXT NOT NULL, anorm TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL," +
                "source TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0, hits INTEGER NOT NULL DEFAULT 0," +
                "updated_at INTEGER NOT NULL, PRIMARY KEY (qnorm, anorm))");
        db.execSQL("CREATE TABLE wrong (" +
                "qnorm TEXT NOT NULL, anorm TEXT NOT NULL, answer TEXT NOT NULL, updated_at INTEGER NOT NULL," +
                "PRIMARY KEY (qnorm, anorm))");
        createServerTable(db);
        seed(db);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldV, int newV) {
        // Never drop user-verified answers: only add/refresh seed rows cleanly.
        if (oldV < 2) createServerTable(db);
        if (oldV < 5) {
            // Purge old unverified / server-cached rows so fresh verified answers sync from nusuk.minbars.net
            db.delete("server_answers", null, null);
            db.delete("answers", "verified = 0", null);
            db.delete("answers", "source = ?", new String[]{"seed"});
            seed(db);
            // Clear any corrupted wrong flags for answers present in the verified seed
            db.execSQL("DELETE FROM wrong WHERE EXISTS (SELECT 1 FROM answers a WHERE a.qnorm = wrong.qnorm AND a.anorm = wrong.anorm AND a.source = 'seed')");
        }
        cachedAnswers = null;
    }

    private static void createServerTable(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS server_answers (h TEXT PRIMARY KEY, qnorm TEXT NOT NULL," +
                " question TEXT NOT NULL, options TEXT NOT NULL, answer TEXT NOT NULL, verified INTEGER NOT NULL)");
        db.execSQL("CREATE INDEX IF NOT EXISTS server_answers_q ON server_answers (qnorm)");
    }

    // ---- the server's answers ----

    /** The server's normQ: lowercase, every run of non a-z0-9 -> one space, trim (ASCII only). */
    static String serverNorm(String s) {
        if (s == null) return "";
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    /** The server's cache key: sha256(normQ(question) + "\n" + sorted normQ(options)), base64url, 22 chars. */
    static String serverKey(String question, List<String> options) {
        List<String> o = new ArrayList<>();
        for (String x : options) o.add(serverNorm(x));
        Collections.sort(o);
        StringBuilder sb = new StringBuilder(serverNorm(question));
        for (String x : o) sb.append('\n').append(x);
        try {
            byte[] d = java.security.MessageDigest.getInstance("SHA-256").digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            String b = android.util.Base64.encodeToString(d, android.util.Base64.URL_SAFE | android.util.Base64.NO_PADDING | android.util.Base64.NO_WRAP);
            return b.substring(0, 22);
        } catch (Exception e) {
            return "";
        }
    }

    /** Applies one page from /api/quiz/answers (answer "" = retired on the server). */
    void applyServer(JSONArray list) {
        if (list == null || list.length() == 0) return;
        try {
            SQLiteDatabase db = getWritableDatabase();
            db.beginTransaction();
            try {
                for (int i = 0; i < list.length(); i++) {
                    JSONObject r = list.optJSONObject(i);
                    if (r == null) continue;
                    String h = r.optString("h", ""), a = r.optString("a", "");
                    if (h.isEmpty()) continue;
                    if (a.isEmpty()) { db.delete("server_answers", "h = ?", new String[]{h}); continue; }
                    String q = r.optString("q", "");
                    ContentValues v = new ContentValues();
                    v.put("h", h); v.put("qnorm", norm(q)); v.put("question", q);
                    JSONArray o = r.optJSONArray("o");
                    v.put("options", o != null ? o.toString() : "[]");
                    v.put("answer", a); v.put("verified", r.optInt("v", 0));
                    db.insertWithOnConflict("server_answers", null, v, SQLiteDatabase.CONFLICT_REPLACE);
                }
                db.setTransactionSuccessful();
            } finally {
                db.endTransaction();
            }
            cachedAnswers = null;
        } catch (Exception e) {
            Log.e(TAG, "applyServer", e);
        }
    }

    /** The server's answer for this question + option set, as on-screen option text (or null). */
    private Pick serverLookup(String question, List<String> options, Set<String> wrongNorms) {
        String h = serverKey(question, options);
        if (!h.isEmpty()) {
            try (Cursor c = getReadableDatabase().rawQuery("SELECT answer, verified FROM server_answers WHERE h = ?", new String[]{h})) {
                if (c.moveToFirst()) {
                    String rawAns = c.getString(0);
                    boolean ver = c.getInt(1) == 1;
                    String a = serverNorm(rawAns);
                    if (!a.isEmpty()) {
                        for (String o : options) {
                            if (serverNorm(o).equals(a) && !isWrongOption(o, wrongNorms)) {
                                return new Pick(o, "shared", ver);
                            }
                        }
                    }
                    String opt = matchUniqueOption(rawAns, options, wrongNorms);
                    if (opt != null) return new Pick(opt, "shared", ver);
                }
            } catch (Exception e) {
                Log.e(TAG, "serverLookup", e);
            }
        }
        // Fallback by normalized question for verified server answers (handles minor distractor wording tweaks).
        String qn = norm(question);
        if (!qn.isEmpty()) {
            try (Cursor c = getReadableDatabase().rawQuery(
                    "SELECT answer FROM server_answers WHERE qnorm = ? AND verified = 1", new String[]{qn})) {
                while (c.moveToNext()) {
                    String opt = matchUniqueOption(c.getString(0), options, wrongNorms);
                    if (opt != null) return new Pick(opt, "shared", true);
                }
            } catch (Exception e) {
                Log.e(TAG, "serverLookup(qnorm)", e);
            }
        }
        return null;
    }

    private Set<String> wrongSet(String question) {
        Set<String> out = new HashSet<>();
        String qn = norm(question);
        if (qn.isEmpty()) return out;
        try (Cursor c = getReadableDatabase().rawQuery("SELECT anorm, answer FROM wrong WHERE qnorm = ?", new String[]{qn})) {
            while (c.moveToNext()) {
                String an = c.getString(0);
                String ans = c.getString(1);
                if (an != null && !an.isEmpty()) out.add(an);
                String ac = canonical(ans);
                if (!ac.isEmpty()) out.add("C:" + ac);
            }
        } catch (Exception e) {
            Log.e(TAG, "wrongSet", e);
        }
        return out;
    }

    private static boolean isWrongOption(String option, Set<String> wrongSet) {
        if (wrongSet == null || wrongSet.isEmpty()) return false;
        if (wrongSet.contains(norm(option))) return true;
        String oc = canonical(option);
        return !oc.isEmpty() && wrongSet.contains("C:" + oc);
    }

    /** Answer + where it came from. */
    public static final class Pick {
        public final String answer, source;
        /** Already confirmed (by Nusuk on this phone, or verified on the server): a right result teaches the server nothing. */
        public final boolean verified;
        Pick(String a, String s, boolean v) { answer = a; source = s; verified = v; }
    }

    private List<CachedRow> getCachedRows() {
        List<CachedRow> snap = cachedAnswers;
        if (snap != null) return snap;
        List<CachedRow> loaded = new ArrayList<>();
        try (Cursor c = getReadableDatabase().rawQuery(
                "SELECT qnorm, question, anorm, answer, source, verified, updated_at FROM answers ORDER BY verified DESC, updated_at DESC",
                null)) {
            while (c.moveToNext()) {
                loaded.add(new CachedRow(
                        c.getString(0), c.getString(1), c.getString(2),
                        c.getString(3), c.getString(4), c.getInt(5) == 1, c.getLong(6)));
            }
        } catch (Exception e) {
            Log.e(TAG, "loadCache", e);
        }
        cachedAnswers = loaded;
        return loaded;
    }

    /**
     * Best known answer with no network:
     * 1. Verified exact qnorm + exact anorm
     * 2. Verified exact qnorm + unambiguous flexible option match
     * 3. Server shared answer
     * 4. Verified canonical question match + unambiguous flexible option match
     * 5. Unverified local answer (if exact/canonical)
     * Never returns an option marked wrong.
     */
    public Pick best(String question, List<String> options) {
        if (question == null || options == null || options.isEmpty()) return null;
        Set<String> bad = wrongSet(question);

        // Tier 1: Exact qnorm + exact anorm (verified)
        String vExact = lookupExact(question, options, true, bad);
        if (vExact != null) return new Pick(vExact, "local", true);

        // Tier 2: Exact qnorm + unambiguous flexible option match (verified)
        String qn = norm(question);
        List<CachedRow> rows = getCachedRows();
        if (!qn.isEmpty()) {
            for (CachedRow r : rows) {
                if (!r.verified || !r.qnorm.equals(qn)) continue;
                String opt = matchUniqueOption(r.answer, options, bad);
                if (opt != null) return new Pick(opt, "local", true);
            }
        }

        // Tier 3: Shared server answers
        Pick s = serverLookup(question, options, bad);
        if (s != null) return s;

        // Tier 4: Canonical question exact match (handles PBUH, Allah/God, Mecca/Makkah, Surah/Surat, etc.)
        String qc = canonical(question);
        if (!qc.isEmpty()) {
            for (CachedRow r : rows) {
                if (!r.verified || !r.qcanon.equals(qc)) continue;
                String opt = matchUniqueOption(r.answer, options, bad);
                if (opt != null) return new Pick(opt, "local", true);
            }
        }

        // Tier 5: Unverified local answer (from previous server reply)
        String uExact = lookupExact(question, options, false, bad);
        if (uExact != null) return new Pick(uExact, "local", false);
        if (!qc.isEmpty()) {
            for (CachedRow r : rows) {
                if (r.verified || (!r.qnorm.equals(qn) && !r.qcanon.equals(qc))) continue;
                String opt = matchUniqueOption(r.answer, options, bad);
                if (opt != null) return new Pick(opt, "local", false);
            }
        }
        return null;
    }

    /**
     * Matches a stored answer string against the current on-screen options, returning an option
     * ONLY if it matches unambiguously (not in `bad`).
     */
    static String matchUniqueOption(String storedAnswer, List<String> options, Set<String> bad) {
        if (storedAnswer == null || options == null || options.isEmpty()) return null;
        String an = norm(storedAnswer);
        String ac = canonical(storedAnswer);
        String aa = stripArabicArticles(ac);
        String au = stripUnitTail(aa);
        if (an.isEmpty() && ac.isEmpty()) return null;

        // 1. Exact norm
        for (String o : options) {
            if (!isWrongOption(o, bad) && norm(o).equals(an)) return o;
        }
        // 2. Exact canonical
        if (!ac.isEmpty()) {
            List<String> hits = new ArrayList<>();
            for (String o : options) {
                if (!isWrongOption(o, bad) && canonical(o).equals(ac)) hits.add(o);
            }
            if (hits.size() == 1) return hits.get(0);
        }
        // 3. Article-stripped canonical equality (e.g. "Abu Bakr as-Siddiq" <-> "Abu Bakr al-Siddiq")
        if (!aa.isEmpty()) {
            List<String> hits = new ArrayList<>();
            for (String o : options) {
                if (isWrongOption(o, bad)) continue;
                String oa = stripArabicArticles(canonical(o));
                if (oa.equals(aa)) hits.add(o);
            }
            if (hits.size() == 1) return hits.get(0);
        }
        // 4. Unit-stripped canonical equality (e.g. "7 verses" <-> "7", "40 years" <-> "40", "7 pebbles" <-> "7")
        if (!au.isEmpty()) {
            List<String> hits = new ArrayList<>();
            for (String o : options) {
                if (isWrongOption(o, bad)) continue;
                String ou = stripUnitTail(stripArabicArticles(canonical(o)));
                if (ou.equals(au)) hits.add(o);
            }
            if (hits.size() == 1) return hits.get(0);
        }
        return null;
    }

    public int serverCount() {
        try (Cursor c = getReadableDatabase().rawQuery("SELECT COUNT(*) FROM server_answers", null)) {
            return c.moveToFirst() ? c.getInt(0) : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private void seed(SQLiteDatabase db) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                appContext.getAssets().open(SEED_ASSET), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
            JSONObject json = new JSONObject(sb.toString());
            long now = System.currentTimeMillis() / 1000;
            int right = 0, wrong = 0;
            JSONObject r = json.optJSONObject("right");
            if (r != null) for (Iterator<String> it = r.keys(); it.hasNext(); ) {
                String q = it.next(), a = r.optString(q, "");
                if (norm(q).isEmpty() || norm(a).isEmpty()) continue;
                ContentValues v = new ContentValues();
                v.put("qnorm", norm(q)); v.put("anorm", norm(a));
                v.put("question", q); v.put("answer", a);
                v.put("source", "seed"); v.put("verified", 1); v.put("updated_at", now);
                db.insertWithOnConflict("answers", null, v, SQLiteDatabase.CONFLICT_IGNORE);
                right++;
            }
            JSONObject w = json.optJSONObject("wrong");
            if (w != null) for (Iterator<String> it = w.keys(); it.hasNext(); ) {
                String q = it.next();
                JSONArray arr = w.optJSONArray(q);
                if (arr == null) continue;
                for (int i = 0; i < arr.length(); i++) {
                    String a = arr.optString(i, "");
                    if (norm(q).isEmpty() || norm(a).isEmpty()) continue;
                    ContentValues v = new ContentValues();
                    v.put("qnorm", norm(q)); v.put("anorm", norm(a)); v.put("answer", a); v.put("updated_at", now);
                    db.insertWithOnConflict("wrong", null, v, SQLiteDatabase.CONFLICT_IGNORE);
                    wrong++;
                }
            }
            Log.i(TAG, "Seeded " + right + " answers, " + wrong + " known-wrong");
        } catch (Exception e) {
            Log.w(TAG, "No seed loaded", e);
        }
    }

    /** Opens (and on first run, creates + seeds) the DB off the main thread. */
    public void warmUp() {
        writer.execute(() -> {
            try { getWritableDatabase(); getCachedRows(); } catch (Exception e) { Log.e(TAG, "warmUp", e); }
        });
    }

    private String lookupExact(String question, List<String> options, boolean verified, Set<String> bad) {
        String qn = norm(question);
        if (qn.isEmpty() || options == null || options.isEmpty()) return null;
        try (Cursor c = getReadableDatabase().rawQuery(
                "SELECT a.anorm FROM answers a WHERE a.qnorm = ? AND a.verified = ? AND NOT EXISTS " +
                "(SELECT 1 FROM wrong w WHERE w.qnorm = a.qnorm AND w.anorm = a.anorm) " +
                "ORDER BY a.updated_at DESC", new String[]{qn, verified ? "1" : "0"})) {
            while (c.moveToNext()) {
                String an = c.getString(0);
                for (String o : options) {
                    if (!isWrongOption(o, bad) && norm(o).equals(an)) return o;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "lookupExact", e);
        }
        return null;
    }

    /** Options Nusuk already marked wrong for this question (sent to the server as `wrong`). */
    public List<String> wrongFor(String question) {
        List<String> out = new ArrayList<>();
        String qn = norm(question);
        if (qn.isEmpty()) return out;
        try (Cursor c = getReadableDatabase().rawQuery(
                "SELECT answer FROM wrong WHERE qnorm = ? ORDER BY updated_at DESC LIMIT 5", new String[]{qn})) {
            while (c.moveToNext()) out.add(c.getString(0));
        } catch (Exception e) {
            Log.e(TAG, "wrongFor", e);
        }
        return out;
    }

    /** An answer from the server (not yet confirmed by Nusuk). Never downgrades a verified row. */
    public void putUnverified(String question, String answer, String source) {
        write(question, answer, (db, qn, an, now) -> {
            ContentValues v = new ContentValues();
            v.put("qnorm", qn); v.put("anorm", an); v.put("question", question); v.put("answer", answer);
            v.put("source", source); v.put("verified", 0); v.put("updated_at", now);
            db.insertWithOnConflict("answers", null, v, SQLiteDatabase.CONFLICT_IGNORE);
        });
    }

    /** Nusuk said this answer is right. */
    public void markRight(String question, String answer, String source) {
        write(question, answer, (db, qn, an, now) -> {
            // No UPSERT: SQLite < 3.24 on Android 8-10 (minSdk 26). Update, else insert.
            db.execSQL("UPDATE answers SET verified = 1, hits = hits + 1, updated_at = ? WHERE qnorm = ? AND anorm = ?",
                    new Object[]{now, qn, an});
            ContentValues v = new ContentValues();
            v.put("qnorm", qn); v.put("anorm", an); v.put("question", question); v.put("answer", answer);
            v.put("source", source); v.put("verified", 1); v.put("hits", 1); v.put("updated_at", now);
            db.insertWithOnConflict("answers", null, v, SQLiteDatabase.CONFLICT_IGNORE);
            db.delete("wrong", "qnorm = ? AND anorm = ?", new String[]{qn, an});
        });
    }

    /** Nusuk said this answer is wrong: never pick it again (preserve seed rows in answers). */
    public void markWrong(String question, String answer) {
        write(question, answer, (db, qn, an, now) -> {
            db.delete("answers", "qnorm = ? AND anorm = ? AND source != 'seed'", new String[]{qn, an});
            ContentValues v = new ContentValues();
            v.put("qnorm", qn); v.put("anorm", an); v.put("answer", answer); v.put("updated_at", now);
            db.insertWithOnConflict("wrong", null, v, SQLiteDatabase.CONFLICT_REPLACE);
        });
    }

    private interface Op { void run(SQLiteDatabase db, String qn, String an, long now); }

    private void write(String question, String answer, Op op) {
        String qn = norm(question), an = norm(answer);
        if (qn.isEmpty() || an.isEmpty()) return;
        writer.execute(() -> {
            try {
                SQLiteDatabase db = getWritableDatabase();
                db.beginTransaction();
                try {
                    op.run(db, qn, an, System.currentTimeMillis() / 1000);
                    db.setTransactionSuccessful();
                } finally {
                    db.endTransaction();
                }
                cachedAnswers = null;
            } catch (Exception e) {
                Log.e(TAG, "write", e);
            }
        });
    }
}
