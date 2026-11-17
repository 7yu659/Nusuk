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
import java.util.Arrays;
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
 *  3. Canonicalized question match (honorifics, Mecca/Makkah, Allah/God, Surah/Surat, numbers) + unique option match.
 *  4. High-confidence distinctive-keyword match with confuser guards + disagreement guard + unique option match.
 */
public final class QuizStore extends SQLiteOpenHelper {
    private static final String TAG = "QuizStore";
    private static final String DB_NAME = "quiz.db";
    private static final int DB_VERSION = 4; // 4: expanded verified seed + cleared stale false-wrong seed entries
    private static final String SEED_ASSET = "quiz_seed.json";

    private static QuizStore instance;
    private final Context appContext;
    private final ExecutorService writer = Executors.newSingleThreadExecutor();
    private volatile List<CachedRow> cachedAnswers = null;

    private static final class CachedRow {
        final String qnorm, qcanon, question, answer, anorm, acanon, source;
        final boolean verified;
        final long updatedAt;
        final Set<String> qTokens;
        final Set<String> qConfusers;

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
            this.qTokens = contentTokens(this.qcanon);
            this.qConfusers = extractConfusers(this.qcanon);
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
