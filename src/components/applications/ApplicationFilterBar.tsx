import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Download, 
  Plus, 
  LayoutGrid, 
  Table as TableIcon,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationFilterState } from '../../hooks/useApplicationFilters';

const ALL_STATUSES = [
  'Wishlist', 'Applied', 'OA Scheduled', 'OA Completed',
  'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected', 'Withdrawn'
];

const ALL_PRIORITIES = ['High', 'Medium', 'Low'];
const ALL_SOURCES = ['LINKEDIN', 'INTERNSHALA', 'WELLFOUND', 'COMPANY_CAREERS', 'REFERRAL', 'OTHER'];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'deadline', label: 'Deadline' },
  { id: 'company', label: 'Company Name' },
  { id: 'priority', label: 'Priority' },
];

interface ApplicationFilterBarProps {
  filters: ApplicationFilterState;
  onUpdateFilters: (newParams: Partial<Record<keyof ApplicationFilterState, any>>) => void;
  onResetFilters: () => void;
  onNewApplication: () => void;
  totalCount: number;
  filteredApps: any[];
}

export function ApplicationFilterBar({
  filters,
  onUpdateFilters,
  onResetFilters,
  onNewApplication,
  totalCount,
  filteredApps,
}: ApplicationFilterBarProps) {
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // Safe CSV Export function with formula injection protection (Pillar 5)
  const exportToCSV = () => {
    if (!filteredApps || filteredApps.length === 0) return;

    const headers = [
      'ID',
      'Role',
      'Company',
      'Status',
      'Priority',
      'Source',
      'Deadline',
      'Application Date',
      'Follow-Up Sent',
      'Follow-Up Status',
      'Recruiter Replied',
      'Created At',
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);

      // Formula injection sanitization: prepend apostrophe if string begins with dangerous prefix
      if (/^[=+\-@\t\r\n]/.test(str)) {
        str = `'${str}`;
      }

      // Escape quotes
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredApps.map((app) => [
      escapeCSV(app.id),
      escapeCSV(app.role),
      escapeCSV(app.company?.companyName || ''),
      escapeCSV(app.status),
      escapeCSV(app.priority),
      escapeCSV(app.source || ''),
      escapeCSV(app.deadlineDate ? app.deadlineDate.split('T')[0] : ''),
      escapeCSV(app.applicationDate ? app.applicationDate.split('T')[0] : ''),
      escapeCSV(app.followUpSent ? 'Yes' : 'No'),
      escapeCSV(app.followUpStatus || 'WAITING'),
      escapeCSV(app.recruiterReplied ? 'Yes' : 'No'),
      escapeCSV(app.createdAt ? app.createdAt.split('T')[0] : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `interntrack_applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFiltersCount = 
    filters.statuses.length + 
    filters.priorities.length + 
    filters.sources.length + 
    (filters.startDate ? 1 : 0) + 
    (filters.endDate ? 1 : 0);

  const toggleArrayItem = (list: string[], item: string) => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            placeholder="Search by role or company..."
            className="w-full pl-9 pr-9 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          {filters.search && (
            <button
              onClick={() => onUpdateFilters({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Filter Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                activeFiltersCount > 0
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {isFilterPopoverOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-4 z-40 space-y-4 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100">Filter Applications</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={onResetFilters}
                      className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Status Multi-select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Status</label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {ALL_STATUSES.map((status) => {
                      const active = filters.statuses.includes(status);
                      return (
                        <button
                          key={status}
                          onClick={() => onUpdateFilters({ statuses: toggleArrayItem(filters.statuses, status) })}
                          className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                            active
                              ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300'
                              : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Multi-select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Priority</label>
                  <div className="flex gap-1.5">
                    {ALL_PRIORITIES.map((priority) => {
                      const active = filters.priorities.includes(priority);
                      return (
                        <button
                          key={priority}
                          onClick={() => onUpdateFilters({ priorities: toggleArrayItem(filters.priorities, priority) })}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex-1 ${
                            active
                              ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300'
                              : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                          }`}
                        >
                          {priority}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Source Multi-select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Portal Source</label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {ALL_SOURCES.map((src) => {
                      const active = filters.sources.includes(src);
                      return (
                        <button
                          key={src}
                          onClick={() => onUpdateFilters({ sources: toggleArrayItem(filters.sources, src) })}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition-colors ${
                            active
                              ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300'
                              : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                          }`}
                        >
                          {src.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                  <button
                    onClick={() => setIsFilterPopoverOpen(false)}
                    className="px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={filters.sort}
            onChange={(e) => onUpdateFilters({ sort: e.target.value })}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/80 dark:border-stone-700">
            <button
              onClick={() => onUpdateFilters({ view: 'table' })}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                filters.view === 'table'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
              title="Table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateFilters({ view: 'cards' })}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                filters.view === 'cards'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export to CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
            title="Export filtered records to safe CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* New Application Primary Button */}
          <Button
            onClick={onNewApplication}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs border-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </Button>
        </div>
      </div>

      {/* Active Filter Chips Row */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-stone-400 dark:text-stone-500 font-medium mr-1">Active:</span>

          {filters.statuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            >
              <span>{status}</span>
              <button
                onClick={() => onUpdateFilters({ statuses: filters.statuses.filter((s) => s !== status) })}
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.priorities.map((priority) => (
            <span
              key={priority}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700"
            >
              <span>{priority} Priority</span>
              <button
                onClick={() => onUpdateFilters({ priorities: filters.priorities.filter((p) => p !== priority) })}
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.sources.map((src) => (
            <span
              key={src}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700"
            >
              <span>{src.replace('_', ' ')}</span>
              <button
                onClick={() => onUpdateFilters({ sources: filters.sources.filter((s) => s !== src) })}
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <button
            onClick={onResetFilters}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
