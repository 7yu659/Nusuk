package com.nusuk.automator.update;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.nusuk.automator.R;
import com.nusuk.automator.automation.AutomationService;
import com.nusuk.automator.core.AppInfo;
import com.nusuk.automator.core.L;
import com.nusuk.automator.core.Links;
import com.nusuk.automator.ui.AdPopup;

/**
 * Mandatory GitHub-driven update checker.
 * Queries GitHub Releases API (with a rate-limit-free releases/latest redirect fallback, plus raw
 * version.json fallback). Whenever ANY newer release/build exists on GitHub, the user is blocked by
 * an un-dismissible force-update modal until they download and install the new APK.
 */
public final class UpdateChecker {
    private static final String TAG = "UpdateChecker";
    private static final String DEFAULT_URL = Links.GITHUB_RELEASES_URL;
    private static final long CHECK_MIN_GAP_MS = 15_000L; // avoids spamming on rapid Activity switches
    private static final String PREFS = "update";

    private static final ExecutorService exec = Executors.newSingleThreadExecutor();
    private static final Handler main = new Handler(Looper.getMainLooper());
    private static final Pattern BUILD_TAG_RE = Pattern.compile("(?i)(?:^|[-_b])(\\d+)$");
    private static final Pattern ATOM_TAG_RE = Pattern.compile("/releases/tag/([^\"'<\\s]+)");
    private static volatile boolean fetchInFlight = false;
    private static volatile long fetchStartedAt = 0;

    /** GitHub answered over HTTPS that no releases or version.json exist yet (not a network error). */
    private static final class NoReleaseException extends Exception {}

    private static String githubRepo(Context c) {
        try {
            String r = c.getString(R.string.github_repo).trim();
            if (!r.isEmpty() && r.contains("/")) return r;
        } catch (Exception ignored) {}
        return Links.GITHUB_REPO;
    }

    /** What GitHub reports, or null when up to date / unknown. */
    public static final class Info {
        public int versionCode;
        public int buildNumber;
        public String versionName = "";
        public String url = DEFAULT_URL;
        public String htmlUrl = DEFAULT_URL;
        public String notes = "";
        public String sha256 = "";
    }

    public interface Listener {
        void onChecked(Info newer);
    }

    private UpdateChecker() {}

