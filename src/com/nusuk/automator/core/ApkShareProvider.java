package com.nusuk.automator.core;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Exposes this installed app's own APK cleanly via a read-only content:// URI
 * (no AndroidX FileProvider dependency required) so "Share the app" sends the real APK file.
 */
public final class ApkShareProvider extends ContentProvider {
    public static final String MIME_APK = "application/vnd.android.package-archive";
    private static final String AUTHORITY_SUFFIX = ".shareprovider";
    private static final String SHARE_DIR = "share";

    public static String authority(Context c) {
        return c.getPackageName() + AUTHORITY_SUFFIX;
    }

    public static String fileName(Context c) {
        String ver = AppInfo.versionName(c);
        String clean = ver == null ? "" : ver.replaceAll("[^A-Za-z0-9._-]", "");
        return clean.isEmpty() ? "Nusuk-Auto.apk" : "Nusuk-Auto-v" + clean + ".apk";
    }

    public static Uri contentUri(Context c) {
        return new Uri.Builder()
                .scheme("content")
                .authority(authority(c))
                .appendPath(fileName(c))
                .build();
    }

    private static File sourceApk(Context c) {
        if (c == null) return null;
        ApplicationInfo ai = c.getApplicationInfo();
        if (ai == null) return null;
        String path = (ai.publicSourceDir != null && !ai.publicSourceDir.isEmpty())
                ? ai.publicSourceDir
                : ai.sourceDir;
        if (path == null || path.isEmpty()) return null;
        File f = new File(path);
        return f.exists() && f.isFile() ? f : null;
    }

    /**
     * Ensures a cleanly named APK copy exists in cacheDir/share/ so all OEM share targets
     * (WhatsApp, Telegram, Quick Share, Bluetooth, Files) can read it reliably.
     */
    public static File prepareApkFile(Context c) {
        Context app = c.getApplicationContext();
        File src = sourceApk(app);
        if (src == null) return null;

        File dir = new File(app.getCacheDir(), SHARE_DIR);
        if (!dir.exists()) dir.mkdirs();

        String name = fileName(app);
        File[] existing = dir.listFiles();
        if (existing != null) {
            for (File f : existing) {
                if (!f.getName().equals(name)) f.delete();
            }
        }

        File out = new File(dir, name);
        if (out.exists() && out.length() == src.length() && out.lastModified() >= src.lastModified() && out.length() > 0) {
            return out;
        }

        File tmp = new File(dir, name + ".tmp");
        try (InputStream in = new FileInputStream(src);
             OutputStream os = new FileOutputStream(tmp)) {
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) {
                os.write(buf, 0, n);
            }
            os.flush();
        } catch (Exception e) {
            tmp.delete();
            return src;
        }

        if (out.exists()) out.delete();
        if (tmp.renameTo(out) && out.exists() && out.length() > 0) {
            return out;
        }
        tmp.delete();
        return src;
    }

    private static File resolveApkForRead(Context c) {
        if (c == null) return null;
        File cached = new File(new File(c.getCacheDir(), SHARE_DIR), fileName(c));
        if (cached.exists() && cached.isFile() && cached.length() > 0) {
            return cached;
        }
        return prepareApkFile(c);
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public String getType(Uri uri) {
        return MIME_APK;
    }

    @Override
    public String[] getStreamTypes(Uri uri, String mimeTypeFilter) {
        if (mimeTypeFilter == null || "*/*".equals(mimeTypeFilter)
                || "application/*".equals(mimeTypeFilter)
                || MIME_APK.equalsIgnoreCase(mimeTypeFilter)) {
            return new String[]{MIME_APK};
        }
        return null;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        Context c = getContext();
        File file = resolveApkForRead(c);
        String name = c != null ? fileName(c) : "Nusuk-Auto.apk";
        long size = file != null ? file.length() : 0L;

        String[] cols = (projection != null && projection.length > 0)
                ? projection
                : new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};

        String[] outCols = new String[cols.length];
        Object[] values = new Object[cols.length];
        int i = 0;
        for (String col : cols) {
            if (OpenableColumns.DISPLAY_NAME.equals(col)) {
                outCols[i] = OpenableColumns.DISPLAY_NAME;
                values[i++] = name;
            } else if (OpenableColumns.SIZE.equals(col)) {
                outCols[i] = OpenableColumns.SIZE;
                values[i++] = size;
            } else if ("mime_type".equals(col)) {
                outCols[i] = "mime_type";
                values[i++] = MIME_APK;
            } else {
                outCols[i] = col;
                values[i++] = null;
            }
        }
        MatrixCursor cursor = new MatrixCursor(outCols, 1);
        cursor.addRow(values);
        return cursor;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (mode == null || mode.contains("w") || mode.contains("t")) {
            throw new SecurityException("Read-only provider");
        }
        File file = resolveApkForRead(getContext());
        if (file == null || !file.exists() || !file.canRead()) {
            throw new FileNotFoundException("APK file not available");
        }
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        throw new UnsupportedOperationException("Read-only");
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        throw new UnsupportedOperationException("Read-only");
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        throw new UnsupportedOperationException("Read-only");
    }
}
