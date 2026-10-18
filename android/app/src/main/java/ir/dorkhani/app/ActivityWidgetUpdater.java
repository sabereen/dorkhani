package ir.dorkhani.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

public final class ActivityWidgetUpdater {
    private ActivityWidgetUpdater() {}

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, ActivityWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        if (ids.length == 0) return;
        Intent intent = new Intent(context, ActivityWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);
    }
}
