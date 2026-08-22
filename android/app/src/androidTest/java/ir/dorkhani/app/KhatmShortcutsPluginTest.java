package ir.dorkhani.app;

import static org.junit.Assert.assertEquals;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class KhatmShortcutsPluginTest {
    @Test
    public void createsShortcutWithStableIdAndExactPrivateUrl() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Uri uri = Uri.parse("https://dorkhani.ir/ks12?t=private-token");
        ShortcutInfoCompat shortcut = KhatmShortcutsPlugin.createShortcut(
            context,
            "khatm:ks12",
            "ختم آزمایشی",
            uri
        );

        assertEquals("khatm:ks12", shortcut.getId());
        assertEquals(Intent.ACTION_VIEW, shortcut.getIntent().getAction());
        assertEquals(uri, shortcut.getIntent().getData());
    }
}