    static int currentVersionCode(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    static int currentBuildNumber(Context c) {
        try {
            return Integer.parseInt(c.getString(R.string.github_build).trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** True if a newer GitHub version is already known and must block app usage until updated. */
    public static boolean isBlocked(Context c) {
        Info cached = readCached(c);
        return cached != null && isNewer(c, cached);
    }

    /** Checks GitHub on app resume; enforces an un-dismissible update modal whenever any update exists. */
    public static void autoCheck(Activity a, Listener badge) {
        autoCheck(a, badge, false);
    }

    /** Checks GitHub immediately when {@code forceFresh} is true (e.g. fresh app open). */
    public static void autoCheck(Activity a, Listener badge, boolean forceFresh) {
        SharedPreferences p = prefs(a);
        Info cached = readCached(a);
        if (cached != null) {
            boolean newer = isNewer(a, cached);
            if (badge != null) badge.onChecked(newer ? cached : null);
            if (newer) {
                showForcedDialog(a, cached);
            }
        }
        long now = System.currentTimeMillis();
        long last = p.getLong("lastCheck", 0);
        if (!forceFresh && last <= now && now - last < CHECK_MIN_GAP_MS) return;
        if (fetchInFlight && now - fetchStartedAt < 25_000L) return;
        fetch(a, info -> {
            p.edit().putLong("lastCheck", System.currentTimeMillis()).apply();
            if (badge != null) badge.onChecked(info);
            if (info != null) showForcedDialog(a, info);
        }, false);
    }

    /** Manual check from footer/settings: queries GitHub immediately. */
    public static void manualCheck(Activity a, Listener badge) {
        Toast.makeText(a, L.t(a, "Checking for updates..."), Toast.LENGTH_SHORT).show();
        fetch(a, info -> {
            prefs(a).edit().putLong("lastCheck", System.currentTimeMillis()).apply();
            if (badge != null) badge.onChecked(info);
            if (info != null) showForcedDialog(a, info);
            else Toast.makeText(a, L.t(a, "You have the latest version"), Toast.LENGTH_SHORT).show();
        }, true);
    }

    static boolean isNewer(Context c, Info i) {
        if (i == null) return false;
        int curCode = currentVersionCode(c);
        int curBuild = currentBuildNumber(c);
        String curName = AppInfo.versionName(c);
        if (i.versionCode > curCode) return true;
        int semverCmp = compareSemver(i.versionName, curName);
        if (semverCmp > 0) return true;
        if (i.buildNumber > curBuild && i.buildNumber > 0) {
            if (i.versionCode == curCode || i.versionCode == 0 || semverCmp >= 0) return true;
        }
        return false;
    }

    private static int compareSemver(String remote, String local) {
        if (remote == null || remote.isEmpty()) return 0;
        String rClean = remote.replaceFirst("^[vV]", "").split("[-+]")[0];
        String lClean = (local == null ? "" : local).replaceFirst("^[vV]", "").split("[-+]")[0];
        String[] rp = rClean.split("\\.");
        String[] lp = lClean.split("\\.");
        int len = Math.max(rp.length, lp.length);
        for (int k = 0; k < len; k++) {
            int rv = k < rp.length ? parseIntSafe(rp[k]) : 0;
            int lv = k < lp.length ? parseIntSafe(lp[k]) : 0;
            if (rv != lv) return Integer.compare(rv, lv);
        }
        return 0;
    }

    private static int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.replaceAll("\\D", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    private static Info readCached(Context c) {
        String raw = prefs(c).getString("info", null);
        if (raw == null) return null;
        try {
            return parseInfoJson(new JSONObject(raw));
        } catch (Exception e) {
            return null;
        }
    }

    private static void saveCached(Context app, Info info) {
        try {
            JSONObject j = new JSONObject()
                    .put("versionCode", info.versionCode)
                    .put("buildNumber", info.buildNumber)
                    .put("versionName", info.versionName)
                    .put("url", info.url)
                    .put("htmlUrl", info.htmlUrl)
                    .put("notes", info.notes)
                    .put("sha256", info.sha256);
            prefs(app).edit().putString("info", j.toString()).apply();
        } catch (Exception ignored) {}
    }

    private static Info parseInfoJson(JSONObject j) {
        Info i = new Info();
        i.versionCode = j.optInt("versionCode", 0);
        i.buildNumber = j.optInt("buildNumber", 0);
        i.versionName = j.optString("versionName", "");
        i.url = j.optString("url", DEFAULT_URL);
        i.htmlUrl = j.optString("htmlUrl", i.url);
        i.notes = j.optString("notes", "");
        i.sha256 = j.optString("sha256", "");
        return i;
    }

    private static String httpGet(String url) throws Exception {
        URL current = new URL(url);
        for (int hop = 0; hop < 6; hop++) {
            HttpURLConnection conn = (HttpURLConnection) current.openConnection();
            String host = current.getHost() == null ? "" : current.getHost().toLowerCase(java.util.Locale.ROOT);
            conn.setRequestProperty("User-Agent", "NusukAuto-Android");
            conn.setRequestProperty("Accept", "api.github.com".equals(host)
                    ? "application/vnd.github+json"
                    : "application/json, text/xml, */*");
            conn.setRequestProperty("Cache-Control", "no-cache");
            conn.setRequestProperty("Pragma", "no-cache");
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setUseCaches(false);
            try {
                int code = conn.getResponseCode();
                if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                    String loc = conn.getHeaderField("Location");
                    if (loc != null && !loc.isEmpty()) {
                        current = new URL(current, loc);
                        continue;
                    }
                }
                if (code == 404) throw new NoReleaseException();
                if (code != 200) throw new Exception("HTTP " + code);
                StringBuilder sb = new StringBuilder();
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line).append('\n');
                }
                return sb.toString();
            } finally {
                conn.disconnect();
            }
        }
        throw new Exception("Too many redirects");
    }

    private static Info infoFromTag(String repo, String tag, String htmlUrl) {
        Info info = new Info();
        info.versionName = tag.replaceFirst("^[vV]", "").split("-")[0];
        info.htmlUrl = htmlUrl != null && !htmlUrl.isEmpty() ? htmlUrl : "https://github.com/" + repo + "/releases";
        info.url = "https://github.com/" + repo + "/releases/download/" + tag + "/nusuk-auto.apk";
        Matcher bm = BUILD_TAG_RE.matcher(tag);
        if (bm.find()) info.buildNumber = parseIntSafe(bm.group(1));
        return info;
    }

    private static Info mergeAssetVersionJson(Info base, String versionAssetUrl) {
        if (versionAssetUrl == null || versionAssetUrl.isEmpty()) return base;
        try {
            Info exact = parseInfoJson(new JSONObject(httpGet(versionAssetUrl)));
            if (exact.versionCode > 0) base.versionCode = exact.versionCode;
            if (exact.buildNumber > 0) base.buildNumber = exact.buildNumber;
            if (!exact.versionName.isEmpty()) base.versionName = exact.versionName;
            if (!exact.url.isEmpty()) base.url = exact.url;
            if (!exact.htmlUrl.isEmpty()) base.htmlUrl = exact.htmlUrl;
            if (!exact.sha256.isEmpty()) base.sha256 = exact.sha256;
            if (!exact.notes.isEmpty()) base.notes = exact.notes;
        } catch (Exception ignored) {}
        return base;
    }

    private static Info parseReleaseObject(String repo, JSONObject rel) {
        String tag = rel.optString("tag_name", "").trim();
        Info info = infoFromTag(repo, tag, rel.optString("html_url", "https://github.com/" + repo + "/releases"));
        info.notes = rel.optString("body", "").trim();

        JSONArray assets = rel.optJSONArray("assets");
        String versionAssetUrl = null;
        if (assets != null) {
            for (int k = 0; k < assets.length(); k++) {
                JSONObject a = assets.optJSONObject(k);
                if (a == null) continue;
                String name = a.optString("name", "");
                String dl = a.optString("browser_download_url", "");
                if (name.endsWith(".apk") && !dl.isEmpty()) {
                    info.url = dl;
                } else if ("version.json".equalsIgnoreCase(name) && !dl.isEmpty()) {
                    versionAssetUrl = dl;
                }
            }
        }
        return mergeAssetVersionJson(info, versionAssetUrl);
    }

    private static Info fetchFromGithubReleaseApi(String repo) throws Exception {
        try {
            String apiUrl = "https://api.github.com/repos/" + repo + "/releases/latest";
            return parseReleaseObject(repo, new JSONObject(httpGet(apiUrl)));
        } catch (NoReleaseException e) {
            // If /releases/latest returns 404 (e.g. prerelease-only), inspect recent releases.
            String listUrl = "https://api.github.com/repos/" + repo + "/releases?per_page=5";
            JSONArray arr = new JSONArray(httpGet(listUrl));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject rel = arr.optJSONObject(i);
                if (rel != null && !rel.optBoolean("draft", false)) {
                    return parseReleaseObject(repo, rel);
                }
            }
            throw e;
        }
    }

    /** Rate-limit-free fallback: inspects the 302 Location of /releases/latest to resolve tag & version.json. */
    private static Info fetchFromLatestRedirect(String repo) throws Exception {
        String latestPage = "https://github.com/" + repo + "/releases/latest";
        String loc = probeRedirectLocation(latestPage, "HEAD");
        if (loc == null) {
            loc = probeRedirectLocation(latestPage, "GET");
        }
        if (loc == null) throw new Exception("No release redirect");
        if (!loc.contains("/releases/tag/")) {
            if (loc.replaceFirst("[?#].*$", "").endsWith("/releases")) throw new NoReleaseException();
            throw new Exception("No release tag redirect (" + loc + ")");
        }
        int idx = loc.indexOf("/releases/tag/");
        String tag = loc.substring(idx + "/releases/tag/".length()).split("[?#]")[0].trim();
        if (tag.isEmpty()) throw new NoReleaseException();
        Info info = infoFromTag(repo, tag, loc);
        String verUrl = "https://github.com/" + repo + "/releases/download/" + tag + "/version.json";
        return mergeAssetVersionJson(info, verUrl);
    }

    private static String probeRedirectLocation(String pageUrl, String method) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(pageUrl).openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("User-Agent", "NusukAuto-Android");
        conn.setRequestProperty("Cache-Control", "no-cache");
        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        conn.setUseCaches(false);
        try {
            int code = conn.getResponseCode();
            if (code == 404) throw new NoReleaseException();
            String loc = conn.getHeaderField("Location");
            if (code >= 300 && code < 400 && loc != null && !loc.isEmpty()) {
                return new URL(new URL(pageUrl), loc).toString();
            }
            if ("HEAD".equals(method)) return null;
            throw new Exception("No release redirect (" + code + ")");
        } finally {
            conn.disconnect();
        }
    }

