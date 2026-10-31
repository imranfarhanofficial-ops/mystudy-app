
import React, { useCallback, useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import {
  X,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Clock,
} from 'lucide-react';

interface AppUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GitHubAsset {
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubAsset[];
}

interface InstalledAppInfo {
  version: string;
  build: string;
}

const RELEASE_API =
  'https://api.github.com/repos/imranfarhanofficial-ops/mystudy-app/releases/latest';

function getBuildNumber(tag: string): number {
  const match = tag.match(/build\.(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const AppUpdatesModal: React.FC<AppUpdatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [installedInfo, setInstalledInfo] =
    useState<InstalledAppInfo | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    setError('');

    try {
      const [releaseResponse, appInfo] = await Promise.all([
        fetch(RELEASE_API, {
          headers: {
            Accept: 'application/vnd.github+json',
          },
          cache: 'no-store',
        }),
        CapacitorApp.getInfo().catch(() => null),
      ]);

      if (!releaseResponse.ok) {
        throw new Error(
          `GitHub returned status ${releaseResponse.status}`
        );
      }

      const latestRelease =
        (await releaseResponse.json()) as GitHubRelease;

      if (!latestRelease || !latestRelease.tag_name) {
        throw new Error('Invalid release information received.');
      }

      setRelease(latestRelease);

      if (appInfo) {
        setInstalledInfo({
          version: appInfo.version || 'Unknown',
          build: appInfo.build || '0',
        });
      } else {
        setInstalledInfo(null);
      }
    } catch (err) {
      console.error('Update check failed:', err);

      setError(
        'Could not check for updates. Please check your internet connection and try again.'
      );
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void checkForUpdates();
    }
  }, [isOpen, checkForUpdates]);

  if (!isOpen) return null;

  const latestBuild = release
    ? getBuildNumber(release.tag_name)
    : 0;

  const installedBuild = installedInfo
    ? Number(installedInfo.build) || 0
    : 0;

  const hasUpdate =
    !!release &&
    !!installedInfo &&
    latestBuild > installedBuild;

  const isLatest =
    !!release &&
    !!installedInfo &&
    latestBuild > 0 &&
    latestBuild <= installedBuild;

  const apkAsset = release?.assets?.find(
    (asset) =>
      asset.name.toLowerCase().endsWith('.apk') &&
      asset.content_type === 'application/vnd.android.package-archive'
  );

  const formattedDate = release?.published_at
    ? new Date(release.published_at).toLocaleDateString(
        undefined,
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      )
    : '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        aria-label="App Updates"
      >
        {/* Header */}
        <header className="px-5 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <RefreshCw className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                App Updates
              </h2>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Keep MyStudy up to date
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close updates"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Version */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />

              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Installed Version
              </p>
            </div>

            {installedInfo ? (
              <>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  v{installedInfo.version}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Build #{installedInfo.build}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Installed app version information is unavailable in this environment.
              </p>
            )}
          </div>

          {/* Latest Version */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Latest Available Version
              </p>

              {isChecking && (
                <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
              )}
            </div>

            {isChecking && !release ? (
              <p className="text-xs text-slate-500">
                Checking GitHub Releases...
              </p>
            ) : release ? (
              <>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {release.tag_name}
                </p>

                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  Released on {formattedDate}
                </div>

                {hasUpdate && (
                  <div className="mt-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 flex items-center gap-2 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    A newer version is available.
                  </div>
                )}

                {isLatest && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    You are using the latest available build.
                  </div>
                )}
              </>
            ) : !error ? (
              <p className="text-xs text-slate-500">
                No release information available.
              </p>
            ) : null}

            {error && (
              <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={() => void checkForUpdates()}
              disabled={isChecking}
              className="w-full mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`}
              />
              {isChecking ? 'Checking...' : 'Check for Updates'}
            </button>
          </div>

          {/* Release Notes */}
          {release && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3">
                Release Notes
              </h3>

              <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {release.body?.trim() ||
                  'No release notes were provided for this version.'}
              </div>

              <a
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400"
              >
                View GitHub Release
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* APK Download */}
          {release && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-2">
                Android APK
              </h3>

              {apkAsset ? (
                <>
                  <p className="text-[11px] text-slate-500 mb-3">
                    {apkAsset.name} • {formatSize(apkAsset.size)}
                  </p>

                  <a
                    href={apkAsset.browser_download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Latest APK
                  </a>

                  <p className="mt-3 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
                    Install only if Android accepts the APK signature.
                    If Android reports a signature mismatch, do not
                    uninstall your existing app before backing up
                    your study data.
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  No APK file is attached to this release.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

