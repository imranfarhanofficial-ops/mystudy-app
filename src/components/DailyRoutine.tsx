
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarCheck, MoreVertical, Plus, Check,
  Pencil, Lock, LockKeyhole, Bed, BookOpen, FlaskConical,
  Atom, Dumbbell, Droplets, Sunrise, Moon, X, Save,
  ClipboardList, Building2, Trash2, Clock,
} from 'lucide-react';

import {
  getDailyRoutines,
  createDailyRoutine,
  updateDailyRoutine,
  lockDailyRoutine,
  completeDailyRoutine,
  deleteCompletedDailyRoutines,
  getSetting,
  DailyRoutineItem,
} from '../services/db';

interface DailyRoutineProps {
  onBack: () => void;
}

interface CountdownSettings {
  enabled: boolean;
  title: string;
  startDate: string;
  targetDate: string;
}

const DEFAULT_COUNTDOWN_SETTINGS: CountdownSettings = {
  enabled: false,
  title: 'My Target',
  startDate: '',
  targetDate: '',
};

function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDateStart(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function getRoutineIcon(title: string) {
  const value = title.toLowerCase();
  if (/sleep|wake|bed|ঘুম|উঠ/.test(value)) return Bed;
  if (/namaz|prayer|সালাত|নামাজ/.test(value)) return Building2;
  if (/biology|জীববিজ্ঞান/.test(value)) return BookOpen;
  if (/chemistry|রসায়ন/.test(value)) return FlaskConical;
  if (/physics|পদার্থ/.test(value)) return Atom;
  if (/exercise|gym|workout|ব্যায়াম/.test(value)) return Dumbbell;
  if (/water|drink|পানি|জল/.test(value)) return Droplets;
  if (/morning|sunrise|ফজর|সকাল/.test(value)) return Sunrise;
  if (/night|রাত/.test(value)) return Moon;
  return ClipboardList;
}

const DecorativeLeaves = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <svg className="absolute -left-7 top-16 w-24 h-32 opacity-65" viewBox="0 0 130 160" fill="none">
      <path d="M8 5C35 38 57 77 88 145" stroke="#16a34a" strokeWidth="3"/>
      <path d="M22 35C-2 16 0 0 0 0C27 4 39 19 22 35Z" fill="#4ade80"/>
      <path d="M42 66C16 50 15 31 15 31C43 33 56 49 42 66Z" fill="#22c55e"/>
      <path d="M62 98C36 83 34 64 34 64C62 66 75 82 62 98Z" fill="#86efac"/>
      <path d="M28 45C48 22 67 26 67 26C56 52 39 59 28 45Z" fill="#16a34a"/>
    </svg>
    <svg className="absolute -right-7 top-20 w-28 h-36 opacity-65" viewBox="0 0 140 170" fill="none">
      <path d="M130 5C103 44 75 88 37 153" stroke="#16a34a" strokeWidth="3"/>
      <path d="M110 35C134 12 136 0 136 0C108 4 95 19 110 35Z" fill="#4ade80"/>
      <path d="M88 68C114 49 117 31 117 31C89 34 76 51 88 68Z" fill="#22c55e"/>
      <path d="M66 103C91 83 94 65 94 65C66 68 53 85 66 103Z" fill="#86efac"/>
    </svg>
    <div className="absolute -left-16 top-[40%] w-36 h-36 rounded-full bg-green-300/20 blur-3xl"/>
    <div className="absolute -right-16 top-[55%] w-40 h-40 rounded-full bg-emerald-300/20 blur-3xl"/>
  </div>
);

