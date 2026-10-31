
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  MoreVertical,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Lock,
  LockKeyhole,
  Bed,
  BookOpen,
  FlaskConical,
  Atom,
  Dumbbell,
  Droplets,
  Sunrise,
  Moon,
  Building2,
  Clock3,
  X,
  Save,
  ClipboardList,
} from 'lucide-react';

import {
  getDailyRoutines,
  createDailyRoutine,
  updateDailyRoutine,
  lockDailyRoutine,
  completeDailyRoutine,
  DailyRoutineItem,
} from '../services/db';

interface DailyRoutineProps {
  onBack: () => void;
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
  if (/night|sleep|রাত/.test(value)) return Moon;

  return ClipboardList;
}

export const DailyRoutine: React.FC<DailyRoutineProps> = ({ onBack }) => {
  const [now, setNow] = useState(new Date());
  const [routines, setRoutines] = useState<DailyRoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const dateKey = getLocalDateKey(now);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadRoutines = async () => {
      setLoading(true);

      try {
        const result = await getDailyRoutines(dateKey);

        if (active) {
          setRoutines(result);
        }
      } catch (error) {
        console.error('Failed to load daily routines:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRoutines();

    return () => {
      active = false;
    };
  }, [dateKey]);

  const pending = useMemo(
    () => routines.filter((item) => !item.completed),
    [routines]
  );

  const completed = useMemo(
    () => routines.filter((item) => item.completed),
    [routines]
  );

  const hour = now.getHours() % 12;
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const hourAngle = hour * 30 + minute * 0.5;
  const minuteAngle = minute * 6 + second * 0.1;
  const secondAngle = second * 6;

  const visibleDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });

  const handleCreate = async () => {
    const title = newTitle.trim();

    if (!title) return;

    try {
      const created = await createDailyRoutine(dateKey, title);

      setRoutines((previous) =>
        [...previous, created].sort((a, b) => a.createdAt - b.createdAt)
      );

      setNewTitle('');
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create routine:', error);
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

      setRoutines((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, title } : item
        )
      );

      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Failed to update routine:', error);
      alert('এই Routine পরিবর্তন করা যাচ্ছে না।');
    }
  };

  const handleLock = async (item: DailyRoutineItem) => {
    if (item.locked || item.completed) return;

    const confirmed = window.confirm(
      'এই Routine Lock করলে আর Edit করা যাবে না। Lock করতে চাও?'
    );

    if (!confirmed) return;

    try {
      await lockDailyRoutine(item.id);

      setRoutines((previous) =>
        previous.map((routine) =>
          routine.id === item.id
            ? { ...routine, locked: true }
            : routine
        )
      );
    } catch (error) {
      console.error('Failed to lock routine:', error);
      alert('Routine Lock করা যায়নি।');
    }
  };

  const handleComplete = async (item: DailyRoutineItem) => {
    if (item.completed) return;

    try {
      await completeDailyRoutine(item.id);

      setRoutines((previous) =>
        previous.map((routine) =>
          routine.id === item.id
            ? {
                ...routine,
                completed: true,
                completedAt: Date.now(),
              }
            : routine
        )
      );
    } catch (error) {
      console.error('Failed to complete routine:', error);
      alert('Routine Complete করা যায়নি।');
    }
  };

  const renderRoutine = (
    item: DailyRoutineItem,
    isCompleted: boolean
  ) => {
    const Icon = getRoutineIcon(item.title);
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        className="flex items-center gap-2.5 min-h-[58px] px-3 py-2 bg-white/95 dark:bg-slate-800/95 border border-emerald-100 dark:border-slate-700 rounded-[20px] shadow-sm"
      >
        <button
          type="button"
          disabled={isCompleted}
          onClick={() => handleComplete(item)}
          aria-label={isCompleted ? 'Completed' : 'Mark complete'}
          className={`w-9 h-9 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-500 dark:border-slate-400 text-transparent'
          }`}
        >
          {isCompleted && <Check size={23} strokeWidth={3} />}
        </button>

        <div className="w-px h-9 bg-slate-200 dark:bg-slate-700 shrink-0" />

        <div
          className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl ${
            isCompleted
              ? 'bg-green-50 dark:bg-green-950/40'
              : 'bg-emerald-50 dark:bg-emerald-950/40'
          }`}
        >
          <Icon
            size={27}
            className={
              isCompleted
                ? 'text-green-600'
                : 'text-emerald-600 dark:text-emerald-400'
            }
          />
        </div>

        <div className="w-px h-9 bg-slate-200 dark:bg-slate-700 shrink-0" />

        {isEditing ? (
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <input
              autoFocus
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleEdit(item.id);
                if (event.key === 'Escape') setEditingId(null);
              }}
              className="w-full min-w-0 bg-emerald-50 dark:bg-slate-900 rounded-lg px-2 py-2 text-sm outline-none border border-emerald-300 dark:border-emerald-700"
            />
            <button
              onClick={() => handleEdit(item.id)}
              className="p-2 text-green-600"
              aria-label="Save"
            >
              <Save size={20} />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="p-2 text-slate-500"
              aria-label="Cancel"
            >
              <X size={19} />
            </button>
          </div>
        ) : (
          <div
            className={`flex-1 min-w-0 text-[15px] font-semibold break-words ${
              isCompleted
                ? 'text-slate-500 dark:text-slate-400 line-through'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
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
              className={`p-2 shrink-0 ${
                item.locked
                  ? 'text-slate-300 dark:text-slate-600'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
              aria-label="Edit routine"
              title={item.locked ? 'Locked' : 'Edit'}
            >
              <Pencil size={21} />
            </button>

            <button
              onClick={() => handleLock(item)}
              className={`p-2 shrink-0 ${
                item.locked
                  ? 'text-green-600'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
              aria-label={item.locked ? 'Locked' : 'Lock routine'}
              title={item.locked ? 'Locked' : 'Lock'}
            >
              {item.locked ? (
                <LockKeyhole size={22} />
              ) : (
                <Lock size={22} />
              )}
            </button>
          </>
        )}

        {isCompleted && (
          <div className="p-2 shrink-0 text-slate-500 dark:text-slate-400">
            <LockKeyhole size={22} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#effcf3] dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col relative overflow-x-hidden">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-slate-800"
          aria-label="Go back"
        >
          <ArrowLeft size={27} />
        </button>

        <div className="flex items-center gap-2">
          <CalendarCheck
            size={31}
            className="text-emerald-600"
          />
          <h1 className="text-[25px] sm:text-3xl font-extrabold tracking-tight">
            Daily Routine
          </h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-slate-800"
            aria-label="More options"
          >
            <MoreVertical size={25} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 z-50 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-emerald-100 dark:border-slate-700 p-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowCompleted(!showCompleted);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-emerald-50 dark:hover:bg-slate-700"
              >
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Decorative leaves */}
      <div className="pointer-events-none absolute top-24 -left-12 w-36 h-36 rounded-full bg-green-300/20 blur-2xl" />
      <div className="pointer-events-none absolute top-72 -right-16 w-44 h-44 rounded-full bg-emerald-300/20 blur-3xl" />

      <main className="relative z-10 w-full max-w-2xl mx-auto px-3 sm:px-5 pt-5 pb-28">

        {/* Analog Clock */}
        <section className="flex justify-center mb-5">
          <div className="relative w-[min(76vw,320px)] aspect-square rounded-full p-[7px] bg-gradient-to-br from-green-400 via-emerald-700 to-green-900 shadow-[0_10px_25px_rgba(5,120,60,0.28)]">
            <div className="relative w-full h-full rounded-full bg-white border-[5px] border-green-700 shadow-[inset_0_0_12px_rgba(0,0,0,0.12)] overflow-hidden">

              {/* Clock marks and numbers */}
              {Array.from({ length: 60 }, (_, index) => {
                const major = index % 5 === 0;

                return (
                  <div
                    key={index}
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${index * 6}deg)`,
                    }}
                  >
                    <div
                      className={`absolute left-1/2 top-[5%] -translate-x-1/2 rounded-full ${
                        major
                          ? 'w-[3px] h-[12px] bg-slate-900'
                          : 'w-[1.5px] h-[5px] bg-slate-500'
                      }`}
                    />
                  </div>
                );
              })}

              {Array.from({ length: 12 }, (_, index) => {
                const number = index === 0 ? 12 : index;

                return (
                  <div
                    key={number}
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${index * 30}deg)`,
                    }}
                  >
                    <span
                      className="absolute left-1/2 top-[11%] -translate-x-1/2 text-[clamp(19px,6vw,29px)] font-extrabold text-slate-950"
                      style={{
                        transform: `rotate(-${index * 30}deg)`,
                      }}
                    >
                      {number}
                    </span>
                  </div>
                );
              })}

              {/* MyStudy Branding */}
              <div className="absolute left-1/2 top-[31%] -translate-x-1/2 flex flex-col items-center z-10">
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                >
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-11 5" />
                </svg>
                <span className="text-[17px] font-extrabold text-slate-950 tracking-tight">
                  MyStudy
                </span>
              </div>

              {/* Date Window */}
              <div className="absolute left-1/2 top-[69%] -translate-x-1/2 z-[15] px-4 py-1 rounded-full border-2 border-slate-900 bg-white shadow-sm whitespace-nowrap">
                <span className="text-[17px] font-extrabold text-slate-950">
                  {visibleDate}
                </span>
              </div>

              {/* Clock hands */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div
                  className="absolute left-1/2 top-1/2 w-[6px] h-[27%] bg-slate-950 rounded-full origin-bottom"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
                  }}
                />

                <div
                  className="absolute left-1/2 top-1/2 w-[4px] h-[37%] bg-slate-950 rounded-full origin-bottom"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
                  }}
                />

                <div
                  className="absolute left-1/2 top-1/2 w-[2px] h-[40%] bg-red-500 rounded-full origin-bottom"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
                  }}
                />

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-600 border-[4px] border-slate-950 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Live time */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Clock3 size={14} />
            LIVE LOCAL TIME
          </div>
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}
          </div>
        </div>

        {/* Create Routine Button */}
        <div className="flex justify-center mb-7">
          <button
            onClick={() => setShowCreate(true)}
            className="w-[88%] min-h-[70px] rounded-full bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 text-white text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-3 shadow-[0_7px_18px_rgba(5,150,70,0.3)] border-[5px] border-white dark:border-slate-800 active:scale-[0.98] transition-transform"
          >
            <Plus size={34} strokeWidth={3} />
            Create Routine
          </button>
        </div>

        {/* Create Routine Form */}
        {showCreate && (
          <div className="mb-6 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-lg text-emerald-800 dark:text-emerald-400">
                New Routine
              </h2>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewTitle('');
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={21} />
              </button>
            </div>

            <input
              autoFocus
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreate();
              }}
              placeholder="Write your routine..."
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 dark:border-slate-700 bg-emerald-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            />

            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="w-full mt-3 py-3 rounded-xl bg-emerald-700 text-white font-bold disabled:opacity-40"
            >
              + Add Routine
            </button>
          </div>
        )}

        {/* Pending Routines */}
        <section className="rounded-[30px] p-2 bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-700 shadow-[0_5px_18px_rgba(16,120,60,0.12)] mb-6">

          <div className="flex items-center gap-3 px-3 py-3 rounded-[22px] bg-gradient-to-r from-green-100 to-emerald-50 dark:from-emerald-950/60 dark:to-slate-800 mb-2">
            <ClipboardList
              size={34}
              className="text-green-700 dark:text-green-400"
            />
            <h2 className="text-xl sm:text-2xl font-extrabold flex-1">
              Pending Routines ({pending.length})
            </h2>
          </div>

          <div className="space-y-2 p-1">
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                Loading routines...
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ClipboardList size={36} className="mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No pending routines</p>
                <p className="text-sm">Create your first routine for today.</p>
              </div>
            ) : (
              pending.map((item) => renderRoutine(item, false))
            )}
          </div>
        </section>

        {/* Completed */}
        <section className="rounded-[30px] p-2 bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-700 shadow-[0_5px_18px_rgba(16,120,60,0.12)]">

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-[22px] bg-gradient-to-r from-green-100 to-emerald-50 dark:from-emerald-950/60 dark:to-slate-800"
          >
            <div className="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center shadow-sm">
              <Check size={30} strokeWidth={3.5} />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold flex-1 text-left">
              Completed ({completed.length})
            </h2>

            {showCompleted ? (
              <ChevronDown size={28} />
            ) : (
              <ChevronUp size={28} />
            )}
          </button>

          {showCompleted && (
            <div className="space-y-2 p-1 mt-2">
              {completed.length === 0 ? (
                <div className="text-center py-7 text-slate-400 text-sm">
                  Completed routines will appear here.
                </div>
              ) : (
                completed.map((item) => renderRoutine(item, true))
              )}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-emerald-700/60 dark:text-slate-500 mt-5">
          MyStudy • Plan your day • Improve every day
        </p>
      </main>
    </div>
  );
};

