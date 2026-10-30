import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle,
  Copy,
  Check,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { downloadAndroidProjectZip } from '../services/projectExport';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [downloadingSource, setDownloadingSource] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadSource = async () => {
    try {
      setDownloadingSource(true);
      await downloadAndroidProjectZip();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingSource(false);
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
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Android APK & Project</h2>
              <p className="text-xs text-slate-400">Install or Download for Phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Method 1: Instant Mobile APK via PWABuilder */}
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Method 1: 30-Second APK (From Phone)</span>
              </span>
              <span className="text-[10px] bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-100 font-bold px-2 py-0.5 rounded-full">
                Fastest Free
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Google-backed PWABuilder builds a real, signed <code>.apk</code> directly from your live app URL in seconds.
            </p>

            {/* App URL copy box */}
            <div className="flex items-center gap-2 mb-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-teal-200 dark:border-teal-700 text-xs">
              <span className="truncate text-slate-600 dark:text-slate-300 font-mono text-[11px] flex-1">
                {currentAppUrl}
              </span>
              <button
                onClick={handleCopyUrl}
                className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
              >
                {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            <a
              href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentAppUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Generate APK on PWABuilder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Method 2: Complete Downloadable Android Source Project */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <span>Method 2: Complete Android Source Project (.zip)</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Contains the complete native Android project with <code>MainActivity.java</code>, <code>AndroidManifest.xml</code>, Gradle build files, and an automated GitHub Actions APK workflow.
            </p>

            <button
              onClick={handleDownloadSource}
              disabled={downloadingSource}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloadingSource
                  ? 'Generating Project ZIP...'
                  : 'Download Complete Android Project (.zip)'}
              </span>
            </button>
          </div>

          {/* Method 3: GitHub Actions Cloud Build (Connected Private Repo) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>GitHub Actions APK Generator</span>
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold px-2 py-0.5 rounded-full">
                Automated Cloud Build
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              When you push changes to your GitHub repository, the <code>build-android.yml</code> workflow automatically compiles the debug APK and publishes a GitHub Release.
            </p>

            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4 mb-2">
              <li>Push your code to the <code>main</code> branch (or go to GitHub <strong>Actions</strong> tab and tap <strong>"Run workflow"</strong>).</li>
              <li>Wait ~2 minutes for the build to finish.</li>
              <li>Download <code>MyStudy-debug.apk</code> from the <strong>Releases</strong> section or from the Actions <strong>Artifacts</strong> on your phone.</li>
            </ol>
          </div>

          {/* Standalone Home Screen Install */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Direct Phone Install (PWA Standalone)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Runs like an installed app without browser address bar
                </span>
              </div>
              {isInstalled ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Installed
                </span>
              ) : isInstallable ? (
                <button
                  onClick={install}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
                >
                  Install
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
