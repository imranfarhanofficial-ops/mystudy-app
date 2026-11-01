
import { Capacitor, registerPlugin } from '@capacitor/core';

interface CountdownWidgetSettings {
  enabled: boolean;
  startDate: string;
  targetDate: string;
}

interface CountdownWidgetPlugin {
  saveSettings(
    settings: CountdownWidgetSettings
  ): Promise<{ success: boolean }>;
}

const CountdownWidget = registerPlugin<CountdownWidgetPlugin>(
  'CountdownWidget'
);

export async function syncCountdownWidgetSettings(
  settings: CountdownWidgetSettings
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  await CountdownWidget.saveSettings({
    enabled: settings.enabled,
    startDate: settings.startDate,
    targetDate: settings.targetDate,
  });
}
