package com.nusuk.automator.ui;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nusuk.automator.R;
import com.nusuk.automator.core.L;
import com.nusuk.automator.core.Links;
import com.nusuk.automator.update.UpdateChecker;

/**
 * Full-focus startup poster ad popup shown once per fresh app open.
 * Displays a small "Sponsored" badge above the poster card and a 3-2-1 countdown corner badge
 * that turns into a close (✕) button after 3 seconds; stays open until the user taps ✕.
 */
public final class AdPopup {
    private static boolean shownThisOpen = false;
    private static Dialog activeDialog = null;

    private AdPopup() {}

    /** Resets the one-time gate when MainActivity exits so the next fresh app open shows the ad again. */
    public static void resetOnExit() {
        shownThisOpen = false;
    }

    /** Dismisses any visible startup ad dialog immediately (e.g. when a mandatory update blocks the app). */
    public static void dismissIfShowing() {
        Dialog d = activeDialog;
        activeDialog = null;
        if (d != null && d.isShowing()) {
            try { d.dismiss(); } catch (Exception ignored) {}
        }
    }

    public static void showIfNeeded(Activity a) {
        if (shownThisOpen || a == null || a.isFinishing() || a.isDestroyed()) return;
        if (UpdateChecker.isBlocked(a)) return;
        shownThisOpen = true;

        float dp = a.getResources().getDisplayMetrics().density;
        DisplayMetrics dm = a.getResources().getDisplayMetrics();
        int maxW = Math.min((int) (dm.widthPixels * 0.88f), (int) (360 * dp));
        int maxH = (int) (dm.heightPixels * 0.72f);

        Dialog dlg = new Dialog(a);
        dlg.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dlg.setCancelable(false);
        dlg.setCanceledOnTouchOutside(false);

        FrameLayout outer = new FrameLayout(a);
        outer.setPadding((int) (16 * dp), (int) (16 * dp), (int) (16 * dp), (int) (16 * dp));

        LinearLayout wrap = new LinearLayout(a);
        wrap.setOrientation(LinearLayout.VERTICAL);
        wrap.setGravity(Gravity.CENTER_HORIZONTAL);

        // Top header bar ABOVE the poster image: subtle "Sponsored" badge on left, 3-2-1 -> ✕ on right
        LinearLayout topBar = new LinearLayout(a);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams topLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        topLp.bottomMargin = (int) (8 * dp);

        TextView sponsor = new TextView(a);
        sponsor.setText(L.t(a, "Sponsored"));
        sponsor.setTextColor(0xFFECFDF5);
        sponsor.setTextSize(11);
        sponsor.setTypeface(a.getResources().getFont(R.font.plex_medium));
        sponsor.setPadding((int) (10 * dp), (int) (4 * dp), (int) (10 * dp), (int) (4 * dp));
        GradientDrawable spBg = new GradientDrawable();
        spBg.setCornerRadius(999f * dp);
        spBg.setColor(0xCC0F2E1E);
        spBg.setStroke((int) (1 * dp), 0x66BBF7D0);
        sponsor.setBackground(spBg);
        topBar.addView(sponsor, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        View spacer = new View(a);
        topBar.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1f));

        TextView counter = new TextView(a);
        counter.setText(L.t(a, "3"));
        counter.setTextColor(0xFFFFFFFF);
        counter.setTextSize(15);
        counter.setTypeface(a.getResources().getFont(R.font.plex_medium));
        counter.setGravity(Gravity.CENTER);
        counter.setClickable(false);
        counter.setFocusable(false);
        GradientDrawable cBg = new GradientDrawable();
        cBg.setShape(GradientDrawable.OVAL);
        cBg.setColor(0xE614532D);
        cBg.setStroke((int) (1.5f * dp), 0xFFBBF7D0);
        counter.setBackground(cBg);
        int badgeSize = (int) (36 * dp);
        topBar.addView(counter, new LinearLayout.LayoutParams(badgeSize, badgeSize));

        wrap.addView(topBar, topLp);

        // Clean unobstructed poster card below the header bar
        FrameLayout card = new FrameLayout(a);
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(0xFFFFFFFF);
        cardBg.setCornerRadius(20f * dp);
        cardBg.setStroke((int) (1.5f * dp), 0xFFBBF7D0);
        card.setBackground(cardBg);
        card.setClipToOutline(true);
        card.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View view, Outline outline) {
                outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), 20f * dp);
            }
        });

        ImageView poster = new ImageView(a);
        poster.setImageResource(R.drawable.ad_poster);
        poster.setAdjustViewBounds(true);
        poster.setScaleType(ImageView.ScaleType.FIT_CENTER);
        poster.setMaxWidth(maxW);
        poster.setMaxHeight(maxH);
        poster.setContentDescription(L.t(a, "Sponsored"));
        poster.setOnClickListener(v -> Links.open(a, Links.SITE_URL));
        card.addView(poster, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT));

        wrap.addView(card, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        FrameLayout.LayoutParams wrapLp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        outer.addView(wrap, wrapLp);
        dlg.setContentView(outer);

        Window win = dlg.getWindow();
        if (win != null) {
            win.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            win.setLayout(WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT);
            win.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            win.setDimAmount(0.75f);
        }

        Handler h = new Handler(Looper.getMainLooper());
        Runnable tick2 = () -> {
            if (!a.isFinishing() && !a.isDestroyed() && dlg.isShowing()) {
                counter.setText(L.t(a, "2"));
            }
        };
        Runnable tick1 = () -> {
            if (!a.isFinishing() && !a.isDestroyed() && dlg.isShowing()) {
                counter.setText(L.t(a, "1"));
            }
        };
        Runnable unlockClose = () -> {
            if (dlg.isShowing() && !a.isFinishing() && !a.isDestroyed()) {
                counter.setText("\u2715");
                counter.setTextSize(17);
                counter.setContentDescription(L.t(a, "Close"));
                counter.setClickable(true);
                counter.setFocusable(true);
                GradientDrawable closeBg = new GradientDrawable();
                closeBg.setShape(GradientDrawable.OVAL);
                closeBg.setColor(0xF018181B);
                closeBg.setStroke((int) (1.5f * dp), 0xFFFFFFFF);
                counter.setBackground(closeBg);
                counter.setOnClickListener(v -> {
                    try { dlg.dismiss(); } catch (Exception ignored) {}
                });
            }
        };

        dlg.setOnDismissListener(d -> {
            h.removeCallbacks(tick2);
            h.removeCallbacks(tick1);
            h.removeCallbacks(unlockClose);
            if (activeDialog == d) activeDialog = null;
        });

        activeDialog = dlg;
        try {
            dlg.show();
            h.postDelayed(tick2, 1000L);
            h.postDelayed(tick1, 2000L);
            h.postDelayed(unlockClose, 3000L);
        } catch (Exception ignored) {
            activeDialog = null;
        }
    }
}
