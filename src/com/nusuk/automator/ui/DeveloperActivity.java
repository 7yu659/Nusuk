package com.nusuk.automator.ui;

import android.content.Intent;
import android.graphics.Outline;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nusuk.automator.R;
import com.nusuk.automator.core.AppInfo;
import com.nusuk.automator.core.L;
import com.nusuk.automator.core.Links;

/** Corporate developer profile for Fynex & Ebrahim Khalil. */
public class DeveloperActivity extends ScreenActivity {

    @Override
    protected String screenTitle() {
        return "About developer";
    }

    /** Compact emerald quick-action pill in the profile header. */
    private TextView quickAction(String label, boolean primary, Runnable click) {
        TextView btn = new TextView(this);
        btn.setText(L.t(this, label));
        btn.setTextSize(14);
        btn.setTypeface(getResources().getFont(R.font.plex_medium));
        btn.setGravity(Gravity.CENTER);
        btn.setSingleLine(true);
        btn.setMinHeight(px(40));
        btn.setPadding(px(14), 0, px(14), 0);
        GradientDrawable g = new GradientDrawable();
        g.setCornerRadius(px(999));
        if (primary) {
            g.setColor(0xFF15803D);
            btn.setTextColor(0xFFFFFFFF);
        } else {
            g.setColor(0xFFECFDF5);
            g.setStroke(px(1), 0xFFBBF7D0);
            btn.setTextColor(0xFF166534);
        }
        btn.setBackground(g);
        btn.setClickable(true);
        btn.setFocusable(true);
        btn.setOnClickListener(v -> click.run());
        return btn;
    }

    /** Tappable corporate contact row: soft emerald icon badge, title, subtitle, chevron. */
    private LinearLayout linkRow(int iconRes, String title, String sub, Runnable open) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setMinimumHeight(px(66));
        row.setPadding(px(16), px(10), px(14), px(10));
        android.util.TypedValue tv = new android.util.TypedValue();
        getTheme().resolveAttribute(android.R.attr.selectableItemBackground, tv, true);
        row.setBackgroundResource(tv.resourceId);
        row.setClickable(true);
        row.setFocusable(true);
        row.setOnClickListener(v -> open.run());

        FrameLayout disc = new FrameLayout(this);
        disc.setBackgroundResource(R.drawable.circle_emerald_soft);
        ImageView ic = icon(iconRes, 20);
        FrameLayout.LayoutParams ip = new FrameLayout.LayoutParams(px(20), px(20), Gravity.CENTER);
        disc.addView(ic, ip);
        row.addView(disc, new LinearLayout.LayoutParams(px(42), px(42)));

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        TextView ttl = text(title, 16, getColor(R.color.text_primary));
        ttl.setTypeface(getResources().getFont(R.font.plex_medium));
        col.addView(ttl);
        TextView s = new TextView(this);
        s.setText(sub);
        s.setTextSize(13.5f);
        s.setTextColor(getColor(R.color.text_secondary));
        s.setSingleLine(true);
        col.addView(s, lp(-2, -2, 2));
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(0, -2, 1);
        cp.setMarginStart(px(14));
        row.addView(col, cp);

