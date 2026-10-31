
import React from 'react';
import {
  X,
  Bell,
  BellRing,
  Download,
  Info,
  CheckCircle2,
  ChevronRight,
  Circle,
  CheckCheck,
} from 'lucide-react';
import { NotificationItem } from '../services/db';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onOpenAppUpdates: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenAppUpdates,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((item) => !item.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'update':
        return <Download className="w-5 h-5" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      onMarkAsRead(item.id);
    }

    if (item.type === 'update') {
      onClose();
      onOpenAppUpdates();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm flex justify-center">
      <div
        className="w-full max-w-md h-full bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Notification Center"
      >
        {/* Header */}
        <header className="px-5 pt-6 pb-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Notifications
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : 'You are all caught up'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="mt-4 flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </header>

        {/* Notification List */}
        <main className="flex-1 overflow-y-auto px-4 py-5">
          {notifications.length === 0 ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mb-5">
                <Bell className="w-9 h-9 text-teal-500" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                No Notifications Yet
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                You will see app updates and important announcements here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications
                .slice()
                .sort((a, b) => b.date - a.date)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left p-4 rounded-2xl border transition active:scale-[0.99] ${
                      item.read
                        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                        : 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/60'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                          item.type === 'update'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            : item.type === 'success'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {getIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                            {item.title}
                          </h3>

                          {!item.read && (
                            <Circle className="w-2.5 h-2.5 shrink-0 fill-teal-500 text-teal-500 mt-1" />
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-slate-400">
                            {formatDate(item.date)}
                          </span>

                          {item.type === 'update' && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              View Update
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
