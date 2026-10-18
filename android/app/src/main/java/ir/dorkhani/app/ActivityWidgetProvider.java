package ir.dorkhani.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.BroadcastReceiver.PendingResult;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import java.text.DateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

public class ActivityWidgetProvider extends AppWidgetProvider {
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static final int EXPANDED_WIDTH_DP = 250;
    private static final int EXPANDED_HEIGHT_DP = 130;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        final PendingResult pendingResult = goAsync();
        EXECUTOR.execute(() -> {
            try {
                for (int appWidgetId : appWidgetIds) update(context, manager, appWidgetId);
            } finally {
                pendingResult.finish();
            }
        });
    }

    @Override
    public void onAppWidgetOptionsChanged(
        Context context,
        AppWidgetManager manager,
        int appWidgetId,
        Bundle newOptions
    ) {
        final PendingResult pendingResult = goAsync();
        EXECUTOR.execute(() -> {
            try {
                update(context, manager, appWidgetId);
            } finally {
                pendingResult.finish();
            }
        });
    }

    private static void update(Context context, AppWidgetManager manager, int appWidgetId) {
        WidgetPreferences preferences = WidgetPreferences.read(context);
        Context localizedContext = localizedContext(context, preferences.locale);
        Bundle options = manager.getAppWidgetOptions(appWidgetId);
        int width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 180);
        int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 80);
        boolean expanded = width >= EXPANDED_WIDTH_DP || height >= EXPANDED_HEIGHT_DP;
        RemoteViews views = new RemoteViews(
            context.getPackageName(),
            expanded ? R.layout.activity_widget_expanded : R.layout.activity_widget_compact
        );

        ActivityWidgetDao.Summary summary = new ActivityWidgetDao(context).getSummary();
        bind(localizedContext, views, summary, expanded, preferences.dark);
        views.setOnClickPendingIntent(R.id.widget_root, openAppIntent(context));
        manager.updateAppWidget(appWidgetId, views);
    }

    private static void bind(
        Context context,
        RemoteViews views,
        ActivityWidgetDao.Summary summary,
        boolean expanded,
        boolean dark
    ) {
        views.setInt(
            R.id.widget_root,
            "setLayoutDirection",
            "ar".equals(context.getResources().getConfiguration().getLocales().get(0).getLanguage()) ||
                "fa".equals(context.getResources().getConfiguration().getLocales().get(0).getLanguage())
                ? View.LAYOUT_DIRECTION_RTL
                : View.LAYOUT_DIRECTION_LTR
        );
        views.setInt(
            R.id.widget_root,
            "setBackgroundResource",
            dark ? R.drawable.activity_widget_background_dark : R.drawable.activity_widget_background_light
        );

        int primary = Color.parseColor(dark ? "#EFF8F3" : "#18231F");
        int muted = Color.parseColor(dark ? "#A7BCB2" : "#617168");
        int accent = Color.parseColor(dark ? "#55C8A0" : "#176B55");
        int[] labels = {
            R.id.widget_title,
            R.id.widget_offline_label,
            R.id.widget_created_label,
            R.id.widget_picked_label,
            R.id.widget_zekr_label
        };
        int[] values = {
            R.id.widget_offline_value,
            R.id.widget_created_value,
            R.id.widget_picked_value,
            R.id.widget_zekr_value
        };
        for (int id : labels) views.setTextColor(id, accent);
        for (int id : values) views.setTextColor(id, primary);

        views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_activity_title));
        views.setTextViewText(R.id.widget_offline_label, context.getString(R.string.widget_offline));
        views.setTextViewText(R.id.widget_created_label, context.getString(R.string.widget_created));
        views.setTextViewText(R.id.widget_picked_label, context.getString(R.string.widget_picked));
        views.setTextViewText(R.id.widget_zekr_label, context.getString(R.string.widget_zekr));

        if (summary.isEmpty()) {
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_empty, context.getString(R.string.widget_empty));
            views.setTextColor(R.id.widget_empty, muted);
        } else {
            views.setViewVisibility(R.id.widget_empty, View.GONE);
        }
        for (int id : labels) {
            if (id != R.id.widget_title) {
                views.setViewVisibility(id, summary.isEmpty() ? View.GONE : View.VISIBLE);
            }
        }
        for (int id : values) {
            views.setViewVisibility(id, summary.isEmpty() ? View.GONE : View.VISIBLE);
        }

        String empty = context.getString(R.string.widget_no_activity);
        views.setTextViewText(
            R.id.widget_offline_value,
            summary.offline == null ? empty : summary.offline.title
        );
        views.setTextViewText(
            R.id.widget_created_value,
            summary.created == null ? empty : summary.created.title
        );
        views.setTextViewText(
            R.id.widget_picked_value,
            summary.picked == null
                ? empty
                : expanded
                    ? summary.picked.title
                    : (summary.picked.start + 1) + "–" + summary.picked.end
        );
        views.setTextViewText(
            R.id.widget_zekr_value,
            summary.zekr == null
                ? empty
                : expanded
                    ? summary.zekr.title
                    : formatNumber(context, summary.zekr.count)
        );

        if (!expanded) return;
        DateFormat dateFormat = DateFormat.getDateInstance(DateFormat.SHORT, locale(context));
        views.setTextViewText(
            R.id.widget_offline_meta,
            summary.offline == null
                ? ""
                : context.getString(
                    R.string.widget_offline_meta,
                    formatNumber(context, summary.offline.round),
                    formatNumber(context, Math.round(summary.offline.progress))
                )
        );
        views.setTextViewText(
            R.id.widget_created_meta,
            summary.created == null ? "" : dateFormat.format(new Date(summary.created.createdAt))
        );
        views.setTextViewText(
            R.id.widget_picked_meta,
            summary.picked == null
                ? ""
                : context.getString(
                    R.string.widget_range_meta,
                    formatNumber(context, summary.picked.start + 1),
                    formatNumber(context, summary.picked.end),
                    dateFormat.format(new Date(summary.picked.pickedAt))
                )
        );
        views.setTextViewText(
            R.id.widget_zekr_meta,
            summary.zekr == null
                ? ""
                : context.getString(R.string.widget_count_meta, formatNumber(context, summary.zekr.count))
        );
        int[] metas = {
            R.id.widget_offline_meta,
            R.id.widget_created_meta,
            R.id.widget_picked_meta,
            R.id.widget_zekr_meta
        };
        for (int id : metas) {
            views.setTextColor(id, muted);
            views.setViewVisibility(id, summary.isEmpty() ? View.GONE : View.VISIBLE);
        }
    }

    private static PendingIntent openAppIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction(Intent.ACTION_MAIN)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static Context localizedContext(Context context, String language) {
        Configuration configuration = new Configuration(context.getResources().getConfiguration());
        configuration.setLocale(new Locale(language));
        configuration.setLayoutDirection(new Locale(language));
        return context.createConfigurationContext(configuration);
    }

    private static Locale locale(Context context) {
        return context.getResources().getConfiguration().getLocales().get(0);
    }

    private static String formatNumber(Context context, long number) {
        return String.format(locale(context), "%,d", number);
    }

    private static final class WidgetPreferences {
        final String locale;
        final boolean dark;

        WidgetPreferences(String locale, boolean dark) {
            this.locale = locale;
            this.dark = dark;
        }

        static WidgetPreferences read(Context context) {
            SharedPreferences preferences = NativePreferencesPlugin.preferences(context);
            String locale = "fa";
            String colorScheme = "system";
            try {
                String json = preferences.getString("app_v1_localSettings", "{}");
                JSONObject settings = new JSONObject(json == null ? "{}" : json);
                String storedLocale = settings.optString("locale", "fa");
                if ("fa".equals(storedLocale) || "ar".equals(storedLocale) || "en".equals(storedLocale)) {
                    locale = storedLocale;
                }
                colorScheme = settings.optString("colorScheme", "system");
            } catch (Exception ignored) {}
            boolean systemDark =
                (context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) ==
                Configuration.UI_MODE_NIGHT_YES;
            boolean dark = "dark".equals(colorScheme) || ("system".equals(colorScheme) && systemDark);
            return new WidgetPreferences(locale, dark);
        }
    }
}
