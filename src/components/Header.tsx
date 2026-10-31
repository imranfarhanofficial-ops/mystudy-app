import React from 'react';
import { Settings as SettingsIcon, Bell } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenApkModal: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  minimal?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenNotifications,
  unreadCount = 0,
  minimal = false,
}) => {
  const NotificationBell = () => (
    <button
      onClick={onOpenNotifications}
      className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
      title="Notifications"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
    >
      <Bell className="w-5 h-5" />

      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-950">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );

  if (minimal) {
    return (
      <header className="pt-2 pb-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg
            className="w-5 h-5 text-emerald-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-11 5" />
          </svg>

          <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white">
            My<span className="text-teal-600 dark:text-teal-400">Study</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="relative pt-6 pb-4 px-4 flex flex-col items-center">
      {/* Top Action Row */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          title="Settings"
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>

        <NotificationBell />
      </div>

      {/* Brand Logo */}
      <div className="flex flex-col items-center">
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

        <h1 className="text-3xl font-extrabold tracking-tight flex items-center">
          <span className="text-[#0f2b48] dark:text-slate-100">My</span>
          <span className="text-[#00838f] dark:text-teal-400">Study</span>
        </h1>

        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-400 font-medium">
          <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-700 inline-block" />
          <span>Learn • Practice • Improve</span>
          <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-700 inline-block" />
        </div>
      </div>
    </header>
  );
};
