package com.nusuk.automator.codes;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
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
 * Tries the configured API endpoint (/api/app/codes) first, and falls back directly to the
 * Firebase Firestore database (nusukhub / nusuk_codes) so all database codes are always fetched.
 */
public final class CodeDownloader {
    private static final String TAG = "CodeDownloader";
    private static final long RECHECK_MS = 15 * 60 * 1000L;
    private static final String FIRESTORE_CODES_URL =
            "https://firestore.googleapis.com/v1/projects/nusukhub/databases/(default)/documents/nusuk_codes";
    private static final Pattern VALID_CODE = Pattern.compile("^NG-[A-Za-z0-9]{8}$", Pattern.CASE_INSENSITIVE);

    public static volatile boolean running = false;
    public static volatile boolean failed = false;
    public static volatile int serverTotal = 0;
    public static volatile Runnable onProgress; // set by the screen that shows progress (any thread)
    private static volatile long lastDone = 0;

    private CodeDownloader() {}

    /** Starts a download if the list is empty, or the last full check is old. `force` skips the age check. */
    public static synchronized void start(Context ctx, boolean force) {
        if (running) return;
        Context app = ctx.getApplicationContext();
        KeyRepository repo = KeyRepository.getInstance(app);
        if (!repo.isLoaded()) { // saved list still loading: decide once it is (else it looks empty)
            repo.whenLoaded(() -> start(app, force));
            return;
        }
        boolean empty = repo.getTotalCount() == 0;
        if (!force && !empty && System.currentTimeMillis() - lastDone < RECHECK_MS) return;
        running = true;
        failed = false;
        changed();
        new Thread(() -> run(app, repo), "code-download").start();
    }

    private static void run(Context ctx, KeyRepository repo) {
        try {
            boolean apiOk = false;
            try {
                apiOk = fetchFromApi(ctx, repo);
            } catch (Exception apiErr) {
                Log.w(TAG, "API code fetch failed, falling back to Firestore: " + apiErr.getMessage());
            }

            if (!apiOk || repo.getTotalCount() == 0) {
                fetchFromFirestore(repo);
            }

            lastDone = System.currentTimeMillis();
            Log.i(TAG, "Code list up to date: " + repo.getTotalCount() + " codes");
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
        int pulled = 0;
        while (true) {
            JSONObject r = post(ctx, after);
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
            serverTotal = r.optInt("total", serverTotal);
            pulled += page.size();
            repo.appendCodes(page, last);
            after = last;
            changed();
            if (r.optBoolean("done", true) || page.isEmpty()) break;
        }
        return pulled > 0 || repo.getTotalCount() > 0;
    }

    private static void fetchFromFirestore(KeyRepository repo) throws Exception {
        String pageToken = "";
        int fetched = 0;
        List<String> priority = new ArrayList<>();
        int guard = 0;

        while (guard++ < 200) { // up to 60,000 codes safely
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
            List<String> page = new ArrayList<>();
            if (docs != null) {
                for (int i = 0; i < docs.length(); i++) {
                    JSONObject doc = docs.optJSONObject(i);
                    if (doc == null) continue;
                    JSONObject fields = doc.optJSONObject("fields");
                    if (fields == null) continue;
                    String code = strField(fields, "code");
                    if (!VALID_CODE.matcher(code).matches()) continue;
                    code = "NG-" + code.substring(3);
                    page.add(code);

                    boolean pinned = boolField(fields, "isPinned");
                    String status = strField(fields, "status");
                    if (pinned || "verified".equalsIgnoreCase(status)) {
                        priority.add(code);
                    }
                }
            }

            fetched += page.size();
            serverTotal = Math.max(serverTotal, fetched);
            if (!page.isEmpty()) {
                repo.appendCodes(page, repo.codesCursor());
            }
            changed();

            pageToken = r.optString("nextPageToken", "").trim();
            if (pageToken.isEmpty() || docs == null || docs.length() == 0) break;
        }

        if (!priority.isEmpty()) {
            repo.onPriority(priority);
        }
        Log.i(TAG, "Firestore sync complete: fetched " + fetched + " valid codes (" + priority.size() + " priority)");
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
        conn.setReadTimeout(20_000);
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
        Http.Response r = Http.postJson(ctx, "/api/app/codes", new JSONObject().put("after", after), 6_000, 10_000);
        if (r.status != 200) throw new Exception("HTTP " + r.status);
        return new JSONObject(r.body);
    }
}
