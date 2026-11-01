
package com.mystudy.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class CountdownWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(
            Context context,
            AppWidgetManager appWidgetManager,
            int[] appWidgetIds
    ) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager =
                AppWidgetManager.getInstance(context);

        ComponentName component = new ComponentName(
                context,
                CountdownWidgetProvider.class
        );

        int[] ids = manager.getAppWidgetIds(component);

        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private static void updateWidget(
            Context context,
            AppWidgetManager manager,
            int widgetId
    ) {
        RemoteViews views = new RemoteViews(
                context.getPackageName(),
                R.layout.countdown_widget
        );

        SharedPreferences preferences =
                context.getSharedPreferences(
                        "countdown_widget_settings",
                        Context.MODE_PRIVATE
                );

        boolean enabled = preferences.getBoolean("enabled", false);
        String startDate = preferences.getString("startDate", "");
        String targetDate = preferences.getString("targetDate", "");

        long remaining = 0;

        if (enabled && !startDate.isEmpty() && !targetDate.isEmpty()) {
            try {
                SimpleDateFormat format =
                        new SimpleDateFormat("yyyy-MM-dd", Locale.US);

                format.setLenient(false);
                format.setTimeZone(TimeZone.getDefault());

                Date start = format.parse(startDate);
                Date target = format.parse(targetDate);

                if (start != null && target != null) {
                    Calendar startCalendar = Calendar.getInstance();
                    startCalendar.setTime(start);
                    startCalendar.set(Calendar.HOUR_OF_DAY, 0);
                    startCalendar.set(Calendar.MINUTE, 0);
                    startCalendar.set(Calendar.SECOND, 0);
                    startCalendar.set(Calendar.MILLISECOND, 0);

                    Calendar targetCalendar = Calendar.getInstance();
                    targetCalendar.setTime(target);
                    targetCalendar.set(Calendar.HOUR_OF_DAY, 23);
                    targetCalendar.set(Calendar.MINUTE, 59);
                    targetCalendar.set(Calendar.SECOND, 59);
                    targetCalendar.set(Calendar.MILLISECOND, 999);

                    long now = System.currentTimeMillis();
                    long destination;

                    if (now < startCalendar.getTimeInMillis()) {
                        destination = startCalendar.getTimeInMillis();
                    } else {
                        destination = targetCalendar.getTimeInMillis();
                    }

                    remaining = Math.max(0, destination - now);
                }
            } catch (Exception ignored) {
                remaining = 0;
            }
        }

        long totalSeconds = remaining / 1000;

        long days = totalSeconds / 86400;
        long hours = (totalSeconds % 86400) / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        views.setTextViewText(
                R.id.widget_days,
                String.valueOf(days)
        );

        views.setTextViewText(
                R.id.widget_hours,
                String.format(Locale.US, "%02d", hours)
        );

        views.setTextViewText(
                R.id.widget_minutes,
                String.format(Locale.US, "%02d", minutes)
        );

        views.setTextViewText(
                R.id.widget_seconds,
                String.format(Locale.US, "%02d", seconds)
        );

        manager.updateAppWidget(widgetId, views);
    }
}
