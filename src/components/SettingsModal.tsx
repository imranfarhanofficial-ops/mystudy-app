import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sun,
  Moon,
  HardDrive,
  Download,
  Upload,
  Share2,
  Trash2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  RefreshCw,
} from 'lucide-react';
import {
  createFullBackupZip,
  restoreBackupFromZip,
  shareBackupToGoogleDrive,
  triggerDownload,
  exportJSONBackup,
  restoreJSONBackup,
} from '../services/backup';
import { getAllFolders, getAllFiles, clearAllUserData } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenApkModal: () => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  onOpenApkModal,
  onDataChanged,
}) => {
  const [stats, setStats] = useState<{ folders: number; files: number; totalSize: number }>({
    folders: 0,
    files: 0,
    totalSize: 0,
  });
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    try {
      const [folders, files] = await Promise.all([getAllFolders(), getAllFiles()]);
      const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
      setStats({
        folders: folders.length,
        files: files.length,
        totalSize,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setStatusMsg(null);
      setShowClearConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Export full ZIP
  const handleExportZip = async () => {
    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Generating Google Drive Backup ZIP...' });
      const { blob, filename, stats: backupStats } = await createFullBackupZip();
      triggerDownload(blob, filename);
      setStatusMsg({
        text: `Exported ${backupStats.files} quizzes & ${backupStats.folders} folders to "${filename}". Upload this file to your Google Drive!`,
      });
    } catch (err: unknown) {
      console.error(err);
      setStatusMsg({ text: 'Failed to generate ZIP backup.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  // Android Native Share (Save to Google Drive)
  const handleShareToDrive = async () => {
    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Preparing Google Drive Share...' });
      const { blob, filename } = await createFullBackupZip();
      const shared = await shareBackupToGoogleDrive(blob, filename);
      if (shared) {
        setStatusMsg({ text: 'Shared to Google Drive successfully!' });
      } else {
        // Fallback to direct download
        triggerDownload(blob, filename);
        setStatusMsg({
          text: `Download started ("${filename}"). Select Google Drive in your files app to store it.`,
        });
      }
    } catch (err: unknown) {
      console.error(err);
      setStatusMsg({ text: 'Could not open share sheet.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore ZIP
  const handleZipFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setStatusMsg({ text: 'Restoring backup library...' });
      const result = await restoreBackupFromZip(file);
      await loadStats();
      onDataChanged();
      setStatusMsg({
        text: `Restored ${result.restoredFolders} folders and ${result.restoredFiles} quizzes successfully!`,
      });
    } catch (err: unknown) {
      console.error(err);
      setStatusMsg({ text: 'Failed to restore ZIP backup.', isError: true });
    } finally {
      setIsProcessing(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  // Export JSON
  const handleExportJSON = async () => {
    try {
      setIsProcessing(true);
      const json = await exportJSONBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const filename = `MyStudy_Library_${new Date().toISOString().slice(0, 10)}.json`;
      triggerDownload(blob, filename);
      setStatusMsg({ text: `Exported database to ${filename}.` });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Failed to export JSON.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore JSON
  const handleJSONFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsProcessing(true);
        setStatusMsg({ text: 'Restoring JSON data...' });
        const json = event.target?.result as string;
        const result = await restoreJSONBackup(json);
        await loadStats();
        onDataChanged();
        setStatusMsg({
          text: `Restored ${result.restoredFolders} folders and ${result.restoredFiles} quizzes.`,
        });
      } catch (err) {
        console.error(err);
        setStatusMsg({ text: 'Invalid JSON backup file.', isError: true });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  // Clear data
  const handleClearAll = async () => {
    try {
      setIsProcessing(true);
      await clearAllUserData();
      await loadStats();
      onDataChanged();
      setShowClearConfirm(false);
      setStatusMsg({ text: 'All local study files cleared.' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Failed to clear data.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings & Backup</h2>
              <p className="text-xs text-slate-400">Offline Library & Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs mb-4 flex items-center gap-2 ${
              statusMsg.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            {statusMsg.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Appearance */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Appearance
            </span>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="w-5 h-5 text-teal-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isDark ? 'Dark Theme' : 'Light Theme'}
                  </div>
                  <div className="text-[11px] text-slate-400">Persistent display setting</div>
                </div>
              </div>
              <button
                onClick={onToggleTheme}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs hover:bg-slate-100 transition"
              >
                Switch
              </button>
            </div>
          </div>

          {/* Section 2: Google Drive Backup & Restore */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Google Drive Backup & Restore
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                ZIP Package
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              Export your entire library of folders and HTML quizzes organized neatly for Google Drive. Restore anytime from the ZIP archive.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Export ZIP */}
              <button
                onClick={handleExportZip}
                disabled={isProcessing}
                className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download ZIP</span>
              </button>

              {/* Share to Google Drive directly */}
              <button
                onClick={handleShareToDrive}
                disabled={isProcessing}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs hover:bg-teal-50 dark:hover:bg-teal-950/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Save to Drive</span>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              onChange={handleZipFileSelected}
              className="hidden"
            />
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleJSONFileSelected}
              className="hidden"
            />

            {/* Restore from ZIP button */}
            <button
              onClick={() => zipInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Restore Library from ZIP</span>
            </button>
          </div>

          {/* Section 3: Android APK & App Package */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Android APK & Source Code
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenApkModal();
              }}
              className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 transition active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <div className="text-sm font-bold">Android APK & Project Download</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Install APK or get complete Android Studio project
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-xl">
                Open
              </span>
            </button>
          </div>

          {/* Section 4: Storage Statistics & Clear */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Local Storage Stats
            </span>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {stats.folders}
                </div>
                <div className="text-[10px] text-slate-400">Folders</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {stats.files}
                </div>
                <div className="text-[10px] text-slate-400">HTML Quizzes</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {(stats.totalSize / 1024).toFixed(0)} KB
                </div>
                <div className="text-[10px] text-slate-400">Offline DB</div>
              </div>
            </div>

            {/* Danger Zone: Clear Data */}
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Local Library Data</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs">
                <p className="font-bold text-rose-800 dark:text-rose-200 mb-2">
                  Permanently delete all folders and quizzes?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={isProcessing}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
