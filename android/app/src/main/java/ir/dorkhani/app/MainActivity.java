package ir.dorkhani.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KhatmShortcutsPlugin.class);
        registerPlugin(MediaStorePlugin.class);
        registerPlugin(NativeDatabasePlugin.class);
        registerPlugin(NativePreferencesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
