import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  Info,
  CheckCircle,
} from 'lucide-react';
import { QuizFileItem, SubjectId } from '../types';
import { getFileById } from '../services/db';
import { formatFileSize } from '../services/sampleQuizzes';

interface QuizRunnerProps {
  fileId: string;
  onBack: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ fileId, onBack }) => {
  const [file, setFile] = useState<QuizFileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    const fetchFile = async () => {
      try {
        const item = await getFileById(fileId);
        if (active) {
          setFile(item);
        }
      } catch (err) {
        console.error('Failed to load quiz file:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchFile();
    return () => {
      active = false;
    };
  }, [fileId]);

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  const handleDownload = () => {
    if (!file) return;
    const blob = new Blob([file.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold">Opening Interactive Quiz...</p>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
        <p className="text-base font-bold text-slate-800 dark:text-white mb-4">Quiz file not found.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm"
        >
          Return to Folders
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col bg-slate-100 dark:bg-slate-950 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Quiz Top Action Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            title="Back to folders"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {file.name}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="capitalize">{file.subjectId}</span>
              <span>•</span>
              <span>{formatFileSize(file.size)}</span>
              {file.questionCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {file.questionCount} Questions
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Quiz Info"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={handleReload}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:rotate-180"
            title="Reset Quiz State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Download HTML file"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-full text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Info Popover */}
      {showInfo && (
        <div className="bg-teal-50 dark:bg-teal-950/80 border-b border-teal-200 dark:border-teal-800 px-4 py-2.5 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Sandboxed isolated execution. Interactive forms, scoring, and explanations active.
            </span>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="font-bold underline text-[11px] ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sandboxed Interactive Quiz IFrame */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-white dark:bg-slate-900">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          title={file.name}
          srcDoc={file.content}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          className="w-full h-full border-none select-text"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
