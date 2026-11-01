package com.mystudy.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CountdownWidget")
public class CountdownWidgetPlugin extends Plugin {

    @PluginMethod
    public void saveSettings(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        String startDate = call.getString("startDate", "");
        String targetDate = call.getString("targetDate", "");

        SharedPreferences preferences = getContext()
                .getSharedPreferences(
                        "countdown_widget_settings",
                        Context.MODE_PRIVATE
                );

        boolean saved = preferences.edit()
                .putBoolean("enabled", enabled != null && enabled)
                .putString("startDate", startDate != null ? startDate : "")
                .putString("targetDate", targetDate != null ? targetDate : "")
                .commit();

        if (!saved) {
            call.reject("Could not save countdown widget settings.");
            return;
        }

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
}
