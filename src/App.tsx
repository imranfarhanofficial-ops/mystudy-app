/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SubjectCard } from './components/SubjectCard';
import { FolderView } from './components/FolderView';
import { UploadView } from './components/UploadView';
import { QuizRunner } from './components/QuizRunner';
import { SettingsModal } from './components/SettingsModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { SubjectId, ViewState } from './types';
import { getSetting, setSetting } from './services/db';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [viewState, setViewState] = useState<ViewState>({ type: 'home' });
  const [showSettings, setShowSettings] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);

  // Initialize theme from persistent IndexedDB
  useEffect(() => {
    let active = true;
    const initTheme = async () => {
      try {
        const savedTheme = await getSetting<'light' | 'dark'>('theme', 'light');
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
    initTheme();

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
  const handleSelectTab = (tab: 'home' | 'upload') => {
    if (tab === 'home') {
      setViewState({ type: 'home' });
    } else if (tab === 'upload') {
      // If we were inside a subject, carry it as preselected
      if (viewState.type === 'subject') {
        setViewState({
          type: 'upload',
          preselectedSubject: viewState.subjectId,
          preselectedFolderId: viewState.currentFolderId,
        });
      } else {
        setViewState({ type: 'upload' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200">
      {/* Offline Badge */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-[11px] font-bold py-1 px-3 text-center flex items-center justify-center gap-1.5 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode Active • All Folders & HTML Quizzes Available</span>
        </div>
      )}

      {/* VIEW: HOME PAGE */}
      {viewState.type === 'home' && (
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full relative px-5 pb-28">
          {/* Header */}
          <Header
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setShowSettings(true)}
            onOpenApkModal={() => setShowApkModal(true)}
          />

          {/* Three Subject Cards matching reference image */}
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

          {/* Decorative Corner Organic Leaves Watermark (Matching reference image) */}
          <div className="pointer-events-none fixed bottom-16 -left-6 opacity-20 dark:opacity-10 z-0">
            <svg className="w-48 h-48 text-emerald-600" viewBox="0 0 200 200" fill="currentColor">
              <path d="M40,160 Q80,100 160,80 Q100,140 40,160 Z" />
              <path d="M20,180 Q60,140 140,140 Q80,180 20,180 Z" />
            </svg>
          </div>
          <div className="pointer-events-none fixed bottom-16 -right-6 opacity-20 dark:opacity-10 z-0">
            <svg className="w-48 h-48 text-teal-600" viewBox="0 0 200 200" fill="currentColor">
              <path d="M160,160 Q120,100 40,80 Q100,140 160,160 Z" />
              <path d="M180,180 Q140,140 60,140 Q120,180 180,180 Z" />
            </svg>
          </div>

          {/* Bottom Nav */}
          <BottomNav currentTab="home" onSelectTab={handleSelectTab} />
        </div>
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
          <BottomNav currentTab="home" onSelectTab={handleSelectTab} />
        </div>
      )}

      {/* VIEW: UPLOAD FILES (TAB 2) */}
      {viewState.type === 'upload' && (
        <div className="flex-1 flex flex-col">
          <UploadView
            initialSubject={viewState.preselectedSubject || 'biology'}
            initialFolderId={viewState.preselectedFolderId || null}
            onUploadSuccess={(subjectId, folderId, fileId) => {
              setDataRefreshCounter((prev) => prev + 1);
              setViewState({
                type: 'subject',
                subjectId,
                currentFolderId: folderId,
              });
            }}
            onCancel={() => setViewState({ type: 'home' })}
          />
          <BottomNav currentTab="upload" onSelectTab={handleSelectTab} />
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
      <AndroidApkModal isOpen={showApkModal} onClose={() => setShowApkModal(false)} />
    </div>
  );
}
