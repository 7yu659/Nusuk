package com.nusuk.automator.notices;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.nusuk.automator.R;
import com.nusuk.automator.core.Http;
import com.nusuk.automator.core.L;
import com.nusuk.automator.core.Links;
import com.nusuk.automator.ui.MainActivity;
import com.nusuk.automator.update.UpdateChecker;

/**
 * Announcements sent from the admin page (/admin -> Notifications), shown as system notifications.
 * No Firebase: the phone asks /api/app/notices every ~15 min (JobScheduler, survives reboots) and
 * whenever the app opens. The server answers with notices newer than the last id seen.
 * The very first check after install only records the latest id, so old announcements never pop up.
 */
public final class Notices {
    private static final String TAG = "Notices";
    static final String CHANNEL = "announcements";
    static final String CHANNEL_UPDATES = "app_updates";
    private static final int UPDATE_NOTIFY_ID = 9001;
    private static final int JOB_ID = 4201;
    private static final long PERIOD_MS = 15 * 60_000L;      // JobScheduler minimum
    private static final long MIN_GAP_MS = 60_000L;          // app open: at most one check a minute
    private static final String PREFS = "notices";

    private static final int HISTORY_MAX = 60;

    /** Called (from a background thread) after a check stored new notices; screens refresh themselves. */
    public static volatile Runnable onChange;

    private static final ExecutorService exec = Executors.newSingleThreadExecutor();

