package com.nusuk.automator.core;

import android.app.Activity;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.Toast;

import java.io.File;

/** Outside links and sharing helpers shared across every screen. */
public final class Links {
    static final String GROUP_URL = "https://www.facebook.com/share/1CnXaXQFoL/";
    public static final String FB_PROFILE_URL = GROUP_URL;
    public static final String WHATSAPP_NUMBER = "01305359691";
    public static final String WHATSAPP_URL = "https://wa.me/8801305359691";
    public static final String DEV_EMAIL = "skyebrahimkhalil@gmail.com";
    public static final String DEV_URL = "mailto:skyebrahimkhalil@gmail.com";
    public static final String GITHUB_REPO = "7yu659/Nusuk";
    public static final String GITHUB_RELEASES_URL = "https://github.com/" + GITHUB_REPO + "/releases";
    public static final String WEB_URL = "https://fynex.site/";
    public static final String DEV_NAME = "Ebrahim Khalil";
    public static final String COMPANY_NAME = "Fynex";
    /** Fallback link shared when APK file sharing isn't supported by the target app. */
    public static final String SHARE_URL = FB_PROFILE_URL;
    private static volatile boolean sharingApk = false;

    private Links() {}

    /** Nusuk's own app (the one we automate). */
    public static final String NUSUK_PACKAGE = "com.moh.nusukapp";
    /** Official website and release hosts. */
    public static final String SITE_HOST = "fynex.site";
    public static final String SITE_URL = "https://" + SITE_HOST;
    public static final String FILE_HOST = "https://fynex.site/";

    /** Hosts trusted for in-app notice or update links. */
    private static final String[] TRUSTED_HOSTS = {
            "fynex.site", "facebook.com", "fb.com", "fb.me",
            "github.com", "githubusercontent.com", "objects.githubusercontent.com",
            "release-assets.githubusercontent.com",
            "play.google.com", "youtube.com", "youtu.be", "wa.me", "whatsapp.com", "t.me"
    };

    public static boolean isTrusted(String url) {
        if (url == null || !url.startsWith("https://")) return false;
        String host = Uri.parse(url).getHost();
        if (host == null) return false;
        host = host.toLowerCase(java.util.Locale.ROOT);
        for (String h : TRUSTED_HOSTS) if (host.equals(h) || host.endsWith("." + h)) return true;
        return false;
    }

    /** Kept for server-sync compatibility; Facebook links always resolve to the developer's link. */
    public static void saveGroupUrl(Context c, String url) {
        // Intentionally pinned to FB_PROFILE_URL.
    }

    public static String groupUrl(Context c) {
        return FB_PROFILE_URL;
    }

    /** Opens a Facebook page or profile in Facebook app / Lite, falling back to browser. */
    public static void openFacebook(Context c, String url) {
        for (String pkg : new String[]{"com.facebook.katana", "com.facebook.lite"}) {
            try {
                c.getPackageManager().getPackageInfo(pkg, 0);
                Intent fb = new Intent(Intent.ACTION_VIEW, Uri.parse("fb://facewebmodal/f?href=" + Uri.encode(url)));
                fb.setPackage(pkg);
                c.startActivity(fb);
                return;
            } catch (Exception ignored) {}
        }
        open(c, url);
    }

    /** Opens WhatsApp chat with the developer. */
    public static void openWhatsApp(Context c) {
        open(c, WHATSAPP_URL);
    }

    /** Shares the installed APK file directly via ApkShareProvider, falling back to the download link if unavailable. */
    public static void share(Context c) {
        if (c == null || sharingApk) return;
        sharingApk = true;
        final Context app = c.getApplicationContext();
        final Handler main = new Handler(Looper.getMainLooper());
        new Thread(() -> {
            File apk = null;
            try {
                apk = ApkShareProvider.prepareApkFile(app);
            } catch (Exception ignored) {}
            final boolean hasApk = apk != null && apk.exists() && apk.length() > 0;
            main.post(() -> {
                sharingApk = false;
                if (c instanceof Activity) {
                    Activity act = (Activity) c;
                    if (act.isFinishing() || act.isDestroyed()) return;
                }
                if (hasApk) {
                    try {
                        Uri apkUri = ApkShareProvider.contentUri(app);
                        String shareCaption = L.isBn(app)
                                ? "নুসুক অ্যাপের কোড আর কুইজ নিজে থেকেই করে দেয় Nusuk Auto।\nফাইলটি ইনস্টল করে ব্যবহার করো।"
                                : "Nusuk Auto adds Umrah codes and plays the Nusuk quiz for you.\nInstall this APK to get started.";
                        Intent sendApk = new Intent(Intent.ACTION_SEND)
                                .setType(ApkShareProvider.MIME_APK)
                                .putExtra(Intent.EXTRA_STREAM, apkUri)
                                .putExtra(Intent.EXTRA_SUBJECT, ApkShareProvider.fileName(app))
                                .putExtra(Intent.EXTRA_TEXT, shareCaption)
                                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        sendApk.setClipData(ClipData.newRawUri(ApkShareProvider.fileName(app), apkUri));
                        Intent chooser = Intent.createChooser(sendApk, L.t(app, "Share the app"));
                        chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        if (!(c instanceof Activity)) chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        c.startActivity(chooser);
                        return;
                    } catch (Exception ignored) {}
                }
                shareLinkFallback(c);
            });
        }, "apk-share").start();
    }

    private static void shareLinkFallback(Context c) {
        String link = GITHUB_RELEASES_URL;
        String msg = L.isBn(c)
                ? "নুসুক অ্যাপের কোড আর কুইজ নিজে থেকেই করে দেয় Nusuk Auto।\nডাউনলোড: " + link + "\nকমিউনিটি: " + SHARE_URL
                : "Nusuk Auto adds Umrah codes and plays the Nusuk quiz for you.\nDownload: " + link + "\nCommunity: " + SHARE_URL;

        Intent sendText = new Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_SUBJECT, "Nusuk Auto")
                .putExtra(Intent.EXTRA_TEXT, msg);
        if (!(c instanceof Activity)) sendText.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            c.startActivity(Intent.createChooser(sendText, L.t(c, "Share the app")));
        } catch (Exception e) {
            Toast.makeText(c, link, Toast.LENGTH_LONG).show();
        }
    }

    public static void open(Context c, String url) {
        try {
            c.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception e) {
            Toast.makeText(c, url, Toast.LENGTH_LONG).show();
        }
    }

    /** Edge-to-edge (Android 15+): pads [bar] below the status bar and [content] above the nav bar. */
    public static void applyInsets(View root, View bar, View content) {
        int barTop = bar.getPaddingTop();
        int contentBottom = content.getPaddingBottom();
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            bar.setPadding(bar.getPaddingLeft(), barTop + insets.getSystemWindowInsetTop(),
                    bar.getPaddingRight(), bar.getPaddingBottom());
            content.setPadding(content.getPaddingLeft(), content.getPaddingTop(),
                    content.getPaddingRight(), contentBottom + insets.getSystemWindowInsetBottom());
            return insets;
        });
    }
}