    /** Rate-limit-free Atom feed fallback when REST API & /releases/latest redirect fail. */
    private static Info fetchFromReleasesAtom(String repo) throws Exception {
        String xml = httpGet("https://github.com/" + repo + "/releases.atom");
        Matcher m = ATOM_TAG_RE.matcher(xml);
        if (!m.find()) throw new NoReleaseException();
        String tag = m.group(1).trim();
        if (tag.isEmpty()) throw new NoReleaseException();
        String htmlUrl = "https://github.com/" + repo + "/releases/tag/" + tag;
        Info info = infoFromTag(repo, tag, htmlUrl);
        String verUrl = "https://github.com/" + repo + "/releases/download/" + tag + "/version.json";
        return mergeAssetVersionJson(info, verUrl);
    }

    private static Info fetchFromRawVersionJson(String repo) throws Exception {
        long t = System.currentTimeMillis();
        try {
            String rawMain = "https://raw.githubusercontent.com/" + repo + "/main/version.json?t=" + t;
            return parseInfoJson(new JSONObject(httpGet(rawMain)));
        } catch (NoReleaseException e) {
            String rawMaster = "https://raw.githubusercontent.com/" + repo + "/master/version.json?t=" + t;
            return parseInfoJson(new JSONObject(httpGet(rawMaster)));
        }
    }