    private Notices() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Registers the periodic background check (no-op when already scheduled). */
    public static void schedule(Context c) {
        JobScheduler js = c.getSystemService(JobScheduler.class);
        if (js == null) return;
        // A job saved by an older version can still point at NoticeJob's old class name, which no
        // longer exists, or be persisted across reboots (needed RECEIVE_BOOT_COMPLETED, now dropped):
        // either one is replaced (same id) instead of kept. App open re-schedules after a reboot.
        JobInfo pending = js.getPendingJob(JOB_ID);
        if (pending != null && !pending.isPersisted()
                && NoticeJob.class.getName().equals(pending.getService().getClassName())) return;
        JobInfo job = new JobInfo.Builder(JOB_ID, new ComponentName(c, NoticeJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPeriodic(PERIOD_MS)
                .build();
        int r = js.schedule(job);
        Log.i(TAG, "Background check scheduled: " + (r == JobScheduler.RESULT_SUCCESS));
    }

    /** App open: check now (throttled), off the main thread. */
    public static void checkSoon(Context c) {
        Context app = c.getApplicationContext();
        SharedPreferences p = prefs(app);
        long now = System.currentTimeMillis();
        if (now - p.getLong("lastCheck", 0) < MIN_GAP_MS) return;
        exec.execute(() -> check(app));
    }

    /** Fetches and shows new notices. Blocking: call off the main thread. Returns false on failure. */
    static boolean check(Context c) {
        SharedPreferences p = prefs(c);
        long since = p.getLong("since", -1);
        try {
            JSONObject r = post(c, since);
            long latest = r.optLong("latest", 0);
            JSONArray list = r.optJSONArray("notices");
            long seen = since;
            if (list != null) {
                for (int i = 0; i < list.length(); i++) {
                    JSONObject n = list.getJSONObject(i);
                    store(c, n);
                    show(c, n);
                    seen = Math.max(seen, n.optLong("id"));
                }
            }
            // A full page (5) may mean more are waiting: continue from the last shown id next time.
            long next = list != null && list.length() >= 5 ? seen : Math.max(seen, latest);
            p.edit().putLong("since", Math.max(next, 0)).putLong("lastCheck", System.currentTimeMillis()).apply();
            Runnable cb = onChange;
            if (cb != null && seen > since) cb.run();
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Check failed: " + e);
            return false;
        }
    }

    /** Forces a check now (Notifications screen opened / pulled), still off the main thread. */
    static void refreshNow(Context c) {
        Context app = c.getApplicationContext();
        exec.execute(() -> check(app));
    }

    // ===== History: every notice this phone received, newest first (kept on the phone) =====

    private static synchronized void store(Context c, JSONObject n) {
        try {
            SharedPreferences p = prefs(c);
            JSONArray old = new JSONArray(p.getString("history", "[]"));
            long id = n.optLong("id");
            JSONArray out = new JSONArray();
            out.put(new JSONObject().put("id", id).put("title", n.optString("title", "Nusuk Auto"))
                    .put("body", n.optString("body", "")).put("url", n.optString("url", ""))
                    .put("at", n.optLong("created_at", System.currentTimeMillis() / 1000)));
            for (int i = 0; i < old.length() && out.length() < HISTORY_MAX; i++) {
                if (old.getJSONObject(i).optLong("id") != id) out.put(old.getJSONObject(i));
            }
            p.edit().putString("history", out.toString()).apply();
        } catch (Exception e) {
            Log.w(TAG, "History not saved: " + e);
        }
    }

    /** Saved notices, newest first. */
    static synchronized JSONArray history(Context c) {
        try {
            return new JSONArray(prefs(c).getString("history", "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    public static synchronized int unreadCount(Context c) {
        long read = prefs(c).getLong("readUpTo", 0);
        JSONArray h = history(c);
        int n = 0;
        for (int i = 0; i < h.length(); i++) {
            JSONObject item = h.optJSONObject(i);
            if (item == null) continue;
            if (item.optBoolean("isUpdate", false)) {
                if (item.optBoolean("unread", false)) n++;
            } else if (item.optLong("id") > read) {
                n++;
            }
        }
        return n;
    }

    /** Marks everything saved so far as read. */
    static synchronized void markAllRead(Context c) {
        JSONArray h = history(c);
        long max = 0;
        boolean changed = false;
        for (int i = 0; i < h.length(); i++) {
            JSONObject item = h.optJSONObject(i);
            if (item == null) continue;
            if (item.optBoolean("isUpdate", false)) {
                if (item.optBoolean("unread", false)) {
                    try {
                        item.put("unread", false);
                        changed = true;
                    } catch (Exception ignored) {}
                }
            } else {
                long id = item.optLong("id");
                if (id > max) max = id;
            }
        }
        SharedPreferences.Editor ed = prefs(c).edit().putLong("readUpTo", Math.max(max, prefs(c).getLong("readUpTo", 0)));
        if (changed) ed.putString("history", h.toString());
        ed.apply();
    }

    static synchronized void clearHistory(Context c) {
        markAllRead(c);
        prefs(c).edit().putString("history", "[]").apply();
    }

    public static void ensureChannel(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, L.t(c, "Announcements"), NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription(L.t(c, "News and updates from Nusuk Auto"));
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CHANNEL_UPDATES) == null) {
            NotificationChannel uch = new NotificationChannel(CHANNEL_UPDATES, L.t(c, "App Updates"), NotificationManager.IMPORTANCE_HIGH);
            uch.setDescription(L.t(c, "Alerts when a new version of Nusuk Auto is available"));
            nm.createNotificationChannel(uch);
        }
    }

    /** Records an update notice into the in-app notification feed once per unique update key. */
    public static boolean storeUpdateNoticeIfNew(Context c, UpdateChecker.Info info) {
        if (c == null || info == null) return false;
        String updateKey = UpdateChecker.updateKey(info);
        if (updateKey.isEmpty()) return false;
        String ver = UpdateChecker.versionLabel(info);
        String titleEn = ver.isEmpty() ? "New update available" : "New update available · " + ver;
        String bodyEn = ver.isEmpty()
                ? "A fresh version of Nusuk Auto is ready with important fixes and improvements. Tap to update now."
                : "A fresh version of Nusuk Auto (" + ver + ") is ready with important fixes and improvements. Tap to update now.";
        boolean added = storeUpdateNotice(c, updateKey, titleEn, bodyEn, info.url);
        if (added) {
            Runnable cb = onChange;
            if (cb != null) cb.run();
        }
        return added;
    }

    private static synchronized boolean storeUpdateNotice(Context c, String updateKey, String titleEn, String bodyEn, String url) {
        try {
            SharedPreferences p = prefs(c);
            if (updateKey.equals(p.getString("lastUpdateNoticeKey", ""))) {
                return false;
            }
            JSONArray old = new JSONArray(p.getString("history", "[]"));
            long id = -((Math.abs((long) updateKey.hashCode()) % 1_000_000L) + 1L);
            JSONArray out = new JSONArray();
            out.put(new JSONObject()
                    .put("id", id)
                    .put("isUpdate", true)
                    .put("unread", true)
                    .put("updateKey", updateKey)
                    .put("title", titleEn)
                    .put("body", bodyEn)
                    .put("url", url != null ? url : "")
                    .put("at", System.currentTimeMillis() / 1000));
            for (int i = 0; i < old.length() && out.length() < HISTORY_MAX; i++) {
                JSONObject prev = old.optJSONObject(i);
                if (prev == null) continue;
                if (prev.optBoolean("isUpdate", false) && updateKey.equals(prev.optString("updateKey", ""))) continue;
                if (prev.optLong("id") == id) continue;
                out.put(prev);
            }
            p.edit()
                    .putString("lastUpdateNoticeKey", updateKey)
                    .putString("history", out.toString())
                    .apply();
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Update notice not saved: " + e);
            return false;
        }
    }

    /** Shows a high-priority system notification and records an unread in-app notice for the new release. */
    public static void notifyUpdateAvailable(Context c, UpdateChecker.Info info) {
        if (c == null || info == null) return;
        storeUpdateNoticeIfNew(c, info);

        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        ensureChannel(c);

        String ver = UpdateChecker.versionLabel(info);
        String titleEn = ver.isEmpty() ? "New update available" : "New update available · " + ver;
        String bodyEn = ver.isEmpty()
                ? "A fresh version of Nusuk Auto is ready with important fixes and improvements. Tap to update now."
                : "A fresh version of Nusuk Auto (" + ver + ") is ready with important fixes and improvements. Tap to update now.";
        String title = L.t(c, titleEn);
        String body = L.t(c, bodyEn);

        Intent openApp = new Intent(c, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tapPi = PendingIntent.getActivity(c, UPDATE_NOTIFY_ID, openApp,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        PendingIntent actionPi = tapPi;
        if (Links.isTrusted(info.url)) {
            Intent dlIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(info.url))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            actionPi = PendingIntent.getActivity(c, UPDATE_NOTIFY_ID + 1, dlIntent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        }

        Notification.Builder b = new Notification.Builder(c, CHANNEL_UPDATES)
                .setSmallIcon(R.drawable.ic_notify)
                .setColor(c.getColor(R.color.primary))
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setCategory(Notification.CATEGORY_RECOMMENDATION)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(tapPi)
                .addAction(new Notification.Action.Builder(null, L.t(c, "Update now"), actionPi).build());
        try {
            nm.notify("update", UPDATE_NOTIFY_ID, b.build());
            Log.i(TAG, "Shown update notification for " + ver);
        } catch (SecurityException e) {
            Log.w(TAG, "Update notification not allowed: " + e);
        }
    }

    /** Clears the system update notification and marks update alerts read once the app is up to date. */
    public static synchronized void cancelUpdateNotification(Context c) {
        if (c == null) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm != null) nm.cancel("update", UPDATE_NOTIFY_ID);
        try {
            SharedPreferences p = prefs(c);
            JSONArray h = new JSONArray(p.getString("history", "[]"));
            boolean changed = false;
            for (int i = 0; i < h.length(); i++) {
                JSONObject item = h.optJSONObject(i);
                if (item != null && item.optBoolean("isUpdate", false) && item.optBoolean("unread", false)) {
                    item.put("unread", false);
                    changed = true;
                }
            }
            if (changed) {
                p.edit().putString("history", h.toString()).apply();
                Runnable cb = onChange;
                if (cb != null) cb.run();
            }
        } catch (Exception ignored) {}
    }

    private static void show(Context c, JSONObject n) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        ensureChannel(c);
        String title = n.optString("title", "Nusuk Auto");
        String body = n.optString("body", "");
        String url = n.optString("url", "");
        int id = (int) n.optLong("id");

        Intent tap;
        if (Links.isTrusted(url)) {
            tap = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        } else {
            tap = new Intent(c, NotificationsActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        }
        PendingIntent pi = PendingIntent.getActivity(c, id, tap,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder b = new Notification.Builder(c, CHANNEL)
                .setSmallIcon(R.drawable.ic_notify)
                .setColor(c.getColor(R.color.primary))
                .setContentTitle(title)
                .setAutoCancel(true)
                .setContentIntent(pi);
        if (!body.isEmpty()) {
            b.setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body));
        }
        try {
            nm.notify("notice", id, b.build());
            Log.i(TAG, "Shown notice " + id + ": " + title);
        } catch (SecurityException e) {
            Log.w(TAG, "Notifications not allowed: " + e);
        }
    }

    private static JSONObject post(Context c, long since) throws Exception {
        Http.Response r = Http.postJson(c, "/api/app/notices", new JSONObject().put("since", since), 10_000, 15_000);
        if (r.status != 200) throw new Exception("HTTP " + r.status + " " + r.body);
        return new JSONObject(r.body);
    }
}
