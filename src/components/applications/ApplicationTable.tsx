import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { 
  Building, 
  Calendar, 
  ExternalLink, 
  ArrowUpDown, 
  Check, 
  Clock,
  Briefcase
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface ApplicationTableProps {
  applications: any[];
  selectedAppId: string | null;
  onSelectApp: (app: any) => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
  sortOption: string;
  onSortChange: (sort: string) => void;
}

export function ApplicationTable({
  applications,
  selectedAppId,
  onSelectApp,
  onUpdateStatus,
  sortOption,
  onSortChange,
}: ApplicationTableProps) {
  return (
    <div className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/70 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              <th 
                className="py-3 px-4 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                onClick={() => onSortChange(sortOption === 'company' ? 'newest' : 'company')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Company</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Role & Team</th>
              <th className="py-3 px-4">Pipeline Status</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                onClick={() => onSortChange(sortOption === 'priority' ? 'newest' : 'priority')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Source</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                onClick={() => onSortChange(sortOption === 'deadline' ? 'newest' : 'deadline')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Deadline</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {applications.map((app) => {
              const isSelected = selectedAppId === app.id;
              const deadlineDays = app.deadlineDate ? differenceInDays(new Date(app.deadlineDate), new Date()) : null;

              return (
                <tr
                  key={app.id}
                  onClick={() => onSelectApp(app)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-50/60 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/70 dark:hover:bg-stone-800/40'
                  }`}
                >
                  {/* Company */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 flex items-center justify-center font-bold text-xs text-stone-700 dark:text-stone-300 shrink-0">
                        {app.company?.companyName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <span className="font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[140px] sm:max-w-[200px]">
                        {app.company?.companyName}
                      </span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    <span className="font-medium text-stone-800 dark:text-stone-200 truncate block max-w-[160px] sm:max-w-[220px]">
                      {app.role}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={app.status}
                      onValueChange={(newStatus) => onUpdateStatus(app.id, newStatus)}
                    >
                      <SelectTrigger className={`h-7 px-2.5 rounded-lg text-xs font-semibold border ${STATUS_COLORS[app.status] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                        {Object.keys(STATUS_COLORS).map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-md border ${PRIORITY_BADGES[app.priority] || PRIORITY_BADGES['Medium']}`}>
                      {app.priority}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      {app.source ? app.source.replace('_', ' ') : '—'}
                    </span>
                  </td>

                  {/* Deadline */}
                  <td className="py-3 px-4">
                    {app.deadlineDate ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className={deadlineDays !== null && deadlineDays < 3 && deadlineDays >= 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-stone-700 dark:text-stone-300'}>
                          {format(new Date(app.deadlineDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 dark:text-stone-500">—</span>
                    )}
                  </td>

                  {/* External Link / Action */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {app.applicationLink ? (
                      <a
                        href={app.applicationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex p-1.5 rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Open external job link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-stone-300 dark:text-stone-700 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
