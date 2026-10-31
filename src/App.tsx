/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SubjectCard } from './components/SubjectCard';
import { FolderView } from './components/FolderView';
import { UploadView } from './components/UploadView';
import { QuizRunner } from './components/QuizRunner';
import { DailyRoutine } from './components/DailyRoutine';
import { SettingsModal } from './components/SettingsModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { NotificationCenter } from './components/NotificationCenter';

import { ViewState } from './types';
import {
  getSetting,
  setSetting,
  getFolderById,
  getNotifications,
  NotificationItem,
} from './services/db';

import { WifiOff } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [viewState, setViewState] = useState<ViewState>({ type: 'home' });

  const [showSettings, setShowSettings] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);

  // Load notifications from IndexedDB
  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const items = await getNotifications();

        if (active) {
          setNotifications(items);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [showNotifications]);

  // Handle Android Hardware Back Button
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    let cancelled = false;

    const setupBackButton = async () => {
      const listener = await CapacitorApp.addListener(
        'backButton',
        async () => {
          if (showNotifications) {
            setShowNotifications(false);
            return;
          }

          if (showApkModal) {
            setShowApkModal(false);
            return;
          }

          if (showSettings) {
            setShowSettings(false);
            return;
          }

          if (viewState.type === 'quiz') {
            setViewState({
              type: 'subject',
              subjectId: viewState.returnToSubjectId,
              currentFolderId: viewState.returnToFolderId,
            });
            return;
          }

          if (viewState.type === 'daily-routine') {
            setViewState({ type: 'home' });
            return;
          }

          if (viewState.type === 'subject') {
            if (viewState.currentFolderId) {
              const folder = await getFolderById(
                viewState.currentFolderId
              );

              setViewState({
                type: 'subject',
                subjectId: viewState.subjectId,
                currentFolderId: folder?.parentId || null,
              });
            } else {
              setViewState({ type: 'home' });
            }
            return;
          }

          if (viewState.type === 'upload') {
            setViewState({ type: 'home' });
            return;
          }

          if (viewState.type === 'home') {
            const shouldExit = window.confirm(
              'Are you sure you want to exit MyStudy?'
            );

            if (shouldExit) {
              CapacitorApp.exitApp();
            }
          }
        }
      );

      if (cancelled) {
        await listener.remove();
      } else {
        removeListener = () => {
          void listener.remove();
        };
      }
    };

    void setupBackButton();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [
    viewState,
    showSettings,
    showApkModal,
    showNotifications,
  ]);

  // Initialize theme from persistent IndexedDB
  useEffect(() => {
    let active = true;

    const initTheme = async () => {
      try {
        const savedTheme = await getSetting<'light' | 'dark'>(
          'theme',
          'light'
        );

        if (active) {
          const dark = savedTheme === 'dark';

          setIsDark(dark);

          if (dark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      }
    };

    void initTheme();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toggle Theme
  const toggleTheme = async () => {
    const nextDark = !isDark;

    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    await setSetting('theme', nextDark ? 'dark' : 'light');
  };

  // Bottom Navigation selection
  const handleSelectTab = (tab: 'home' | 'daily-routine') => {
    if (tab === 'home') {
      setViewState({ type: 'home' });
    } else if (tab === 'daily-routine') {
      setViewState({ type: 'daily-routine' });
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200"
      style={{
        paddingTop: 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))',
      }}
    >
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-slate-50 dark:bg-slate-950 pointer-events-none"
        style={{
          height: 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))',
        }}
      />

      {/* Offline Badge */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-[11px] font-bold py-1 px-3 text-center flex items-center justify-center gap-1.5 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            Offline Mode Active • All Folders & HTML Quizzes Available
          </span>
        </div>
      )}

      {/* VIEW: HOME PAGE */}
      {viewState.type === 'home' && (
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full relative px-5 pb-28">
          <Header
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setShowSettings(true)}
            onOpenApkModal={() => setShowApkModal(true)}
            onOpenNotifications={() => setShowNotifications(true)}
          />

          <main className="mt-8 space-y-4 flex-1">
            <SubjectCard
              id="biology"
              name="Biology"
              onClick={() =>
                setViewState({
                  type: 'subject',
                  subjectId: 'biology',
                  currentFolderId: null,
                })
              }
            />

            <SubjectCard
              id="chemistry"
              name="Chemistry"
              onClick={() =>
                setViewState({
                  type: 'subject',
                  subjectId: 'chemistry',
                  currentFolderId: null,
                })
              }
            />

            <SubjectCard
              id="physics"
              name="Physics"
              onClick={() =>
                setViewState({
                  type: 'subject',
                  subjectId: 'physics',
                  currentFolderId: null,
                })
              }
            />
          </main>

          {/* Decorative Corner Leaves */}
          <div className="pointer-events-none fixed bottom-16 -left-6 opacity-20 dark:opacity-10 z-0">
            <svg
              className="w-48 h-48 text-emerald-600"
              viewBox="0 0 200 200"
              fill="currentColor"
            >
              <path d="M40,160 Q80,100 160,80 Q100,140 40,160 Z" />
              <path d="M20,180 Q60,140 140,140 Q80,180 20,180 Z" />
            </svg>
          </div>

          <div className="pointer-events-none fixed bottom-16 -right-6 opacity-20 dark:opacity-10 z-0">
            <svg
              className="w-48 h-48 text-teal-600"
              viewBox="0 0 200 200"
              fill="currentColor"
            >
              <path d="M160,160 Q120,100 40,80 Q100,140 160,160 Z" />
              <path d="M180,180 Q140,140 60,140 Q120,180 180,180 Z" />
            </svg>
          </div>

          <BottomNav
            currentTab="home"
            onSelectTab={handleSelectTab}
          />
        </div>
      )}

      {/* VIEW: DAILY ROUTINE */}
      {viewState.type === 'daily-routine' && (
        <>
          <div className="flex-1">
            <DailyRoutine
              onBack={() => setViewState({ type: 'home' })}
            />
          </div>

          <BottomNav
            currentTab="daily-routine"
            onSelectTab={handleSelectTab}
          />
        </>
      )}

      {/* VIEW: SUBJECT PAGE & FOLDER EXPLORER */}
      {viewState.type === 'subject' && (
        <div className="flex-1 flex flex-col">
          <FolderView
            key={`${viewState.subjectId}_${viewState.currentFolderId}_${dataRefreshCounter}`}
            subjectId={viewState.subjectId}
            currentFolderId={viewState.currentFolderId}
            onNavigateBack={() => setViewState({ type: 'home' })}
            onNavigateToFolder={(folderId) =>
              setViewState({
                type: 'subject',
                subjectId: viewState.subjectId,
                currentFolderId: folderId,
              })
            }
            onOpenQuiz={(fileId) =>
              setViewState({
                type: 'quiz',
                fileId,
                returnToSubjectId: viewState.subjectId,
                returnToFolderId: viewState.currentFolderId,
              })
            }
            onNavigateToUpload={(subj, folderId) =>
              setViewState({
                type: 'upload',
                preselectedSubject: subj,
                preselectedFolderId: folderId,
              })
            }
          />

          <BottomNav
            currentTab="home"
            onSelectTab={handleSelectTab}
          />
        </div>
      )}

      {/* VIEW: UPLOAD QUIZ FROM FOLDER */}
      {viewState.type === 'upload' && (
        <div className="flex-1 flex flex-col">
          <UploadView
            initialSubject={viewState.preselectedSubject || 'biology'}
            initialFolderId={viewState.preselectedFolderId || null}
            onUploadSuccess={(subjectId, folderId) => {
              setDataRefreshCounter((prev) => prev + 1);

              setViewState({
                type: 'subject',
                subjectId,
                currentFolderId: folderId,
              });
            }}
            onCancel={() => setViewState({ type: 'home' })}
          />
        </div>
      )}

      {/* VIEW: INTERACTIVE QUIZ RUNNER */}
      {viewState.type === 'quiz' && (
        <QuizRunner
          fileId={viewState.fileId}
          onBack={() =>
            setViewState({
              type: 'subject',
              subjectId: viewState.returnToSubjectId,
              currentFolderId: viewState.returnToFolderId,
            })
          }
        />
      )}

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenApkModal={() => setShowApkModal(true)}
        onDataChanged={() => setDataRefreshCounter((prev) => prev + 1)}
      />

      {/* Android APK & Project Modal */}
      <AndroidApkModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onOpenAppUpdates={() => setShowSettings(true)}
      />
    </div>
  );
            }
