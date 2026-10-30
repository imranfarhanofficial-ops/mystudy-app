import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SubjectId } from '../types';

interface SubjectCardProps {
  id: SubjectId;
  name: string;
  onClick: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ id, name, onClick }) => {
  if (id === 'biology') {
    return (
      <button
        onClick={onClick}
        className="w-full text-left p-4 sm:p-5 rounded-3xl bg-[#edf8f1] dark:bg-emerald-950/40 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] group cursor-pointer"
        aria-label={`Open ${name}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#cdeed9] dark:bg-emerald-900/60 flex items-center justify-center shrink-0 shadow-xs">
            {/* Biology Leaf Icon matching image */}
            <svg
              className="w-9 h-9 text-[#1b5e20] dark:text-emerald-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.2 20.3a1 1 0 0 0 1.41 1.41l2.69-.77A8.94 8.94 0 0 0 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 15c-3.31 0-6-2.69-6-6 0-1.66.67-3.16 1.76-4.24l8.48 8.48A5.96 5.96 0 0 1 11 18z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#165324] dark:text-emerald-200">
            {name}
          </span>
        </div>
        <ChevronRight className="w-6 h-6 text-[#165324] dark:text-emerald-300 stroke-[2.5] transform group-hover:translate-x-1 transition-transform" />
      </button>
    );
  }

  if (id === 'chemistry') {
    return (
      <button
        onClick={onClick}
        className="w-full text-left p-4 sm:p-5 rounded-3xl bg-[#fdf0f0] dark:bg-rose-950/35 border border-rose-100/80 dark:border-rose-900/40 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] group cursor-pointer"
        aria-label={`Open ${name}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#fad3d3] dark:bg-rose-900/60 flex items-center justify-center shrink-0 shadow-xs">
            {/* Chemistry Beaker Flask Icon */}
            <svg
              className="w-9 h-9 text-[#881337] dark:text-rose-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 2v7.31L4.75 18.1a2 2 0 0 0 1.71 2.9h11.08a2 2 0 0 0 1.71-2.9L14 9.31V2" />
              <path d="M8.5 2h7" />
              <path d="M7 16h10" />
              <circle cx="10" cy="18" r="0.8" fill="currentColor" />
              <circle cx="14" cy="18.5" r="0.8" fill="currentColor" />
              <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#7f1d1d] dark:text-rose-200">
            {name}
          </span>
        </div>
        <ChevronRight className="w-6 h-6 text-[#7f1d1d] dark:text-rose-300 stroke-[2.5] transform group-hover:translate-x-1 transition-transform" />
      </button>
    );
  }

  // Physics
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 sm:p-5 rounded-3xl bg-[#ebf4fc] dark:bg-sky-950/35 border border-sky-100/80 dark:border-sky-900/40 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] group cursor-pointer"
      aria-label={`Open ${name}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#cee4f8] dark:bg-sky-900/60 flex items-center justify-center shrink-0 shadow-xs">
          {/* Physics Atom Icon */}
          <svg
            className="w-9 h-9 text-[#0369a1] dark:text-sky-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(0 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
          </svg>
        </div>
        <span className="text-2xl font-bold tracking-tight text-[#0f3a60] dark:text-sky-200">
          {name}
        </span>
      </div>
      <ChevronRight className="w-6 h-6 text-[#0f3a60] dark:text-sky-300 stroke-[2.5] transform group-hover:translate-x-1 transition-transform" />
    </button>
  );
};
