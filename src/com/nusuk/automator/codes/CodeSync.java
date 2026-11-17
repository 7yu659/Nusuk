package com.nusuk.automator.codes;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import com.nusuk.automator.core.Http;

/**
 * Backs up this phone's tested codes to the server (/api/app/progress) AND shares invalid codes
 * immediately across all users via Firebase Firestore (nusukhub / invalid_codes).
 * Never shares "already used" codes globally — only codes that Nusuk rejected as invalid.
 */
public final class CodeSync {
    private static final String TAG = "CodeSync";
    /** Results are batched: one upload at most this long after a new result. */
    static final long PUSH_DELAY_MS = 20_000;
    /** Invalid codes are pushed globally almost immediately so no other phone retries them. */
    static final long FAST_PUSH_DELAY_MS = 2_000;
    private static final int CHUNK = 2000;           // codes per /api/app/progress request
    private static final int FIRESTORE_COMMIT_CHUNK = 450; // Firestore commit limit is 500 writes
    private static final long RETRY_MIN_MS = 30_000;
    private static final long RETRY_MAX_MS = 10 * 60_000;
    private static final long DEAD_CHECK_MS = 60_000; // refresh shared invalid & dead codes every 60s

    private static final String FS_DOCS =
            "https://firestore.googleapis.com/v1/projects/nusukhub/databases/(default)/documents";
    private static final String FS_INVALID_COLLECTION = FS_DOCS + "/invalid_codes";
    private static final String FS_COMMIT_URL = FS_DOCS + ":commit";
    private static final String FS_QUERY_URL = FS_DOCS + ":runQuery";
    private static final String FS_INVALID_DOC_PREFIX =
            "projects/nusukhub/databases/(default)/documents/invalid_codes/";

    private static final ScheduledExecutorService exec = Executors.newSingleThreadScheduledExecutor();
    private static ScheduledFuture<?> pending;
    private static long pendingAt = Long.MAX_VALUE;
    private static long retryMs = RETRY_MIN_MS;
    private static volatile long lastDeadCheck = 0;
    private static volatile long lastFsInvalidPull = 0;
    public static volatile boolean lastSyncFailed = false;

    private CodeSync() {}

    /** Runs a sync within `delayMs` (or reschedules sooner if an earlier time is requested). */
    public static synchronized void syncSoon(Context ctx, long delayMs) {
        final Context app = ctx.getApplicationContext();
        long at = System.currentTimeMillis() + delayMs;
        if (pending != null && !pending.isDone() && pendingAt <= at) return;
        if (pending != null) pending.cancel(false);
        pendingAt = at;
        pending = exec.schedule(() -> run(app), delayMs, TimeUnit.MILLISECONDS);
    }

    private static void run(Context ctx) {
        synchronized (CodeSync.class) { pendingAt = Long.MAX_VALUE; }
        KeyRepository repo = KeyRepository.getInstance(ctx);
        boolean progressFailed = false;
        boolean firestoreFailed = false;

        try {
            if (repo.needsRestore()) {
                // Push everything we have, in chunks; the last call asks for the full history.
                List<List<String>> all = repo.snapshotTested();
                List<String> s = all.get(0), i = all.get(1), a = all.get(2);
                int total = s.size() + i.size() + a.size(), off = 0;
                do {
                    List<String> cs = new ArrayList<>(), ci = new ArrayList<>(), ca = new ArrayList<>();
                    for (int k = off; k < Math.min(total, off + CHUNK); k++) {
                        if (k < s.size()) cs.add(s.get(k));
                        else if (k < s.size() + a.size()) ca.add(a.get(k - s.size()));
                        else ci.add(i.get(k - s.size() - a.size()));
                    }
                    off += CHUNK;
                    boolean last = off >= total;
                    JSONObject r = post(ctx, repo, cs, ci, ca, last);
                    if (last) repo.onRestored(strings(r.optJSONArray("success")), strings(r.optJSONArray("invalid")), strings(r.optJSONArray("already")));
                } while (off < total);
            }
            while (true) {
                List<List<String>> next = repo.nextPending(CHUNK);
                List<String> s = next.get(0), i = next.get(1), a = next.get(2);
                if (s.isEmpty() && i.isEmpty() && a.isEmpty()) break;
                post(ctx, repo, s, i, a, false);
                repo.onUploaded(s, i, a);
            }
            // Nothing to upload: still fetch dead-list changes (every 60s).
            if (System.currentTimeMillis() - lastDeadCheck > DEAD_CHECK_MS) {
                JSONObject r = post(ctx, repo, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), false);
                if (r.optBoolean("deadMore")) syncSoon(ctx, 2000);
            }
            lastSyncFailed = false;
        } catch (Exception e) {
            progressFailed = true;
            lastSyncFailed = true;
            Log.w(TAG, "Progress sync failed: " + e.getMessage());
        }