    /** Queries GitHub Releases API, then /releases/latest redirect, then releases.atom, then raw version.json. */
    private static void fetch(Activity a, Listener cb, boolean reportErrors) {
        final Context app = a.getApplicationContext();
        final String repo = githubRepo(app);
        fetchInFlight = true;
        fetchStartedAt = System.currentTimeMillis();
        exec.execute(() -> {
            Info newer = null;
            String error = null;
            try {
                Info candidate = null;
                boolean sawNoRelease = false;
                try {
                    candidate = fetchFromGithubReleaseApi(repo);
                } catch (Exception apiErr) {
                    if (apiErr instanceof NoReleaseException) sawNoRelease = true;
                    Log.w(TAG, "GitHub API failed, trying latest redirect: " + apiErr);
                    try {
                        candidate = fetchFromLatestRedirect(repo);
                    } catch (Exception redirErr) {
                        if (redirErr instanceof NoReleaseException) sawNoRelease = true;
                        Log.w(TAG, "Release redirect failed, trying releases.atom: " + redirErr);
                        try {
                            candidate = fetchFromReleasesAtom(repo);
                        } catch (Exception atomErr) {
                            if (atomErr instanceof NoReleaseException) sawNoRelease = true;
                            Log.w(TAG, "Releases atom failed, trying raw version.json: " + atomErr);
                            try {
                                candidate = fetchFromRawVersionJson(repo);
                            } catch (NoReleaseException rawMissing) {
                                if (!sawNoRelease) throw rawMissing;
                                // All endpoints responded over HTTPS that no release is published yet -> treat as up-to-date.
                                candidate = null;
                            }
                        }
                    }
                }
                if (candidate != null) {
                    saveCached(app, candidate);
                    if (isNewer(app, candidate)) newer = candidate;
                }
            } catch (NoReleaseException emptyRepo) {
                Log.i(TAG, "No GitHub releases published yet for " + repo);
            } catch (Exception e) {
                Log.w(TAG, "Update check failed: " + e);
                error = e.toString();
            } finally {
                fetchInFlight = false;
            }
            final Info result = newer;
            final boolean failed = error != null;
            main.post(() -> {
                if (a.isFinishing() || a.isDestroyed()) return;
                if (failed && reportErrors) {
                    Toast.makeText(a, L.t(a, "Could not check for updates. Check your internet."), Toast.LENGTH_LONG).show();
                    return;
                }
                if (!failed) cb.onChecked(result);
            });
        });
    }