export const DailyRoutine: React.FC<DailyRoutineProps> = ({ onBack }) => {
  const [now, setNow] = useState(new Date());
  const [routines, setRoutines] = useState<DailyRoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [countdownSettings, setCountdownSettings] =
    useState<CountdownSettings>(DEFAULT_COUNTDOWN_SETTINGS);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCompleted, setDeletingCompleted] = useState(false);

  const dateKey = getLocalDateKey(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const saved = await getSetting<CountdownSettings>(
          'daily_routine_countdown_settings',
          DEFAULT_COUNTDOWN_SETTINGS
        );

        if (active) {
          setCountdownSettings({
            ...DEFAULT_COUNTDOWN_SETTINGS,
            ...saved,
          });
        }
      } catch (error) {
        console.error('Failed to load countdown settings:', error);
      }
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      try {
        const result = await getDailyRoutines(dateKey);
        if (active) setRoutines(result);
      } catch (error) {
        console.error('Failed to load daily routines:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [dateKey]);

  const pending = useMemo(
    () => routines.filter(item => !item.completed),
    [routines]
  );

  const completed = useMemo(
    () => routines.filter(item => item.completed),
    [routines]
  );

  const countdown = useMemo(() => {
    if (
      !countdownSettings.enabled ||
      !countdownSettings.startDate ||
      !countdownSettings.targetDate
    ) {
      return null;
    }

    const currentTime = now.getTime();
    const startTime = getDateStart(countdownSettings.startDate);
    const targetEndTime =
      getDateStart(countdownSettings.targetDate) + 86400000;

    let destination: number;

    if (currentTime < startTime) {
      destination = startTime;
    } else if (currentTime < targetEndTime) {
      destination = targetEndTime;
    } else {
      return {
        completed: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const difference = Math.max(0, destination - currentTime);
    const totalSeconds = Math.floor(difference / 1000);

    return {
      completed: false,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [now, countdownSettings]);

  const visibleDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;

    try {
      const created = await createDailyRoutine(dateKey, title);

      setRoutines(previous =>
        [...previous, created].sort((a, b) => a.createdAt - b.createdAt)
      );

      setNewTitle('');
      setShowCreate(false);
    } catch (error) {
      console.error(error);
      alert('Routine তৈরি করা যায়নি। আবার চেষ্টা করো।');
    }
  };

  const handleEdit = async (id: string) => {
    const title = editingTitle.trim();

    if (!title) {
      alert('Routine-এর নাম লিখো।');
      return;
    }

    try {
      await updateDailyRoutine(id, title);

      setRoutines(previous =>
        previous.map(item => item.id === id ? { ...item, title } : item)
      );

      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error(error);
      alert('এই Routine পরিবর্তন করা যাচ্ছে না।');
    }
  };

  const handleLock = async (item: DailyRoutineItem) => {
    if (item.locked || item.completed) return;

    if (!window.confirm('এই Routine Lock করলে আর Edit করা যাবে না। Lock করতে চাও?')) {
      return;
    }

    try {
      await lockDailyRoutine(item.id);

      setRoutines(previous =>
        previous.map(r => r.id === item.id ? { ...r, locked: true } : r)
      );
    } catch (error) {
      console.error(error);
      alert('Routine Lock করা যায়নি।');
    }
  };

  const handleComplete = async (item: DailyRoutineItem) => {
    if (item.completed) return;

    try {
      await completeDailyRoutine(item.id);

      setRoutines(previous =>
        previous.map(r =>
          r.id === item.id
            ? { ...r, completed: true, completedAt: Date.now() }
            : r
        )
      );
    } catch (error) {
      console.error(error);
      alert('Routine Complete করা যায়নি।');
    }
  };

  const handleDeleteCompleted = async () => {
    if (completed.length === 0) {
      setShowDeleteConfirm(false);
      return;
    }

    setDeletingCompleted(true);

    try {
      await deleteCompletedDailyRoutines(dateKey);

      setRoutines(previous => previous.filter(item => !item.completed));
      setShowDeleteConfirm(false);

      alert('Completed Routines ডিলিট করা হয়েছে।');
    } catch (error) {
      console.error(error);
      alert('Completed Routines ডিলিট করা যায়নি।');
    } finally {
      setDeletingCompleted(false);
    }
  };

  const renderRoutine = (item: DailyRoutineItem, isCompleted: boolean) => {
    const Icon = getRoutineIcon(item.title);
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        className="flex items-center gap-1 min-h-[39px] px-1.5 py-0.5 bg-white/95 dark:bg-slate-800/95 border border-emerald-100 dark:border-slate-700 rounded-xl shadow-sm"
      >
        <button
          type="button"
          disabled={isCompleted}
          onClick={() => handleComplete(item)}
          aria-label={isCompleted ? 'Completed' : 'Mark complete'}
          className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center ${
            isCompleted
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-500 text-transparent'
          }`}
        >
          {isCompleted && <Check size={16} strokeWidth={3}/>}
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0"/>

        <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40">
          <Icon size={19} className="text-emerald-600 dark:text-emerald-400"/>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0"/>

        {isEditing ? (
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <input
              autoFocus
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleEdit(item.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-full min-w-0 bg-emerald-50 dark:bg-slate-900 rounded-md px-1.5 py-1 text-xs outline-none border border-emerald-300"
            />
            <button onClick={() => handleEdit(item.id)} className="p-1 text-green-600" aria-label="Save">
              <Save size={16}/>
            </button>
            <button onClick={() => setEditingId(null)} className="p-1 text-slate-500" aria-label="Cancel">
              <X size={16}/>
            </button>
          </div>
        ) : (
          <div className={`flex-1 min-w-0 text-[13px] leading-tight font-semibold break-words ${
            isCompleted
              ? 'text-slate-500 dark:text-slate-400 line-through'
              : 'text-slate-800 dark:text-slate-100'
          }`}>
            {item.title}
          </div>
        )}

        {!isCompleted && !isEditing && (
          <>
            <button
              disabled={item.locked}
              onClick={() => {
                setEditingId(item.id);
                setEditingTitle(item.title);
              }}
              className={`p-1 shrink-0 ${item.locked ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}
              aria-label="Edit routine"
            >
              <Pencil size={16}/>
            </button>

            <button
              onClick={() => handleLock(item)}
              className={`p-1 shrink-0 ${item.locked ? 'text-green-600' : 'text-slate-600 dark:text-slate-300'}`}
              aria-label={item.locked ? 'Locked' : 'Lock routine'}
            >
              {item.locked ? <LockKeyhole size={17}/> : <Lock size={17}/>}
            </button>
          </>
        )}

        {isCompleted && (
          <div className="p-1 shrink-0 text-slate-500">
            <LockKeyhole size={17}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-gradient-to-b from-[#e6fff0] via-[#f4fff7] to-[#e5f9ed] dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-white flex flex-col">
      <DecorativeLeaves/>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 px-2 py-1.5 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="p-1.5 rounded-full" aria-label="Go back">
          <ArrowLeft size={23}/>
        </button>

        <div className="flex items-center gap-1.5">
          <CalendarCheck size={26} className="text-emerald-600"/>
          <h1 className="text-[21px] font-extrabold tracking-tight">Daily Routine</h1>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5" aria-label="More options">
            <MoreVertical size={22}/>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-emerald-100 dark:border-slate-700 p-1.5">
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (completed.length === 0) {
                    alert('এই দিনের কোনো Completed Routine নেই।');
                  } else {
                    setShowDeleteConfirm(true);
                  }
                }}
                className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={16}/>
                Delete Completed Routines
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 w-full max-w-2xl mx-auto px-2.5 sm:px-4 pt-1.5 pb-24">

        {/* Reference Countdown Card */}
        <section className="relative flex justify-center mb-1.5">

          {/* Reference Background Glow */}
          <div className="pointer-events-none absolute -left-5 top-[15%] h-28 w-28 rounded-full bg-green-400/25 blur-xl"/>
          <div className="pointer-events-none absolute -right-5 top-[15%] h-28 w-28 rounded-full bg-green-400/25 blur-xl"/>
          <div className="pointer-events-none absolute -left-5 bottom-[10%] h-28 w-28 rounded-full bg-green-400/20 blur-xl"/>
          <div className="pointer-events-none absolute -right-5 bottom-[10%] h-28 w-28 rounded-full bg-green-400/20 blur-xl"/>

          {countdownSettings.enabled && countdown ? (
            <div className="relative z-10 w-full max-w-[680px] overflow-hidden rounded-[26px] sm:rounded-[36px] border-[3.5px] border-[#00be5e] bg-white px-5 py-6 sm:px-9 sm:pt-8 sm:pb-9 shadow-[0_16px_35px_rgba(0,190,94,0.08)]">

              {/* Card Header */}
              <div className="relative z-10 mb-6 sm:mb-7 flex items-center justify-between">

                <div className="flex min-w-0 items-center gap-3 sm:gap-[22px]">

                  {/* Target Icon */}
                  <div className="flex shrink-0 items-center justify-center text-[#00be5e]">
                    <svg
                      className="h-11 w-11 sm:h-[62px] sm:w-[62px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6a6 6 0 1 0 6 6"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="m19 5-7 7"/>
                      <path d="m14 5 5 0 0 5"/>
                    </svg>
                  </div>

                  {/* Divider */}
                  <div className="h-[42px] w-[2px] shrink-0 rounded-sm bg-[#a4b0be] sm:h-[52px]"/>

                  {/* Dynamic Title */}
                  <div className="flex min-w-0 flex-col">
                    <h2 className="break-words text-[25px] font-black leading-[1.1] tracking-[-0.5px] text-[#0a142f] sm:text-[38px]">
                      {countdownSettings.title}
                    </h2>

                    <p className="mt-1 text-[14px] font-bold tracking-[-0.2px] text-[#6c7a93] sm:text-[21px]">
                      Target Countdown
                    </p>
                  </div>
                </div>

                {/* Calendar Icon */}
                <div className="ml-2 flex shrink-0 items-center justify-center text-[#00be5e]">
                  <svg
                    className="h-10 w-10 sm:h-[58px] sm:w-[58px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="4" ry="4"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <path d="m9 16 2 2 4-4"/>
                  </svg>
                </div>
              </div>

              {/* Timer Grid */}
              {countdown.completed ? (
                <div className="relative z-10 rounded-[16px] sm:rounded-[22px] border-[1.8px] border-[#c7ecd5] bg-white px-2 py-6 text-center text-xl font-black text-[#005f2b]">
                  Target Completed
                </div>
              ) : (
                <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-4">

                  {[
                    { label: 'Days', value: countdown.days },
                    { label: 'Hours', value: countdown.hours },
                    { label: 'Minutes', value: countdown.minutes },
                    { label: 'Seconds', value: countdown.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="flex min-w-0 flex-col items-center justify-center rounded-[16px] border-[1.8px] border-[#c7ecd5] bg-white px-1 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.02)] transition-transform duration-200 hover:-translate-y-0.5 sm:rounded-[22px] sm:px-2 sm:pt-4 sm:pb-[18px]"
                    >
                      <span className="mb-2 text-[clamp(25px,7vw,32px)] font-black leading-none text-[#005f2b] sm:text-[52px]">
                        {unit.value}
                      </span>

                      <span className="whitespace-nowrap text-[clamp(10px,3vw,13px)] font-bold text-[#00873d] sm:text-[20px]">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Right Green Corner Accent */}
              <div className="pointer-events-none absolute -bottom-[35px] -right-[35px] z-0 h-[120px] w-[120px] rounded-full bg-gradient-to-br from-[rgba(82,231,142,0.8)] to-[rgba(0,190,94,0.9)]"/>
            </div>
          ) : (
            <div className="relative z-10 w-full max-w-[680px] rounded-[26px] border-[3.5px] border-[#00be5e] bg-white px-5 py-6 text-center shadow-[0_16px_35px_rgba(0,190,94,0.08)] sm:rounded-[36px]">
              <Clock size={24} className="mx-auto mb-1 text-[#00be5e]"/>
              <p className="text-sm font-extrabold text-[#0a142f]">
                Countdown is disabled
              </p>
              <p className="text-[11px] text-[#6c7a93]">
                Enable it from Settings.
              </p>
            </div>
          )}
        </section>

        {/* Date */}
        <div className="text-center mb-1.5">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
            {visibleDate}
          </span>
        </div>

        {/* Create Button */}
        <div className="flex justify-center mb-2.5">
          <button
            onClick={() => setShowCreate(true)}
            className="w-[76%] min-h-[43px] rounded-full bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 text-white text-[16px] font-extrabold flex items-center justify-center gap-1.5 shadow-[0_4px_10px_rgba(5,150,70,0.25)] border-[2.5px] border-white dark:border-slate-800 active:scale-[0.98] transition-transform"
          >
            <Plus size={22} strokeWidth={3}/>
            Create Routine
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="mb-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400">New Routine</h2>
              <button onClick={() => { setShowCreate(false); setNewTitle(''); }} className="p-1">
                <X size={18}/>
              </button>
            </div>

            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="Write your routine..."
              className="w-full px-2.5 py-2 rounded-lg border border-emerald-200 dark:border-slate-700 bg-emerald-50 dark:bg-slate-800 outline-none text-sm"
            />

            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="w-full mt-1.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold disabled:opacity-40"
            >
              + Add Routine
            </button>
          </div>
        )}

        {/* Pending */}
        <section className="rounded-2xl p-1.5 bg-white/85 dark:bg-slate-900/85 border border-emerald-200 dark:border-slate-700 shadow-[0_3px_10px_rgba(16,120,60,0.10)] mb-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-green-100 to-emerald-50 dark:from-emerald-950/60 dark:to-slate-800 mb-1">
            <ClipboardList size={22} className="text-green-700 dark:text-green-400"/>
            <h2 className="text-[15px] font-extrabold flex-1">
              Pending Routines ({pending.length})
            </h2>
          </div>

          <div className="space-y-1 p-0.5">
            {loading ? (
              <div className="text-center py-3 text-slate-500 text-xs">Loading routines...</div>
            ) : pending.length === 0 ? (
              <div className="text-center py-3 text-slate-400">
                <ClipboardList size={24} className="mx-auto mb-0.5 opacity-50"/>
                <p className="font-semibold text-xs">No pending routines</p>
                <p className="text-[11px]">Create your first routine for today.</p>
              </div>
            ) : (
              pending.map(item => renderRoutine(item, false))
            )}
          </div>
        </section>

        {/* Completed - Always Visible */}
        <section className="rounded-2xl p-1.5 bg-white/85 dark:bg-slate-900/85 border border-emerald-200 dark:border-slate-700 shadow-[0_3px_10px_rgba(16,120,60,0.10)]">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-green-100 to-emerald-50 dark:from-emerald-950/60 dark:to-slate-800">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center">
              <Check size={20} strokeWidth={3.5}/>
            </div>

            <h2 className="text-[15px] font-extrabold flex-1">
              Completed ({completed.length})
            </h2>
          </div>

          <div className="space-y-1 p-0.5 mt-1">
            {completed.length === 0 ? (
              <div className="text-center py-3 text-slate-400 text-[11px]">
                Completed routines will appear here.
              </div>
            ) : (
              completed.map(item => renderRoutine(item, true))
            )}
          </div>
        </section>

        <p className="text-center text-[9px] text-emerald-700/60 dark:text-slate-500 mt-2">
          MyStudy • Plan your day • Improve every day
        </p>
      </main>

      {/* Delete Completed Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <Trash2 size={19} className="text-red-600"/>
              </div>

              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Delete Completed Routines?
              </h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              এই দিনের {completed.length}টি Completed Routine ডিলিট হবে। Pending Routines নিরাপদ থাকবে।
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingCompleted}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                onClick={() => void handleDeleteCompleted()}
                disabled={deletingCompleted}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {deletingCompleted ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