        row.addView(icon(R.drawable.ic_chevron, 18));
        return row;
    }

    private View divider() {
        View d = new View(this);
        d.setBackgroundColor(0xFFF0F1F0);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, px(1));
        p.setMarginStart(px(72));
        d.setLayoutParams(p);
        return d;
    }

    @Override
    protected void build() {
        // ----- Corporate Brand & Founder Header Card -----
        LinearLayout heroCard = card(0);
        heroCard.setPadding(0, 0, 0, px(22));
        heroCard.setClipToOutline(true);

        // Top emerald corporate cover strip
        FrameLayout cover = new FrameLayout(this);
        cover.setBackgroundResource(R.drawable.topbar_bg);
        cover.setPadding(px(16), px(14), px(16), px(46));

        TextView badge = new TextView(this);
        badge.setText(L.t(this, "FYNEX · SOFTWARE & AUTOMATION"));
        badge.setTextColor(0xFFDCFCE7);
        badge.setTextSize(11);
        badge.setLetterSpacing(0.1f);
        badge.setTypeface(getResources().getFont(R.font.plex_medium));
        badge.setPadding(px(12), px(5), px(12), px(5));
        GradientDrawable badgeBg = new GradientDrawable();
        badgeBg.setCornerRadius(px(999));
        badgeBg.setColor(0x33FFFFFF);
        badge.setBackground(badgeBg);
        cover.addView(badge, new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER_HORIZONTAL));
        heroCard.addView(cover, new LinearLayout.LayoutParams(-1, -2));

        // Overlapping circular developer photo
        FrameLayout avatarWrap = new FrameLayout(this);
        GradientDrawable ring = new GradientDrawable();
        ring.setShape(GradientDrawable.OVAL);
        ring.setColor(0xFFFFFFFF);
        ring.setStroke(px(3), 0xFFBBF7D0);
        avatarWrap.setBackground(ring);
        avatarWrap.setPadding(px(4), px(4), px(4), px(4));

        ImageView photo = new ImageView(this);
        photo.setImageResource(R.drawable.dev_avatar);
        photo.setScaleType(ImageView.ScaleType.CENTER_CROP);
        photo.setContentDescription(Links.DEV_NAME);
        photo.setClipToOutline(true);
        photo.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View view, Outline outline) {
                outline.setOval(0, 0, view.getWidth(), view.getHeight());
            }
        });
        avatarWrap.addView(photo, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout.LayoutParams awLp = new LinearLayout.LayoutParams(px(98), px(98));
        awLp.gravity = Gravity.CENTER_HORIZONTAL;
        awLp.topMargin = px(-49);
        heroCard.addView(avatarWrap, awLp);

        TextView name = text(Links.DEV_NAME, 22, getColor(R.color.text_primary));
        name.setTypeface(getResources().getFont(R.font.plex_medium));
        name.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams np = lp(-2, -2, 12);
        np.gravity = Gravity.CENTER_HORIZONTAL;
        heroCard.addView(name, np);

        TextView role = text("Founder & Lead Developer · Fynex", 14.5f, 0xFF15803D);
        role.setTypeface(getResources().getFont(R.font.plex_medium));
        role.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams rp = lp(-2, -2, 3);
        rp.gravity = Gravity.CENTER_HORIZONTAL;
        heroCard.addView(role, rp);

        // Quick Contact Pill Row
        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setGravity(Gravity.CENTER);
        actions.setPadding(px(16), 0, px(16), 0);

        LinearLayout.LayoutParams b1 = new LinearLayout.LayoutParams(0, -2, 1);
        LinearLayout.LayoutParams b2 = new LinearLayout.LayoutParams(0, -2, 1);
        b2.setMarginStart(px(8));
        LinearLayout.LayoutParams b3 = new LinearLayout.LayoutParams(0, -2, 1);
        b3.setMarginStart(px(8));

        actions.addView(quickAction("WhatsApp", true, () -> Links.openWhatsApp(this)), b1);
        actions.addView(quickAction("Facebook", false, () -> Links.openFacebook(this, Links.FB_PROFILE_URL)), b2);
        actions.addView(quickAction("Website", false, () -> Links.open(this, Links.WEB_URL)), b3);
        heroCard.addView(actions, lp(-1, -2, 16));

        // ----- Direct Contact & Channels -----
        label("Connect", 22);
        LinearLayout links = card(8);
        links.setPadding(0, px(4), 0, px(4));

        links.addView(linkRow(R.drawable.ic_whatsapp_line, "WhatsApp", Links.WHATSAPP_NUMBER,
                () -> Links.openWhatsApp(this)));
        links.addView(divider());

        links.addView(linkRow(R.drawable.ic_facebook_line, "Facebook profile", "facebook.com/share/1CnXaXQFoL",
                () -> Links.openFacebook(this, Links.FB_PROFILE_URL)));
        links.addView(divider());

        links.addView(linkRow(R.drawable.ic_globe_line, "Official website", "fynex.site",
                () -> Links.open(this, Links.WEB_URL)));
        links.addView(divider());

        links.addView(linkRow(R.drawable.ic_mail_line, "Email", Links.DEV_EMAIL, () -> {
            try {
                startActivity(new Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:" + Links.DEV_EMAIL)));
            } catch (Exception ignored) {
                Links.open(this, Links.DEV_URL);
            }
        }));

        // ----- Company & App Info -----
        label("About the app", 22);
        LinearLayout about = card(8);
        TextView companyTitle = text("Built by Fynex", 16, getColor(R.color.text_primary));
        companyTitle.setTypeface(getResources().getFont(R.font.plex_medium));
        about.addView(companyTitle);

        about.addView(text("Nusuk Auto is developed and maintained by Ebrahim Khalil at Fynex (fynex.site) to help Umrah pilgrims automate Nusuk codes and challenges safely.", 15, 0xFF44403C), lp(-1, -2, 6));
        about.addView(text("This helper is independent and not affiliated with the Nusuk app or the Ministry of Hajj and Umrah.", 14.5f, 0xFF71717A), lp(-1, -2, 8));
        String v = AppInfo.versionName(this);
        about.addView(text("Version " + v, 14, 0xFF15803D), lp(-2, -2, 12));
    }
}
