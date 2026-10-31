import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  FolderPlus,
  Folder,
  FileCode,
  MoreVertical,
  SlidersHorizontal,
  FolderOpen,
  Trash2,
  Edit2,
  Play,
  Download,
  ChevronRight,
  Upload,
  Sparkles,
} from 'lucide-react';
import { FolderItem, QuizFileItem, SubjectId } from '../types';
import {
  getFolders,
  getFiles,
  createFolder,
  renameFolder,
  deleteFolder,
  renameFile,
  deleteFile,
  getFolderById,
  getAllFolders,
  saveFile,
} from '../services/db';
import { formatFileSize, SAMPLE_QUIZZES } from '../services/sampleQuizzes';
import { CreateFolderModal } from './CreateFolderModal';
import { RenameModal } from './RenameModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface FolderViewProps {
  subjectId: SubjectId;
  currentFolderId: string | null;
  onNavigateBack: () => void;
  onNavigateToFolder: (folderId: string | null) => void;
  onOpenQuiz: (fileId: string) => void;
  onNavigateToUpload: (subjectId: SubjectId, folderId: string | null) => void;
}

type SortMode = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

export const FolderView: React.FC<FolderViewProps> = ({
  subjectId,
  currentFolderId,
  onNavigateBack,
  onNavigateToFolder,
  onOpenQuiz,
  onNavigateToUpload,
}) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<QuizFileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [breadcrumbChain, setBreadcrumbChain] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Modals state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
    type: 'folder' | 'file';
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: 'folder' | 'file';
  } | null>(null);

  // Active action menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const subjectNames: Record<SubjectId, string> = {
    biology: 'Biology',
    chemistry: 'Chemistry',
    physics: 'Physics',
  };

  const subjectAccent: Record<
    SubjectId,
    {
      light: string;
      dark: string;
      headerBg: string;
      folderColor: string;
      btnColor: string;
    }
  > = {
    biology: {
      light: 'text-[#166534]',
      dark: 'dark:text-emerald-300',
      headerBg: 'bg-[#edf8f1] dark:bg-emerald-950/40',
      folderColor: 'text-emerald-600 dark:text-emerald-400',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
    chemistry: {
      light: 'text-[#7f1d1d]',
      dark: 'dark:text-rose-300',
      headerBg: 'bg-[#fdf0f0] dark:bg-rose-950/40',
      folderColor: 'text-rose-600 dark:text-rose-400',
      btnColor: 'bg-rose-700 hover:bg-rose-800',
    },
    physics: {
      light: 'text-[#0f3a60]',
      dark: 'dark:text-sky-300',
      headerBg: 'bg-[#ebf4fc] dark:bg-sky-950/40',
      folderColor: 'text-sky-600 dark:text-sky-400',
      btnColor: 'bg-sky-700 hover:bg-sky-800',
    },
  };

  // Load content
  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedFolders, loadedFiles] = await Promise.all([
        getFolders(subjectId, currentFolderId),
        getFiles(subjectId, currentFolderId),
      ]);
      setFolders(loadedFolders);
      setFiles(loadedFiles);

      // Handle breadcrumbs if inside subfolder
      if (currentFolderId) {
        const cf = await getFolderById(currentFolderId);
        setCurrentFolder(cf);

        const all = await getAllFolders(subjectId);
        const chain: FolderItem[] = [];
        let curr: FolderItem | undefined = cf || undefined;
        while (curr) {
          chain.unshift(curr);
          curr = curr.parentId ? all.find((f) => f.id === curr?.parentId) : undefined;
        }
        setBreadcrumbChain(chain);
      } else {
        setCurrentFolder(null);
        setBreadcrumbChain([]);
      }
    } catch (err) {
      console.error('Failed to load folder data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subjectId, currentFolderId]);

  // Handle folder creation
  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(subjectId, currentFolderId, name);
      await loadData();
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  // Handle rename
  const handleRename = async (newName: string) => {
    if (!renameTarget) return;
    try {
      if (renameTarget.type === 'folder') {
        await renameFolder(renameTarget.id, newName);
      } else {
        await renameFile(renameTarget.id, newName);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to rename:', err);
    } finally {
      setRenameTarget(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'folder') {
        await deleteFolder(deleteTarget.id);
      } else {
        await deleteFile(deleteTarget.id);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Handle quick sample quiz insertion (for easy testing without manual upload)
  const handleInsertSampleQuiz = async () => {
    const sample = SAMPLE_QUIZZES[subjectId];
    if (!sample) return;
    try {
      await saveFile({
        subjectId,
        folderId: currentFolderId,
        name: sample.filename,
        size: sample.content.length,
        content: sample.content,
        questionCount: 5,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to insert sample quiz:', err);
    }
  };

  // Export individual file
  const handleExportFile = (file: QuizFileItem) => {
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

  // Sorting and filtering
  const filteredFolders = useMemo(() => {
    let result = [...folders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      if (sortMode === 'name-asc') return a.name.localeCompare(b.name);
      if (sortMode === 'name-desc') return b.name.localeCompare(a.name);
      if (sortMode === 'date-desc') return b.createdAt - a.createdAt;
      return a.createdAt - b.createdAt;
    });
    return result;
  }, [folders, searchQuery, sortMode]);

  const filteredFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      if (sortMode === 'name-asc') return a.name.localeCompare(b.name);
      if (sortMode === 'name-desc') return b.name.localeCompare(a.name);
      if (sortMode === 'date-desc') return b.createdAt - a.createdAt;
      return a.createdAt - b.createdAt;
    });
    return result;
  }, [files, searchQuery, sortMode]);

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-slate-50 dark:bg-slate-950">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3" style={{ top: 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            onClick={() => {
              if (currentFolder && currentFolder.parentId) {
                onNavigateToFolder(currentFolder.parentId);
              } else if (currentFolder) {
                onNavigateToFolder(null);
              } else {
                onNavigateBack();
              }
            }}
            className="p-2 -ml-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Subject Title */}
          <div className="flex-1 min-w-0">
            <h1
              className={`text-lg font-bold truncate ${subjectAccent[subjectId].light} ${subjectAccent[subjectId].dark}`}
            >
              {subjectNames[subjectId]}
            </h1>
          </div>

          {/* Actions: Search, Sort, New Folder */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-full transition active:scale-95 ${
                showSearch
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Search"
              aria-label="Search folders and files"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                title="Sort options"
                aria-label="Sort"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>

              {/* Sort Menu Dropdown */}
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Sort By
                  </div>
                  <button
                    onClick={() => {
                      setSortMode('name-asc');
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                      sortMode === 'name-asc'
                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Name (A to Z)</span>
                    {sortMode === 'name-asc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setSortMode('name-desc');
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                      sortMode === 'name-desc'
                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Name (Z to A)</span>
                    {sortMode === 'name-desc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setSortMode('date-desc');
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                      sortMode === 'date-desc'
                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Newest First</span>
                    {sortMode === 'date-desc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setSortMode('date-asc');
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                      sortMode === 'date-asc'
                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Oldest First</span>
                    {sortMode === 'date-asc' && <span className="text-teal-600">✓</span>}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCreateFolder(true)}
              className="p-2 rounded-full text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition active:scale-95"
              title="Create Folder"
              aria-label="Create Folder"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input Bar (collapsible) */}
        {showSearch && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${currentFolder ? currentFolder.name : subjectNames[subjectId]}...`}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation Bar */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar text-xs py-1">
          <button
            onClick={() => onNavigateToFolder(null)}
            className={`font-semibold shrink-0 transition ${
              !currentFolderId
                ? 'text-teal-700 dark:text-teal-300 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {subjectNames[subjectId]}
          </button>
          {breadcrumbChain.map((f, idx) => {
            const isLast = idx === breadcrumbChain.length - 1;
            return (
              <React.Fragment key={f.id}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  onClick={() => onNavigateToFolder(f.id)}
                  disabled={isLast}
                  className={`truncate max-w-[120px] font-semibold shrink-0 transition ${
                    isLast
                      ? 'text-teal-700 dark:text-teal-300 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {f.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">Loading folders...</p>
          </div>
        ) : isEmpty ? (
          /* Requirement 3: EXACT Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-200">
            {/* Empty Folder Illustration */}
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                <FolderOpen className="w-14 h-14 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-md">
                <FolderPlus className="w-5 h-5" />
              </div>
            </div>

            {/* Empty State Text */}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              No Folders Yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-8 leading-relaxed">
              Create your first folder to organize your study files.
            </p>

            {/* Prominent "Create Folder" Button */}
            <button
              onClick={() => setShowCreateFolder(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-5 h-5" />
              <span>Create Folder</span>
            </button>

            {/* Quick Helper for Instant Testing */}
            <div className="hidden">
              <button
                onClick={handleInsertSampleQuiz}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Test with NCERT Sample Quiz ({subjectNames[subjectId]})</span>
              </button>
            </div>
          </div>
        ) : (
          /* Folders & Files List */
          <div className="space-y-5">
            {/* Subfolders Section */}
            {filteredFolders.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Folders ({filteredFolders.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/90 hover:border-teal-400/50 dark:hover:border-teal-600/50 hover:shadow-sm transition-all"
                    >
                      {/* Clickable folder body */}
                      <button
                        onClick={() => onNavigateToFolder(folder.id)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Folder className="w-5 h-5 fill-amber-400/30" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {folder.name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(folder.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </button>

                      {/* Folder 3-dot menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === folder.id ? null : folder.id)
                          }
                          className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          aria-label="Folder options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === folder.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                onNavigateToFolder(folder.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
                              <span>Open</span>
                            </button>
                            <button
                              onClick={() => {
                                setRenameTarget({
                                  id: folder.id,
                                  name: folder.name,
                                  type: 'folder',
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  id: folder.id,
                                  name: folder.name,
                                  type: 'folder',
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Files Section */}
            {filteredFiles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Quiz Files ({filteredFiles.length})
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/90 hover:border-teal-400/50 dark:hover:border-teal-600/50 hover:shadow-sm transition-all"
                    >
                      {/* Clickable file body */}
                      <button
                        onClick={() => onOpenQuiz(file.id)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <FileCode className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {file.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            {file.questionCount > 0 ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                                {file.questionCount} Qs
                              </span>
                            ) : (
                              <span>Interactive Quiz</span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Play action icon */}
                      <button
                        onClick={() => onOpenQuiz(file.id)}
                        className="p-2 mr-1 rounded-full text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition active:scale-95"
                        title="Practice Quiz"
                        aria-label="Practice Quiz"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>

                      {/* File 3-dot menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === file.id ? null : file.id)
                          }
                          className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          aria-label="File options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === file.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                onOpenQuiz(file.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Play className="w-3.5 h-3.5 text-teal-600" />
                              <span>Practice</span>
                            </button>
                            <button
                              onClick={() => {
                                handleExportFile(file);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={() => {
                                setRenameTarget({
                                  id: file.id,
                                  name: file.name,
                                  type: 'file',
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  id: file.id,
                                  name: file.name,
                                  type: 'file',
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Actions at bottom of list */}
            <div className="pt-4 flex items-center gap-2.5">
              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition flex items-center justify-center gap-2 bg-white/50 dark:bg-slate-900/50"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Subfolder</span>
              </button>

              <button
                onClick={() => onNavigateToUpload(subjectId, currentFolderId)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-dashed border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition flex items-center justify-center gap-2 bg-teal-50/40 dark:bg-teal-950/20"
              >
                <Upload className="w-4 h-4" />
                <span>+ Upload Quiz</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreate={handleCreateFolder}
        parentFolderName={currentFolder ? currentFolder.name : null}
      />

      <RenameModal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={handleRename}
        currentName={renameTarget ? renameTarget.name : ''}
        itemType={renameTarget ? renameTarget.type : 'folder'}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget ? deleteTarget.name : ''}
        itemType={deleteTarget ? deleteTarget.type : 'folder'}
      />
    </div>
  );
};
