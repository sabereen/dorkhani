package ir.dorkhani.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "MediaStore",
    permissions = {
        @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
    }
)
public class MediaStorePlugin extends Plugin {
    private static final String MIME_TYPE = "image/png";
    private static final String GALLERY_FOLDER = "Dorkhani";

    @PluginMethod
    public void cacheImage(PluginCall call) {
        String fileName = getSafeFileName(call);
        byte[] image = decodeImage(call);
        if (fileName == null || image == null) return;

        File directory = new File(getContext().getCacheDir(), "shared-images");
        if (!directory.exists() && !directory.mkdirs()) {
            call.reject("Unable to create the image cache directory.");
            return;
        }

        File file = new File(directory, fileName);
        try (FileOutputStream output = new FileOutputStream(file)) {
            output.write(image);
            JSObject result = new JSObject();
            result.put("uri", Uri.fromFile(file).toString());
            call.resolve(result);
        } catch (IOException error) {
            call.reject("Unable to cache the image.", error);
        }
    }

    @PluginMethod
    public void saveImage(PluginCall call) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }
        saveImageToGallery(call);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") != PermissionState.GRANTED) {
            call.reject("Storage permission is required to save the image.");
            return;
        }
        saveImageToGallery(call);
    }

    private void saveImageToGallery(PluginCall call) {
        String fileName = getSafeFileName(call);
        byte[] image = decodeImage(call);
        if (fileName == null || image == null) return;

        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
        values.put(MediaStore.Images.Media.MIME_TYPE, MIME_TYPE);

        Uri collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        File legacyFile = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + GALLERY_FOLDER);
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
        } else {
            File directory = new File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                GALLERY_FOLDER
            );
            if (!directory.exists() && !directory.mkdirs()) {
                call.reject("Unable to create the gallery directory.");
                return;
            }
            legacyFile = new File(directory, fileName);
            values.put(MediaStore.Images.Media.DATA, legacyFile.getAbsolutePath());
        }

        Uri uri = null;
        try {
            uri = resolver.insert(collection, values);
            if (uri == null) throw new IOException("MediaStore did not create an image entry.");
            try (OutputStream output = resolver.openOutputStream(uri)) {
                if (output == null) throw new IOException("MediaStore did not open the image entry.");
                output.write(image);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues completed = new ContentValues();
                completed.put(MediaStore.Images.Media.IS_PENDING, 0);
                resolver.update(uri, completed, null, null);
            }
            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (IOException | RuntimeException error) {
            if (uri != null) resolver.delete(uri, null, null);
            if (legacyFile != null && legacyFile.exists()) legacyFile.delete();
            call.reject("Unable to save the image to the gallery.", error);
        }
    }

    private String getSafeFileName(PluginCall call) {
        String fileName = call.getString("fileName");
        if (fileName == null || !fileName.matches("^[A-Za-z0-9._-]+\\.png$")) {
            call.reject("A valid PNG file name is required.");
            return null;
        }
        return fileName;
    }

    private byte[] decodeImage(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("Image data is required.");
            return null;
        }
        try {
            return Base64.decode(data, Base64.DEFAULT);
        } catch (IllegalArgumentException error) {
            call.reject("Image data is not valid base64.", error);
            return null;
        }
    }
}
