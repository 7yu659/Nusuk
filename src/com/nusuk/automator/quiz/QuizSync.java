package com.nusuk.automator.quiz;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Keeps a copy of every answer the server knows (/api/quiz/answers) in QuizStore, so known
 * questions are answered on the phone with no API call. Pulls only what changed since the last
 * pull (the server's cursor). Runs when the app opens and when a quiz run starts.
 */
public final class QuizSync {
    private static final String TAG = "QuizSync";
    private static final String PREFS = "quiz_sync";
    private static final String PREF_SINCE = "since_minbars";
    private static final String ANSWERS_URL = "https://nusuk.minbars.net/api/quiz/answers";
    private static final long MIN_GAP_MS = 20 * 60_000; // at most one pull every 20 minutes
    private static final ExecutorService exec = Executors.newSingleThreadExecutor();
    private static volatile boolean running = false;
    private static volatile long lastRun = 0;

    private QuizSync() {}

    public static synchronized void syncSoon(Context context) {
        final Context ctx = context.getApplicationContext();
        if (running || System.currentTimeMillis() - lastRun < MIN_GAP_MS) return;
        running = true;
        exec.execute(() -> {
            try {
                SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
                long since = p.getLong(PREF_SINCE, 0);
                QuizStore store = QuizStore.get(ctx);
                boolean ok = true;
                boolean caughtUp = false;
                for (int page = 0; page < 100; page++) {
                    JSONObject body = new JSONObject();
                    body.put("since", since);
                    QuizSolver.Result r = QuizSolver.post(ctx, ANSWERS_URL, body, 10_000);
                    if (r.status < 200 || r.status >= 300) {
                        Log.w(TAG, "HTTP " + r.status + " " + r.body.optString("error"));
                        ok = false;
                        break;
                    }
                    store.applyServer(r.body.optJSONArray("answers"));
                    since = r.body.optLong("cursor", since);
                    p.edit().putLong(PREF_SINCE, since).apply();
                    if (!r.body.optBoolean("more")) {
                        caughtUp = true;
                        break;
                    }
                }
                if (ok && caughtUp) lastRun = System.currentTimeMillis();
                Log.i(TAG, "Shared answers on this phone: " + store.serverCount());
            } catch (Exception e) {
                Log.w(TAG, "Sync failed: " + e);
            } finally {
                running = false;
            }
        });
    }
}
