import React, { useState, useEffect, useRef } from 'react';
import {
  CloudUpload,
  FileCode,
  CheckCircle2,
  Folder,
  ChevronRight,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { SubjectId, FolderItem } from '../types';
import { getAllFolders, saveFile } from '../services/db';
import { detectQuestionCount, formatFileSize, SAMPLE_QUIZZES } from '../services/sampleQuizzes';

interface UploadViewProps {
  initialSubject?: SubjectId;
  initialFolderId?: string | null;
  onUploadSuccess: (subjectId: SubjectId, folderId: string | null, fileId: string) => void;
  onCancel: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  initialSubject = 'biology',
  initialFolderId = null,
  onUploadSuccess,
  onCancel,
}) => {
  // Step 1: Selected file state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    content: string;
    questionCount: number;
  } | null>(null);

  // Step 2: Destination subject & folder
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initialSubject);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);

  // Folders in selected subject
  const [subjectFolders, setSubjectFolders] = useState<FolderItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load folders when selectedSubject changes
  useEffect(() => {
    let active = true;
    const fetchFolders = async () => {
      try {
        const folders = await getAllFolders(selectedSubject);
        if (active) {
          setSubjectFolders(folders);
          // If previous selected folder doesn't belong to this subject, reset to root
          if (selectedFolderId && !folders.some((f) => f.id === selectedFolderId)) {
            setSelectedFolderId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load folders for upload:', err);
      }
    };
    fetchFolders();
    return () => {
      active = false;
    };
  }, [selectedSubject]);

  // Handle native Android / browser file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const nameLower = file.name.toLowerCase();

    if (!nameLower.endsWith('.html') && !nameLower.endsWith('.htm')) {
      setErrorMsg('Please select a valid .html or .htm interactive quiz file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const questionCount = detectQuestionCount(content);
      setSelectedFile({
        name: file.name,
        size: file.size,
        content,
        questionCount,
      });
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file. Please try again.');
    };
    reader.readAsText(file);
  };

  // Helper to load sample quiz for 1-click test
  const handleUseSample = (subj: SubjectId) => {
    const sample = SAMPLE_QUIZZES[subj];
    setSelectedSubject(subj);
    setSelectedFile({
      name: sample.filename,
      size: sample.content.length,
      content: sample.content,
      questionCount: detectQuestionCount(sample.content),
    });
    setErrorMsg(null);
  };

  // Build tree representation or flat hierarchy of folders for picker
  const folderHierarchy = React.useMemo(() => {
    const map = new Map<string, FolderItem>();
    subjectFolders.forEach((f) => map.set(f.id, f));

    function getPathString(f: FolderItem): string {
      const parts = [f.name];
      let curr = f;
      while (curr.parentId && map.has(curr.parentId)) {
        curr = map.get(curr.parentId)!;
        parts.unshift(curr.name);
      }
      return parts.join(' → ');
    }

    return subjectFolders.map((f) => ({
      ...f,
      fullPath: getPathString(f),
    })).sort((a, b) => a.fullPath.localeCompare(b.fullPath));
  }, [subjectFolders]);

  // Find human-readable label of current destination
  const destinationPathLabel = React.useMemo(() => {
    const subjName =
      selectedSubject === 'biology'
        ? 'Biology'
        : selectedSubject === 'chemistry'
        ? 'Chemistry'
        : 'Physics';

    if (!selectedFolderId) {
      return `${subjName} (Root Folder)`;
    }
    const found = folderHierarchy.find((f) => f.id === selectedFolderId);
    return found ? `${subjName} → ${found.fullPath}` : subjName;
  }, [selectedSubject, selectedFolderId, folderHierarchy]);

  // Save and upload
  const handleUploadAndSave = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select an HTML quiz file first.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);

      const saved = await saveFile({
        subjectId: selectedSubject,
        folderId: selectedFolderId,
        name: selectedFile.name,
        size: selectedFile.size,
        content: selectedFile.content,
        questionCount: selectedFile.questionCount,
      });

      onUploadSuccess(selectedSubject, selectedFolderId, saved.id);
    } catch (err: unknown) {
      console.error('Failed to save file:', err);
      setErrorMsg((err as Error).message || 'Failed to save quiz file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-white">
                Upload Quiz File
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Import Claude AI interactive HTML quizzes
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 px-4 py-5 max-w-md mx-auto w-full space-y-6">
        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Choose File */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Step 1 • Choose File
            </span>
            <span className="text-[11px] text-slate-400">.html or .htm</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleFileChange}
            className="hidden"
            id="quiz-file-input"
          />

          {!selectedFile ? (
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 transition flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CloudUpload className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Select HTML Quiz File
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Tap to browse Android Phone Storage
                </span>
              </button>

              {/* Sample testing options */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-2">
                  Or load a pre-built Claude AI NCERT quiz to test:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUseSample('biology')}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Bio Sample</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseSample('chemistry')}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-rose-600" />
                    <span>Chem Sample</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseSample('physics')}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>Phys Sample</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Selected File Summary Card */
            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatFileSize(selectedFile.size)}</span>
                      <span>•</span>
                      {selectedFile.questionCount > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/70 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md">
                          {selectedFile.questionCount} Questions Detected
                        </span>
                      ) : (
                        <span>Interactive Quiz</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </section>

        {/* STEP 2: Select Destination Subject */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-3">
            Step 2 • Select Destination Subject
          </span>

          <div className="grid grid-cols-3 gap-2">
            {/* Biology */}
            <button
              type="button"
              onClick={() => setSelectedSubject('biology')}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                selectedSubject === 'biology'
                  ? 'bg-[#edf8f1] dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20 text-[#166534] dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-sm">Biology</span>
            </button>

            {/* Chemistry */}
            <button
              type="button"
              onClick={() => setSelectedSubject('chemistry')}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                selectedSubject === 'chemistry'
                  ? 'bg-[#fdf0f0] dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20 text-[#7f1d1d] dark:text-rose-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-sm">Chemistry</span>
            </button>

            {/* Physics */}
            <button
              type="button"
              onClick={() => setSelectedSubject('physics')}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                selectedSubject === 'physics'
                  ? 'bg-[#ebf4fc] dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/20 text-[#0f3a60] dark:text-sky-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-sm">Physics</span>
            </button>
          </div>
        </section>

        {/* STEP 3 & 4: Browse & Select Destination Folder */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Step 3 • Destination Folder
            </span>
            <span className="text-[11px] text-slate-400">
              {subjectFolders.length} folder{subjectFolders.length === 1 ? '' : 's'} available
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {/* Subject Root Option */}
            <label
              className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                selectedFolderId === null
                  ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-400 dark:border-teal-700 text-teal-900 dark:text-teal-100 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="destinationFolder"
                checked={selectedFolderId === null}
                onChange={() => setSelectedFolderId(null)}
                className="accent-teal-600 w-4 h-4"
              />
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>
                  Root of{' '}
                  {selectedSubject === 'biology'
                    ? 'Biology'
                    : selectedSubject === 'chemistry'
                    ? 'Chemistry'
                    : 'Physics'}
                </span>
              </div>
            </label>

            {/* List Existing Folders */}
            {folderHierarchy.map((folder) => (
              <label
                key={folder.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  selectedFolderId === folder.id
                    ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-400 dark:border-teal-700 text-teal-900 dark:text-teal-100 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="destinationFolder"
                  checked={selectedFolderId === folder.id}
                  onChange={() => setSelectedFolderId(folder.id)}
                  className="accent-teal-600 w-4 h-4"
                />
                <div className="flex items-center gap-2 text-sm truncate">
                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">{folder.fullPath}</span>
                </div>
              </label>
            ))}

            {folderHierarchy.length === 0 && (
              <div className="p-3 text-xs text-slate-400 dark:text-slate-500 italic text-center">
                No folders created yet in this subject. File will be saved in the root subject folder.
              </div>
            )}
          </div>
        </section>

        {/* STEP 5 & 6: Confirmation & Upload */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
              Destination Summary
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 font-semibold break-all">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{destinationPathLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUploadAndSave}
            disabled={!selectedFile || isUploading}
            className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving to Library...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-5 h-5" />
                <span>Upload & Save</span>
              </>
            )}
          </button>
        </section>
      </main>
    </div>
  );
};
