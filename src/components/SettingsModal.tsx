
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Sun, Moon, Monitor, HardDrive, Download, Upload, Share2,
  Trash2, Smartphone, CheckCircle2, AlertCircle, Bell, BellRing,
  RefreshCw, ShieldAlert, Palette, Settings, ChevronRight, FileJson,
  Archive, Info,
} from 'lucide-react';

import {
  createFullBackupZip, restoreBackupFromZip, shareBackupToGoogleDrive,
  triggerDownload, exportJSONBackup, restoreJSONBackup,
} from '../services/backup';

import {
  getAllFolders, getAllFiles, clearAllUserData, getSetting, setSetting,
} from '../services/db';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  isDark: boolean;
  onThemeModeChange: (mode: ThemeMode) => void;
  onOpenApkModal: () => void;
  onOpenAppUpdates: () => void;
  onDataChanged: () => void;
}

interface StorageStats {
  folders: number;
  files: number;
  totalSize: number;
}

interface NotificationPreferences {
  enabled: boolean;
  appUpdates: boolean;
  studyReminders: boolean;
  announcements: boolean;
}

interface CountdownSettings {
  enabled: boolean;
  title: string;
  startDate: string;
  targetDate: string;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  appUpdates: true,
  studyReminders: true,
  announcements: true,
};