        // Firestore global invalid_codes sync runs independently so a server hiccup never delays global invalidation.
        try {
            pushFirestoreInvalid(repo);
            if (System.currentTimeMillis() - lastFsInvalidPull > DEAD_CHECK_MS) {
                pullFirestoreInvalid(repo);
                lastFsInvalidPull = System.currentTimeMillis();
            }
        } catch (Exception e) {
            firestoreFailed = true;
            Log.w(TAG, "Firestore invalid_codes sync failed: " + e.getMessage());
        }

        if (progressFailed || firestoreFailed) {
            long wait = retryMs;
            retryMs = Math.min(RETRY_MAX_MS, retryMs * 2);
            syncSoon(ctx, wait);
        } else {
            retryMs = RETRY_MIN_MS;
        }
    }

    private static void pushFirestoreInvalid(KeyRepository repo) throws Exception {
        while (true) {
            List<String> batch = repo.nextPendingFirestoreInvalid(FIRESTORE_COMMIT_CHUNK);
            if (batch.isEmpty()) break;
            JSONArray writes = new JSONArray();
            for (String code : batch) {
                JSONObject fields = new JSONObject()
                        .put("code", new JSONObject().put("stringValue", code));
                JSONObject update = new JSONObject()
                        .put("name", FS_INVALID_DOC_PREFIX + code)
                        .put("fields", fields);
                JSONObject transform = new JSONObject()
                        .put("fieldPath", "reportedAt")
                        .put("setToServerValue", "REQUEST_TIME");
                writes.put(new JSONObject()
                        .put("update", update)
                        .put("updateTransforms", new JSONArray().put(transform)));
            }
            postFirestoreJson(FS_COMMIT_URL, new JSONObject().put("writes", writes));
            repo.onFirestoreInvalidUploaded(batch);
        }
    }

    private static void pullFirestoreInvalid(KeyRepository repo) throws Exception {
        String since = repo.firestoreInvalidSince();
        if (since == null || since.isEmpty()) {
            String pageToken = "";
            String maxTs = "";
            int guard = 0;
            while (guard++ < 500) {
                StringBuilder url = new StringBuilder(FS_INVALID_COLLECTION)
                        .append("?pageSize=300")
                        .append("&mask.fieldPaths=code")
                        .append("&mask.fieldPaths=reportedAt");
                if (!pageToken.isEmpty()) {
                    url.append("&pageToken=").append(URLEncoder.encode(pageToken, "UTF-8"));
                }
                JSONObject r = getFirestoreJson(url.toString());
                JSONArray docs = r.optJSONArray("documents");
                List<String> codes = new ArrayList<>();
                if (docs != null) {
                    for (int i = 0; i < docs.length(); i++) {
                        JSONObject doc = docs.optJSONObject(i);
                        if (doc == null) continue;
                        String code = extractInvalidCode(doc);
                        if (!code.isEmpty()) codes.add(code);
                        String ts = extractReportedAt(doc);
                        if (!ts.isEmpty() && (maxTs.isEmpty() || ts.compareTo(maxTs) > 0)) maxTs = ts;
                    }
                }
                pageToken = r.optString("nextPageToken", "").trim();
                boolean lastPage = pageToken.isEmpty() || docs == null || docs.length() == 0;
                if (!codes.isEmpty() || lastPage) {
                    repo.onFirestoreInvalidFetched(codes, lastPage ? maxTs : "");
                }
                if (lastPage) break;
            }
        } else {
            final String fixedSince = since;
            final int pageSize = 500;
            String maxTs = "";
            int offset = 0;
            int guard = 0;
            while (guard++ < 200) {
                JSONObject select = new JSONObject().put("fields", new JSONArray()
                        .put(new JSONObject().put("fieldPath", "code"))
                        .put(new JSONObject().put("fieldPath", "reportedAt")));
                JSONObject filter = new JSONObject().put("fieldFilter", new JSONObject()
                        .put("field", new JSONObject().put("fieldPath", "reportedAt"))
                        .put("op", "GREATER_THAN")
                        .put("value", new JSONObject().put("timestampValue", fixedSince)));
                JSONObject order = new JSONObject()
                        .put("field", new JSONObject().put("fieldPath", "reportedAt"))
                        .put("direction", "ASCENDING");
                JSONObject structured = new JSONObject()
                        .put("from", new JSONArray().put(new JSONObject().put("collectionId", "invalid_codes")))
                        .put("select", select)
                        .put("where", filter)
                        .put("orderBy", new JSONArray().put(order))
                        .put("offset", offset)
                        .put("limit", pageSize);

                JSONArray rows = postFirestoreQuery(new JSONObject().put("structuredQuery", structured));
                List<String> codes = new ArrayList<>();
                int docCount = 0;
                for (int i = 0; i < rows.length(); i++) {
                    JSONObject row = rows.optJSONObject(i);
                    if (row == null) continue;
                    JSONObject doc = row.optJSONObject("document");
                    if (doc == null) continue;
                    docCount++;
                    String code = extractInvalidCode(doc);
                    if (!code.isEmpty()) codes.add(code);
                    String ts = extractReportedAt(doc);
                    if (!ts.isEmpty() && (maxTs.isEmpty() || ts.compareTo(maxTs) > 0)) maxTs = ts;
                }
                boolean lastPage = docCount < pageSize;
                if (!codes.isEmpty() || lastPage) {
                    repo.onFirestoreInvalidFetched(codes, lastPage ? maxTs : "");
                }
                if (lastPage) break;
                offset += docCount;
            }
        }
    }

    private static String extractInvalidCode(JSONObject doc) {
        JSONObject fields = doc.optJSONObject("fields");
        if (fields != null) {
            JSONObject cf = fields.optJSONObject("code");
            if (cf != null) {
                String c = cf.optString("stringValue", "").trim();
                if (!c.isEmpty()) return c;
            }
        }
        String name = doc.optString("name", "");
        int slash = name.lastIndexOf('/');
        return slash >= 0 ? name.substring(slash + 1).trim() : "";
    }

    private static String extractReportedAt(JSONObject doc) {
        JSONObject fields = doc.optJSONObject("fields");
        if (fields != null) {
            JSONObject rf = fields.optJSONObject("reportedAt");
            if (rf != null) {
                String ts = rf.optString("timestampValue", "").trim();
                if (!ts.isEmpty()) return ts;
            }
        }
        return doc.optString("updateTime", "").trim();
    }

    private static JSONObject getFirestoreJson(String urlStr) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "application/json");
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(20_000);
        try {
            int status = conn.getResponseCode();
            String body = readStream(status < 400 ? conn.getInputStream() : conn.getErrorStream());
            if (status != 200) throw new Exception("Firestore GET HTTP " + status);
            return new JSONObject(body);
        } finally {
            conn.disconnect();
        }
    }

    private static JSONObject postFirestoreJson(String urlStr, JSONObject payload) throws Exception {
        String body = executeFirestorePost(urlStr, payload);
        return body.isEmpty() ? new JSONObject() : new JSONObject(body);
    }

    private static JSONArray postFirestoreQuery(JSONObject payload) throws Exception {
        String body = executeFirestorePost(FS_QUERY_URL, payload);
        return body.isEmpty() ? new JSONArray() : new JSONArray(body);
    }

    private static String executeFirestorePost(String urlStr, JSONObject payload) throws Exception {
        byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(20_000);
        conn.setDoOutput(true);
        conn.setFixedLengthStreamingMode(bytes.length);
        try {
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
            }
            int status = conn.getResponseCode();
            String body = readStream(status < 400 ? conn.getInputStream() : conn.getErrorStream());
            if (status != 200) throw new Exception("Firestore POST HTTP " + status + " " + body);
            return body.trim();
        } finally {
            conn.disconnect();
        }
    }

    private static String readStream(InputStream in) throws Exception {
        if (in == null) return "";
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            char[] buf = new char[16384];
            int n;
            while ((n = br.read(buf)) > 0) sb.append(buf, 0, n);
        }
        return sb.toString();
    }

    private static List<String> strings(JSONArray a) {
        List<String> out = new ArrayList<>();
        if (a != null) {
            for (int k = 0; k < a.length(); k++) {
                if (a.isNull(k)) continue;
                String s = a.optString(k, "").trim();
                if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) out.add(s);
            }
        }
        return out;
    }

    /** One sync call. Every reply also carries the priority keys and dead-list changes, applied here. */
    private static JSONObject post(Context ctx, KeyRepository repo, List<String> success, List<String> invalid,
                                   List<String> already, boolean full) throws Exception {
        JSONObject r = postRaw(ctx, success, invalid, already, full, repo.deadSince());
        repo.onPriority(strings(r.optJSONArray("priority")));
        if (r.has("deadAt")) {
            repo.onDead(strings(r.optJSONArray("dead")), strings(r.optJSONArray("alive")), r.optLong("deadAt"));
            lastDeadCheck = System.currentTimeMillis();
        }
        return r;
    }

    private static JSONObject postRaw(Context ctx, List<String> success, List<String> invalid, List<String> already,
                                      boolean full, long deadSince) throws Exception {
        JSONObject body = new JSONObject();
        body.put("success", new JSONArray(success));
        body.put("invalid", new JSONArray(invalid));
        body.put("already", new JSONArray(already));
        body.put("full", full);
        body.put("deadSince", deadSince);
        Http.Response r = Http.postJson(ctx, "/api/app/progress", body, 10_000, 20_000);
        if (r.status != 200) throw new Exception("HTTP " + r.status + " " + r.body);
        return new JSONObject(r.body);
    }
}
