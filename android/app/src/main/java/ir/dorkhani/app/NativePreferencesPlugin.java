package ir.dorkhani.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativePreferences")
public class NativePreferencesPlugin extends Plugin {
    public static final String PREFERENCES_NAME = "dorkhani_preferences";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdown();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = requiredKey(call);
        if (key == null) return;
        executor.execute(() -> {
            try {
                JSObject result = new JSObject();
                String value = preferences(getContext()).getString(key, null);
                result.put("value", value == null ? JSONObject.NULL : value);
                call.resolve(result);
            } catch (RuntimeException error) {
                call.reject("Unable to read preferences.", "PREFERENCES_READ", error);
            }
        });
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = requiredKey(call);
        String value = call.getString("value");
        if (key == null) return;
        if (value == null) {
            call.reject("Preference value is required.", "PREFERENCES_INVALID_INPUT");
            return;
        }
        executor.execute(() -> {
            try {
                if (!preferences(getContext()).edit().putString(key, value).commit()) {
                    call.reject("Unable to persist preferences.", "PREFERENCES_WRITE");
                    return;
                }
                ActivityWidgetUpdater.refreshAll(getContext());
                call.resolve();
            } catch (RuntimeException error) {
                call.reject("Unable to persist preferences.", "PREFERENCES_WRITE", error);
            }
        });
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = requiredKey(call);
        if (key == null) return;
        executor.execute(() -> {
            try {
                if (!preferences(getContext()).edit().remove(key).commit()) {
                    call.reject("Unable to remove preferences.", "PREFERENCES_WRITE");
                    return;
                }
                ActivityWidgetUpdater.refreshAll(getContext());
                call.resolve();
            } catch (RuntimeException error) {
                call.reject("Unable to remove preferences.", "PREFERENCES_WRITE", error);
            }
        });
    }

    private String requiredKey(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.trim().isEmpty()) {
            call.reject("Preference key is required.", "PREFERENCES_INVALID_INPUT");
            return null;
        }
        return key;
    }
}
