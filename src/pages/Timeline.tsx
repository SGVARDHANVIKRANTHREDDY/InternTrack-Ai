import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { format } from 'date-fns';
import { 
  History, 
  Plus, 
  CheckCircle, 
  FileText, 
  MailCheck, 
  BrainCircuit, 
  Building, 
  Trash, 
  Clock, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Check, 
  X 
} from 'lucide-react';
import { EmptyState } from '../components/ui/empty-state';

const ACTIVITY_TYPES = [
  { id: 'APPLICATIONS', label: 'Applications' },
  { id: 'COMPANIES', label: 'Companies' },
  { id: 'RESUMES', label: 'Resumes' },
  { id: 'FOLLOW_UPS', label: 'Follow-Ups' },
  { id: 'INTERVIEWS', label: 'Interview Prep' }
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' }
];

export default function Timeline() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Popover States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Esc key listener to close panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterOpen(false);
        setIsSortOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: activity = [], isLoading } = useQuery<any[]>({
    queryKey: ['activity'],
    queryFn: () => apiRequest('/activity'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          <span className="text-xs text-stone-500 font-mono">Loading activity timeline...</span>
        </div>
      </div>
    );
  }

  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('application created')) return <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    if (act.includes('status') || act.includes('changed')) return <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (act.includes('resume') || act.includes('assigned')) return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    if (act.includes('follow-up') || act.includes('followup')) return <MailCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (act.includes('prep') || act.includes('interview')) return <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    if (act.includes('company created')) return <Building className="w-4 h-4 text-stone-600 dark:text-stone-300" />;
    if (act.includes('deleted')) return <Trash className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    return <History className="w-4 h-4 text-stone-500" />;
  };

  const getActivityColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('application created')) return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700';
    if (act.includes('status') || act.includes('changed')) return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700';
    if (act.includes('resume') || act.includes('assigned')) return 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700';
    if (act.includes('follow-up') || act.includes('followup')) return 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700';
    if (act.includes('prep') || act.includes('interview')) return 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700';
    if (act.includes('company created')) return 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-700 text-stone-700';
    if (act.includes('deleted')) return 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700';
    return 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700';
  };

  const filteredActivity = activity.filter((log: any) => {
    if (selectedTypes.length > 0) {
      const act = log.action.toLowerCase();
      let match = false;
      if (selectedTypes.includes('APPLICATIONS') && act.includes('application')) match = true;
      if (selectedTypes.includes('COMPANIES') && act.includes('company')) match = true;
      if (selectedTypes.includes('RESUMES') && act.includes('resume')) match = true;
      if (selectedTypes.includes('FOLLOW_UPS') && (act.includes('follow-up') || act.includes('followup'))) match = true;
      if (selectedTypes.includes('INTERVIEWS') && (act.includes('prep') || act.includes('interview'))) match = true;
      if (!match) return false;
    }

    if (startDate) {
      const logDate = new Date(log.createdAt);
      const start = new Date(startDate);
      if (logDate < start) return false;
    }
    if (endDate) {
      const logDate = new Date(log.createdAt);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(term);
      const detailsMatch = log.details?.toLowerCase().includes(term);
      if (!actionMatch && !detailsMatch) return false;
    }

    return true;
  });

  const sortedActivity = [...filteredActivity].sort((a: any, b: any) => {
    if (sortOption === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOption === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  const hasActiveFilters = selectedTypes.length > 0 || startDate || endDate;

  const handleClearAllFilters = () => {
    setSelectedTypes([]);
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <History className="w-6 h-6 text-amber-600" />
            Audit Activity Timeline
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Genuine historical log of application stage transitions, follow-up events, and system changes.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">Total Events:</span>
          <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
            {sortedActivity.length}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search activities or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Filter Popover */}
          <div className="relative">
            <button
              onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                isFilterOpen || hasActiveFilters
                  ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white font-mono text-[10px] flex items-center justify-center">
                  {selectedTypes.length + (startDate || endDate ? 1 : 0)}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Filter Events</span>
                    {hasActiveFilters && (
                      <button onClick={handleClearAllFilters} className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline">
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-500 block">Event Categories</span>
                    <div className="space-y-1">
                      {ACTIVITY_TYPES.map((type) => {
                        const active = selectedTypes.includes(type.id);
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setSelectedTypes(active ? selectedTypes.filter(t => t !== type.id) : [...selectedTypes, type.id]);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                              active
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold'
                                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }`}
                          >
                            <span>{type.label}</span>
                            {active && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-[11px] font-semibold text-stone-500 block">Date Range</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded p-1.5 text-stone-800 dark:text-stone-200"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded p-1.5 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <button
              onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span>{SORT_OPTIONS.find(o => o.id === sortOption)?.label}</span>
            </button>

            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-xl p-1.5 z-50 space-y-0.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortOption(opt.id); setIsSortOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                        sortOption === opt.id
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold text-stone-400">Filtered by:</span>
          {selectedTypes.map((typeId) => (
            <span
              key={typeId}
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center gap-1"
            >
              <span>{ACTIVITY_TYPES.find(t => t.id === typeId)?.label || typeId}</span>
              <button
                onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== typeId))}
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {(startDate || endDate) && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1">
              <span>{startDate || '*'} → {endDate || '*'}</span>
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline ml-1"
          >
            Reset
          </button>
        </div>
      )}

      {/* Timeline Stream */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        {sortedActivity.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity records match"
            description="Try adjusting your category filter, clearing the date range, or removing the search term."
          />
        ) : (
          <div className="relative border-l border-stone-200 dark:border-stone-800 ml-4 sm:ml-6 space-y-6">
            {sortedActivity.map((log: any) => (
              <div key={log.id} className="relative pl-7 sm:pl-8 group">
                {/* Event Dot */}
                <span className={`absolute -left-3.5 top-0.5 flex items-center justify-center w-7 h-7 rounded-full border shadow-xs transition-transform group-hover:scale-110 z-10 ${getActivityColor(log.action)}`}>
                  {getActivityIcon(log.action)}
                </span>

                {/* Card */}
                <div className="bg-stone-50/70 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800/80 p-3.5 sm:p-4 rounded-xl space-y-1.5 hover:border-amber-400/60 dark:hover:border-amber-700/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.createdAt), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