    private static AlertDialog shown;

    private static String cleanReleaseNotes(String raw) {
        if (raw == null) return "";
        StringBuilder out = new StringBuilder();
        for (String line : raw.split("\\r?\\n")) {
            String t = line.trim();
            if (t.isEmpty()) continue;
            String lower = t.toLowerCase(java.util.Locale.ROOT);
            if (lower.contains("github") || lower.startsWith("mandatory update build #")) continue;
            if (out.length() > 0) out.append('\n');
            out.append(t);
        }
        return out.toString().trim();
    }

    /** Shows an un-dismissible mandatory update dialog. Users cannot proceed until updated. */
    public static void showForcedDialog(Activity a, Info info) {
        if (a == null || a.isFinishing() || a.isDestroyed()) return;

        AdPopup.dismissIfShowing();
        AutomationService svc = AutomationService.getInstance();
        if (svc != null && svc.isRunning()) {
            svc.stopAutomation("Update required");
        }

        if (shown != null && shown.isShowing()) {
            if (shown.getOwnerActivity() == a) return;
            try { shown.dismiss(); } catch (Exception ignored) {}
        }

        String verLabel = info.versionName != null && !info.versionName.isEmpty()
                ? "v" + info.versionName + (info.buildNumber > 0 ? " (#" + info.buildNumber + ")" : "")
                : (info.buildNumber > 0 ? "#" + info.buildNumber : "");
        String cleanNotes = cleanReleaseNotes(info.notes);
        String msg = L.t(a, "A new version of Nusuk Auto is available. Please install the latest update before continuing.")
                + (cleanNotes.isEmpty() ? "" : "\n\n" + L.t(a, "What's new:") + "\n" + cleanNotes)
                + "\n\n" + L.t(a, "Your progress is kept when you update.");

        AlertDialog.Builder b = new AlertDialog.Builder(a)
                .setTitle(L.t(a, "Update required") + (verLabel.isEmpty() ? "" : " (" + verLabel + ")"))
                .setMessage(msg)
                .setCancelable(false)
                .setPositiveButton(L.t(a, "Update now"), null);

        AlertDialog dlg = b.create();
        dlg.setOwnerActivity(a);
        dlg.setCanceledOnTouchOutside(false);
        dlg.setOnKeyListener((d, keyCode, event) -> keyCode == KeyEvent.KEYCODE_BACK);
        dlg.setOnDismissListener(d -> { if (shown == d) shown = null; });
        try {
            shown = dlg;
            dlg.show();
            // Override button listener after show() so tapping it never dismisses the update lock.
            dlg.getButton(DialogInterface.BUTTON_POSITIVE).setOnClickListener(v -> openDownload(a, info, true));
        } catch (Exception ignored) {
            if (shown == dlg) shown = null;
        }
    }

    static void openDownload(Activity a, Info info) {
        openDownload(a, info, false);
    }

    static void openDownload(Activity a, Info info, boolean directApk) {
        String target;
        if (directApk && info != null && Links.isTrusted(info.url)) {
            target = info.url;
        } else if (info != null && Links.isTrusted(info.htmlUrl)) {
            target = info.htmlUrl;
        } else if (info != null && Links.isTrusted(info.url)) {
            target = info.url;
        } else {
            target = DEFAULT_URL;
        }
        try {
            a.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            Toast.makeText(a, L.t(a, "Download the APK and install the update to continue."), Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(a, target, Toast.LENGTH_LONG).show();
        }
    }
}
