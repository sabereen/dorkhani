package ir.dorkhani.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Collections;

@CapacitorPlugin(name = "KhatmShortcuts")
public class KhatmShortcutsPlugin extends Plugin {
    private static final String APP_LINK_HOST = "dorkhani.ir";

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", ShortcutManagerCompat.isRequestPinShortcutSupported(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void pin(PluginCall call) {
        String id = call.getString("id");
        String title = call.getString("title");
        String url = call.getString("url");
        if (id == null || id.trim().isEmpty() || title == null || title.trim().isEmpty() || url == null) {
            call.reject("Shortcut id, title, and URL are required.");
            return;
        }

        Uri uri = Uri.parse(url);
        String path = uri.getPath();
        boolean isKhatmPath = path != null && path.matches("^/(?:ar/|en/)?(?:ks?|as?)\\d+(?:/.*)?$");
        if (
            !"https".equals(uri.getScheme()) ||
            !APP_LINK_HOST.equals(uri.getHost()) ||
            uri.getPort() != -1 ||
            uri.getUserInfo() != null ||
            !isKhatmPath
        ) {
            call.reject("Shortcut URL must use the official HTTPS origin.");
            return;
        }

        try {
            ShortcutInfoCompat shortcut = createShortcut(getContext(), id, title, uri);
            boolean requested = ShortcutManagerCompat.requestPinShortcut(getContext(), shortcut, null);
            JSObject result = new JSObject();
            result.put("requested", requested);
            call.resolve(result);
        } catch (RuntimeException error) {
            call.reject("Unable to request a pinned shortcut.", error);
        }
    }

    @PluginMethod
    public void disable(PluginCall call) {
        String id = call.getString("id");
        String message = call.getString("message", "This shortcut is no longer available.");
        if (id == null || id.trim().isEmpty()) {
            call.reject("Shortcut id is required.");
            return;
        }
        try {
            ShortcutManagerCompat.disableShortcuts(
                getContext(),
                Collections.singletonList(id),
                message
            );
            call.resolve();
        } catch (RuntimeException error) {
            call.reject("Unable to disable the pinned shortcut.", error);
        }
    }

    static ShortcutInfoCompat createShortcut(Context context, String id, String title, Uri uri) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction(Intent.ACTION_VIEW)
            .setData(uri)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        String shortTitle = title.length() > 40 ? title.substring(0, 40) : title;
        return new ShortcutInfoCompat.Builder(context, id)
            .setShortLabel(shortTitle)
            .setLongLabel(title)
            .setIcon(IconCompat.createWithResource(context, R.mipmap.ic_launcher))
            .setIntent(intent)
            .build();
    }
}