const DEFAULT_COUNTDOWN_SETTINGS: CountdownSettings = {
  enabled: false,
  title: 'My Target',
  startDate: '',
  targetDate: '',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  themeMode,
  isDark,
  onThemeModeChange,
  onOpenApkModal,
  onOpenAppUpdates,
  onDataChanged,
}) => {
  const [activeSection, setActiveSection] = useState<string>('main');
  const [stats, setStats] = useState<StorageStats>({
    folders: 0, files: 0, totalSize: 0,
  });
  const [statusMsg, setStatusMsg] = useState<{
    text: string; isError?: boolean;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);

  const [countdownSettings, setCountdownSettings] =
    useState<CountdownSettings>(DEFAULT_COUNTDOWN_SETTINGS);

  const [countdownSaving, setCountdownSaving] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    try {
      const [folders, files] = await Promise.all([
        getAllFolders(), getAllFiles(),
      ]);
      const totalSize = files.reduce(
        (acc, file) => acc + (file.size || 0), 0
      );
      setStats({ folders: folders.length, files: files.length, totalSize });
    } catch (error) {
      console.error('Failed to load storage statistics:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const saved = await getSetting<NotificationPreferences>(
        'notification_preferences', DEFAULT_NOTIFICATION_PREFERENCES
      );
      setNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES, ...saved,
      });
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const loadCountdownSettings = async () => {
    try {
      const saved = await getSetting<CountdownSettings>(
        'daily_routine_countdown_settings',
        DEFAULT_COUNTDOWN_SETTINGS
      );
      setCountdownSettings({
        ...DEFAULT_COUNTDOWN_SETTINGS, ...saved,
      });
    } catch (error) {
      console.error('Failed to load countdown settings:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveSection('main');
      setStatusMsg(null);
      setShowClearConfirm(false);
      void loadStats();
      void loadNotificationPreferences();
      void loadCountdownSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateNotificationPreference = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const updated = { ...notificationPreferences, [key]: value };

    if (key === 'enabled') {
      updated.appUpdates = value;
      updated.studyReminders = value;
      updated.announcements = value;
    }

    setNotificationPreferences(updated);

    try {
      await setSetting('notification_preferences', updated);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      setStatusMsg({
        text: 'Could not save notification preferences.',
        isError: true,
      });
    }
  };

  const saveCountdownSettings = async () => {
    if (countdownSettings.enabled) {
      if (!countdownSettings.title.trim()) {
        setStatusMsg({
          text: 'Please enter a countdown title.',
          isError: true,
        });
        return;
      }
      if (!countdownSettings.startDate || !countdownSettings.targetDate) {
        setStatusMsg({
          text: 'Please select both Start Date and Target Date.',
          isError: true,
        });
        return;
      }
      if (countdownSettings.targetDate < countdownSettings.startDate) {
        setStatusMsg({
          text: 'Target Date cannot be before Start Date.',
          isError: true,
        });
        return;
      }
    }

    try {
      setCountdownSaving(true);
      await setSetting('daily_routine_countdown_settings', {
        ...countdownSettings,
        title: countdownSettings.title.trim(),
      });
      setStatusMsg({ text: 'Countdown settings saved successfully.' });
    } catch (error) {
      console.error('Failed to save countdown settings:', error);
      setStatusMsg({
        text: 'Could not save countdown settings.',
        isError: true,
      });
    } finally {
      setCountdownSaving(false);
    }
  };

  const handleExportZip = async () => {
    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Preparing complete ZIP backup...' });
      const { blob, filename, stats: backupStats } =
        await createFullBackupZip();
      triggerDownload(blob, filename);
      setStatusMsg({
        text: `Backup created successfully: ${backupStats.files} quizzes and ${backupStats.folders} folders.`,
      });
    } catch (error) {
      console.error(error);
      setStatusMsg({ text: 'Failed to create ZIP backup.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareToDrive = async () => {
    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Preparing Google Drive backup...' });
      const { blob, filename } = await createFullBackupZip();
      const shared = await shareBackupToGoogleDrive(blob, filename);
      if (shared) {
        setStatusMsg({ text: 'Backup shared successfully.' });
      } else {
        triggerDownload(blob, filename);
        setStatusMsg({
          text: 'Backup downloaded. You can upload it to Google Drive.',
        });
      }
    } catch (error) {
      console.error(error);
      setStatusMsg({ text: 'Could not share backup.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZipFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Restoring ZIP backup...' });
      const result = await restoreBackupFromZip(file);
      await loadStats();
      onDataChanged();
      setStatusMsg({
        text: `Restored ${result.restoredFolders} folders and ${result.restoredFiles} quizzes.`,
      });
    } catch (error) {
      console.error(error);
      setStatusMsg({ text: 'Failed to restore ZIP backup.', isError: true });
    } finally {
      setIsProcessing(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Creating JSON backup...' });
      const json = await exportJSONBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const filename = `MyStudy_Backup_${new Date()
        .toISOString().slice(0, 10)}.json`;
      triggerDownload(blob, filename);
      setStatusMsg({ text: 'JSON backup downloaded successfully.' });
    } catch (error) {
      console.error(error);
      setStatusMsg({ text: 'Failed to export JSON backup.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJSONFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Reading JSON backup...' });
      const json = await file.text();
      const result = await restoreJSONBackup(json);
      await loadStats();
      onDataChanged();
      setStatusMsg({
        text: `Restored ${result.restoredFolders} folders and ${result.restoredFiles} quizzes.`,
      });
    } catch (error) {
      console.error(error);
      setStatusMsg({
        text: 'Invalid or incompatible JSON backup.',
        isError: true,
      });
    } finally {
      setIsProcessing(false);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    try {
      setIsProcessing(true);
      await clearAllUserData();
      await loadStats();
      onDataChanged();
      setShowClearConfirm(false);
      setStatusMsg({
        text: 'All local study library data has been cleared.',
      });
    } catch (error) {
      console.error(error);
      setStatusMsg({ text: 'Failed to clear local data.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const sectionButtonClass =
    'w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 transition active:scale-[0.99]';

  const iconBoxClass =
    'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center';

  const backToMain = () => {
    setActiveSection('main');
    setStatusMsg(null);
  };

  const SectionHeader = ({
    title, description,
  }: { title: string; description: string }) => (
    <div className="mb-5">
      <button
        onClick={backToMain}
        className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-4 flex items-center gap-1"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back to Settings
      </button>
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {description}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        aria-label="MyStudy Settings"
      >
        <header className="px-5 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`${iconBoxClass} bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Settings
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Customize your MyStudy experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {statusMsg && (
          <div className={`mx-4 mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.isError
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
          }`}>
            {statusMsg.isError
              ? <AlertCircle className="w-4 h-4 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeSection === 'main' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Palette className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Appearance
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Theme Mode</p>
                      <p className="text-[11px] text-slate-500 mt-1">Choose how MyStudy looks</p>
                    </div>
                    {isDark
                      ? <Moon className="w-5 h-5 text-teal-500" />
                      : <Sun className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ] as const).map((option) => {
                      const Icon = option.icon;
                      const selected = themeMode === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => onThemeModeChange(option.value)}
                          className={`py-3 rounded-xl flex flex-col items-center gap-1.5 border text-xs font-bold transition ${
                            selected
                              ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-700 dark:text-teal-300'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveSection('countdown')}
                className={sectionButtonClass}
              >
                <div className="flex items-center gap-3">
                  <div className={`${iconBoxClass} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400`}>
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Countdown Settings</p>
                    <p className="text-[11px] text-slate-500">Set your own target and dates</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button onClick={() => setActiveSection('notifications')} className={sectionButtonClass}>
                <div className="flex items-center gap-3">
                  <div className={`${iconBoxClass} bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Notifications</p>
                    <p className="text-[11px] text-slate-500">Manage notification preferences</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button onClick={onOpenAppUpdates} className={sectionButtonClass}>
                <div className="flex items-center gap-3">
                  <div className={`${iconBoxClass} bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400`}>
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">App Updates</p>
                    <p className="text-[11px] text-slate-500">Check version and available updates</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button onClick={() => setActiveSection('backup')} className={sectionButtonClass}>
                <div className="flex items-center gap-3">
                  <div className={`${iconBoxClass} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400`}>
                    <Archive className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Backup & Restore</p>
                    <p className="text-[11px] text-slate-500">ZIP, JSON and Google Drive</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button onClick={() => { void loadStats(); setActiveSection('storage'); }} className={sectionButtonClass}>
                <div className="flex items-center gap-3">
                  <div className={`${iconBoxClass} bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400`}>
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Storage Information</p>
                    <p className="text-[11px] text-slate-500">View your offline library usage</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => { onClose(); onOpenApkModal(); }}
                className={sectionButtonClass}
              >
                <div className="flex items-center gap-3">
                  <div className={`${iconBoxClass} bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">APK & Source Project</p>
                    <p className="text-[11px] text-slate-500">Android installation and project files</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSection('danger')}
                className={`${sectionButtonClass} border-rose-200 dark:border-rose-900/50`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${iconBoxClass} bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Danger Zone</p>
                    <p className="text-[11px] text-slate-500">Clear local study data</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>

              <div className="pt-3 text-center">
                <p className="text-[10px] text-slate-400">MyStudy • Learn • Practice • Improve</p>
              </div>
            </>
          )}

          {activeSection === 'countdown' && (
            <>
              <SectionHeader
                title="Countdown Settings"
                description="Configure the countdown displayed in Daily Routine."
              />

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Enable Countdown</p>
                    <p className="text-[11px] text-slate-500 mt-1">Show or hide the countdown card</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={countdownSettings.enabled}
                    onChange={(event) => setCountdownSettings((old) => ({
                      ...old, enabled: event.target.checked,
                    }))}
                    className="w-5 h-5 accent-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Countdown Title
                  </label>
                  <input
                    type="text"
                    value={countdownSettings.title}
                    onChange={(event) => setCountdownSettings((old) => ({
                      ...old, title: event.target.value,
                    }))}
                    placeholder="Example: NEET 2027"
                    maxLength={50}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={countdownSettings.startDate}
                    onChange={(event) => setCountdownSettings((old) => ({
                      ...old, startDate: event.target.value,
                    }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={countdownSettings.targetDate}
                    onChange={(event) => setCountdownSettings((old) => ({
                      ...old, targetDate: event.target.value,
                    }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  onClick={() => void saveCountdownSettings()}
                  disabled={countdownSaving}
                  className="w-full p-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {countdownSaving ? 'Saving...' : 'Save Countdown Settings'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-[11px] flex gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <p>
                  Before Start Date, the countdown will show time until Start Date.
                  From Start Date, it will show time remaining until Target Date.
                  After Target Date, it will show Target Completed.
                </p>
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <SectionHeader
                title="Notification Settings"
                description="Choose which notifications you want to receive."
              />
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BellRing className="w-5 h-5 text-teal-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">All Notifications</p>
                      <p className="text-[11px] text-slate-500">Main notification preference</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPreferences.enabled}
                    onChange={(event) => void updateNotificationPreference('enabled', event.target.checked)}
                    className="w-5 h-5 accent-teal-600"
                  />
                </div>
              </div>

              {([
                { key: 'appUpdates', title: 'App Updates', description: 'New versions and update announcements' },
                { key: 'studyReminders', title: 'Study Reminders', description: 'Study-related reminders' },
                { key: 'announcements', title: 'Announcements', description: 'Important MyStudy announcements' },
              ] as const).map((item) => (
                <div key={item.key} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPreferences[item.key]}
                    disabled={!notificationPreferences.enabled}
                    onChange={(event) => void updateNotificationPreference(item.key, event.target.checked)}
                    className="w-5 h-5 accent-teal-600 disabled:opacity-40"
                  />
                </div>
              ))}

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-[11px] flex gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <p>
                  These are saved notification preferences. Background push delivery will be connected separately through the notification service.
                </p>
              </div>
            </>
          )}

          {activeSection === 'backup' && (
            <>
              <SectionHeader
                title="Backup & Restore"
                description="Keep your study library safe and restore it whenever needed."
              />
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${iconBoxClass} bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400`}>
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Complete ZIP Backup</p>
                    <p className="text-[11px] text-slate-500">Folders and HTML quizzes</p>
                  </div>
                </div>
                <button onClick={handleExportZip} disabled={isProcessing} className="w-full p-3 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  <Download className="w-4 h-4" /> Download ZIP Backup
                </button>
                <button onClick={handleShareToDrive} disabled={isProcessing} className="w-full mt-2 p-3 rounded-xl border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  <Share2 className="w-4 h-4" /> Save / Share to Google Drive
                </button>
                <button onClick={() => zipInputRef.current?.click()} disabled={isProcessing} className="w-full mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  <Upload className="w-4 h-4" /> Restore from ZIP
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${iconBoxClass} bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400`}>
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">JSON Backup</p>
                    <p className="text-[11px] text-slate-500">Database export and restore</p>
                  </div>
                </div>
                <button onClick={handleExportJSON} disabled={isProcessing} className="w-full p-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  <Download className="w-4 h-4" /> Export JSON
                </button>
                <button onClick={() => jsonInputRef.current?.click()} disabled={isProcessing} className="w-full mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  <Upload className="w-4 h-4" /> Restore JSON
                </button>
              </div>

              <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipFileSelected} className="hidden" />
              <input ref={jsonInputRef} type="file" accept=".json" onChange={handleJSONFileSelected} className="hidden" />
            </>
          )}

          {activeSection === 'storage' && (
            <>
              <SectionHeader title="Storage Information" description="Overview of your locally stored study materials." />
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <HardDrive className="w-5 h-5 text-teal-500 mb-3" />
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.folders}</p>
                  <p className="text-xs text-slate-500">Total Folders</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <FileJson className="w-5 h-5 text-blue-500 mb-3" />
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.files}</p>
                  <p className="text-xs text-slate-500">HTML Quizzes</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 mb-2">Stored File Size</p>
                <p className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">{formatSize(stats.totalSize)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Combined size of stored quiz files</p>
              </div>
              <button onClick={() => void loadStats()} className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh Storage Information
              </button>
            </>
          )}

          {activeSection === 'danger' && (
            <>
              <SectionHeader title="Danger Zone" description="Be careful. These actions can permanently delete local study data." />
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                <div className="flex items-center gap-2 mb-3 text-rose-700 dark:text-rose-300">
                  <ShieldAlert className="w-5 h-5" />
                  <p className="text-sm font-extrabold">Clear Local Library Data</p>
                </div>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80 leading-relaxed mb-4">
                  This removes your locally stored folders, quizzes and daily routines. Export a backup before proceeding.
                </p>
                {!showClearConfirm ? (
                  <button onClick={() => setShowClearConfirm(true)} className="w-full p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Clear All Local Study Data
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-extrabold text-rose-800 dark:text-rose-200">Are you absolutely sure? This action cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowClearConfirm(false)} className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">Cancel</button>
                      <button onClick={handleClearAll} disabled={isProcessing} className="flex-1 p-3 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-50">Confirm Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {isProcessing && (
          <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
              <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
