import React from 'react';
import { Sun, Moon, Settings as SettingsIcon, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenApkModal: () => void;
  minimal?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  onOpenSettings,
  onOpenApkModal,
  minimal = false,
}) => {
  const { isInstallable, install } = usePWAInstall();

  if (minimal) {
    return (
      <header className="pt-2 pb-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-11 5" />
          </svg>
          <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white">
            My<span className="text-teal-600 dark:text-teal-400">Study</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={install}
              className="p-1.5 rounded-full text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Install App"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Settings & Backup"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="relative pt-6 pb-4 px-4 flex flex-col items-center">
      {/* Top action row */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          title="Backup & Settings"
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>

        {/* Light / Dark Mode Toggle Pill exactly as in reference image */}
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="relative w-16 h-8 bg-slate-700 dark:bg-slate-800 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center shadow-inner"
            aria-label="Toggle theme"
          >
            {/* Sliding knob */}
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform duration-200 ease-in-out ${
                isDark ? 'translate-x-8' : 'translate-x-0'
              }`}
            >
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-slate-800 fill-slate-800" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
              )}
            </div>
            {/* Background icons */}
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
              <Sun className={`w-3.5 h-3.5 text-amber-400 ${!isDark ? 'opacity-0' : 'opacity-60'}`} />
              <Moon className={`w-3.5 h-3.5 text-slate-300 ${isDark ? 'opacity-0' : 'opacity-60'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Brand Logo & Sprout Emblem */}
      <div className="flex flex-col items-center">
        {/* Leaf sprout icon */}
        <div className="relative w-10 h-10 mb-1 flex items-center justify-center">
          <svg
            className="w-9 h-9 text-emerald-500 transform -rotate-6 filter drop-shadow-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
              fill="#10b981"
            />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>

        {/* Brand Name: "My" (navy) + "Study" (teal) */}
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center">
          <span className="text-[#0f2b48] dark:text-slate-100">My</span>
          <span className="text-[#00838f] dark:text-teal-400">Study</span>
        </h1>

        {/* Subtitle with divider lines: — Learn • Practice • Improve — */}
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-400 font-medium">
          <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-700 inline-block"></span>
          <span>Learn • Practice • Improve</span>
          <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-700 inline-block"></span>
        </div>
      </div>
    </header>
  );
};
