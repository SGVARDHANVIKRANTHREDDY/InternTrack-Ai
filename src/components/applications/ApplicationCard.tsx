import React from 'react';
import { Building, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  'Wishlist': 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  'Applied': 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800',
  'OA Scheduled': 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800',
  'OA Completed': 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800',
  'Interview Scheduled': 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-800',
  'Interview Completed': 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-700',
  'Offer Received': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800',
  'Rejected': 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800',
  'Withdrawn': 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700',
};

const PRIORITY_BADGES: Record<string, string> = {
  'High': 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
  'Medium': 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
  'Low': 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
};

interface ApplicationCardProps {
  app: any;
  onSelect: (app: any) => void;
  isSelected?: boolean;
}

export function ApplicationCard({ app, onSelect, isSelected }: ApplicationCardProps) {
  const deadlineDays = app.deadlineDate ? differenceInDays(new Date(app.deadlineDate), new Date()) : null;

  return (
    <div
      onClick={() => onSelect(app)}
      className={`p-4 bg-white dark:bg-stone-900 border rounded-2xl shadow-xs transition-all cursor-pointer hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-md ${
        isSelected
          ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10'
          : 'border-stone-200/80 dark:border-stone-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 flex items-center justify-center font-bold text-sm text-stone-800 dark:text-stone-200 shrink-0">
            {app.company?.companyName?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">{app.role}</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate flex items-center gap-1 mt-0.5">
              <span>{app.company?.companyName}</span>
              {app.company?.location && <span className="text-stone-300 dark:text-stone-600">•</span>}
              <span className="truncate">{app.company?.location}</span>
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${STATUS_COLORS[app.status] || ''}`}>
          {app.status}
        </span>
      </div>

      <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_BADGES[app.priority] || PRIORITY_BADGES['Medium']}`}>
            {app.priority}
          </span>
          {app.source && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-semibold">
              {app.source.replace('_', ' ')}
            </span>
          )}
        </div>

        {app.deadlineDate ? (
          <div className="flex items-center gap-1 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className={deadlineDays !== null && deadlineDays < 3 && deadlineDays >= 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
              {format(new Date(app.deadlineDate), 'MMM d')}
              {deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7 && (
                <span className="ml-1 text-[10px] opacity-80">({deadlineDays}d)</span>
              )}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-stone-400">No deadline</span>
        )}
      </div>
    </div>
  );
}
