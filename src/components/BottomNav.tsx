
import React from 'react';
import { Home, CalendarDays } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'daily-routine';
  onSelectTab: (tab: 'home' | 'daily-routine') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 px-6 py-2 pb-safe"
      style={{
        paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
      }}
      aria-label="Bottom Navigation"
    >
      <div className="flex items-center justify-around gap-4">

        {/* Home Tab */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex-1 py-1.5 px-4 rounded-full flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
            currentTab === 'home'
              ? 'bg-[#e8f5e9] dark:bg-emerald-950/60 text-[#166534] dark:text-emerald-300 font-bold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Home
            className={`w-5 h-5 mb-0.5 ${
              currentTab === 'home'
                ? 'text-[#166534] dark:text-emerald-300 fill-[#166534]/20'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          />
          <span className="text-xs">Home</span>
        </button>

        {/* Daily Routine Tab */}
        <button
          onClick={() => onSelectTab('daily-routine')}
          className={`flex-1 py-1.5 px-4 rounded-full flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
            currentTab === 'daily-routine'
              ? 'bg-[#e8f5e9] dark:bg-emerald-950/60 text-[#166534] dark:text-emerald-300 font-bold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CalendarDays
            className={`w-5 h-5 mb-0.5 ${
              currentTab === 'daily-routine'
                ? 'text-[#166534] dark:text-emerald-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          />
          <span className="text-xs">Daily Routine</span>
        </button>

      </div>
    </nav>
  );
};
