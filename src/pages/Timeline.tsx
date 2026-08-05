import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { format } from 'date-fns';
import { 
  Briefcase, 
  Building, 
  FileText, 
  CheckCircle, 
  Clock, 
  History, 
  Plus, 
  Edit, 
  Trash,
  MailCheck,
  BrainCircuit,
  Search,
  Filter,
  Check,
  X,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  const { data: activity, isLoading } = useQuery<any[]>({
    queryKey: ['activity'],
    queryFn: () => apiRequest('/activity')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('application created')) return <Plus className="w-5 h-5 text-emerald-600" />;
    if (act.includes('status') || act.includes('changed')) return <CheckCircle className="w-5 h-5 text-amber-600" />;
    if (act.includes('resume') || act.includes('assigned')) return <FileText className="w-5 h-5 text-indigo-600" />;
    if (act.includes('follow-up') || act.includes('followup')) return <MailCheck className="w-5 h-5 text-blue-600" />;
    if (act.includes('prep') || act.includes('interview')) return <BrainCircuit className="w-5 h-5 text-purple-600" />;
    if (act.includes('company created')) return <Building className="w-5 h-5 text-stone-600" />;
    if (act.includes('deleted')) return <Trash className="w-5 h-5 text-rose-600" />;
    return <History className="w-5 h-5 text-stone-500" />;
  };

  const getActivityColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('application created')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (act.includes('status') || act.includes('changed')) return 'bg-amber-50 border-amber-200 text-amber-700';
    if (act.includes('resume') || act.includes('assigned')) return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    if (act.includes('follow-up') || act.includes('followup')) return 'bg-blue-50 border-blue-200 text-blue-700';
    if (act.includes('prep') || act.includes('interview')) return 'bg-purple-50 border-purple-200 text-purple-700';
    if (act.includes('company created')) return 'bg-stone-50 border-stone-200 text-stone-700';
    if (act.includes('deleted')) return 'bg-rose-50 border-rose-200 text-rose-700';
    return 'bg-stone-50 border-stone-200 text-stone-700';
  };

  const filteredActivity = activity ? activity.filter((log: any) => {
    // Type filter (multiple selections allowed)
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

    // Date range filter
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

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(term);
      const detailsMatch = log.details?.toLowerCase().includes(term);
      if (!actionMatch && !detailsMatch) return false;
    }

    return true;
  }) : [];

  // Sort Logic
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-stone-200 p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Activity Timeline</h2>
          <p className="text-sm text-stone-500">Track and filter your application milestones and platform operations.</p>
        </div>
        
        {/* Count badge */}
        <div className="bg-amber-100/50 border border-amber-200/50 px-4 py-2 rounded-xl shrink-0 self-start md:self-auto">
          <span className="text-xs text-stone-500 block uppercase font-semibold">Total Logs</span>
          <span className="text-xl font-extrabold text-amber-800">{sortedActivity?.length || 0}</span>
        </div>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="relative flex flex-col md:flex-row gap-3 items-center justify-between bg-white border border-stone-200 p-4 rounded-xl shadow-sm z-30">
        <div className="flex items-center gap-2 w-full md:w-auto bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg">
          <Search className="w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search activities..." 
            className="bg-transparent border-none outline-none text-sm w-full md:w-64 text-stone-800 placeholder-stone-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Filter Popover Trigger */}
          <div className="relative">
            <Button
              onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
              variant="outline"
              className={`h-10 rounded-lg px-4 flex items-center gap-2 border-stone-200 font-bold text-stone-700 bg-white hover:bg-stone-50 transition-all ${isFilterOpen ? 'ring-2 ring-amber-500/20 border-amber-500' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4 text-stone-500" />
              Filter
              {hasActiveFilters && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-extrabold text-white">
                  {selectedTypes.length + (startDate || endDate ? 1 : 0)}
                </span>
              )}
            </Button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-stone-200 shadow-xl rounded-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto animate-in fade-in duration-100">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                    <span className="font-extrabold text-stone-900 text-sm uppercase tracking-wider">Filters</span>
                    <button onClick={handleClearAllFilters} className="text-xs font-bold text-amber-700 hover:text-amber-800 underline">
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Activity Type Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Activity Type</label>
                      <div className="flex flex-col gap-1.5 p-1 bg-stone-50 rounded-lg border border-stone-150">
                        {ACTIVITY_TYPES.map(type => {
                          const active = selectedTypes.includes(type.id);
                          return (
                            <button
                              key={type.id}
                              onClick={() => {
                                if (active) {
                                  setSelectedTypes(selectedTypes.filter(t => t !== type.id));
                                } else {
                                  setSelectedTypes([...selectedTypes, type.id]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-md font-bold border transition-all flex items-center justify-between ${active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                            >
                              {type.label}
                              {active && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date Range Picker */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="h-8 text-xs px-2"
                        />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="h-8 text-xs px-2"
                        />
                      </div>
                    </div>

                    <Button onClick={() => setIsFilterOpen(false)} className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow mt-2">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort Popover Trigger */}
          <div className="relative">
            <Button
              onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
              variant="outline"
              className={`h-10 rounded-lg px-4 flex items-center gap-2 border-stone-200 font-bold text-stone-700 bg-white hover:bg-stone-50 transition-all ${isSortOpen ? 'ring-2 ring-amber-500/20 border-amber-500' : ''}`}
            >
              <ArrowUpDown className="w-4 h-4 text-stone-500" />
              <span>Sort: {SORT_OPTIONS.find(o => o.id === sortOption)?.label}</span>
            </Button>

            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 shadow-xl rounded-2xl p-2 z-50">
                  <span className="block font-extrabold text-[10px] uppercase tracking-wider text-stone-400 px-2.5 pb-2 border-b border-stone-100 mb-1">
                    Sort By
                  </span>
                  <div className="space-y-0.5">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortOption(opt.id); setIsSortOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${sortOption === opt.id ? 'bg-amber-50 text-amber-900 font-extrabold' : 'text-stone-600 hover:bg-stone-50'}`}
                      >
                        {opt.label}
                        {sortOption === opt.id && <Check className="w-3.5 h-3.5 text-amber-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Chips Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center bg-stone-50/50 border border-stone-200 p-3 rounded-xl">
          <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Active Filters:</span>
          {selectedTypes.map(typeId => {
            const label = ACTIVITY_TYPES.find(t => t.id === typeId)?.label || typeId;
            return (
              <Badge key={typeId} variant="secondary" className="flex items-center gap-1.5 bg-stone-150 hover:bg-stone-200/80 border-stone-200 text-stone-800 py-1 pl-2.5 pr-1 rounded-lg text-xs font-bold transition-all">
                {label}
                <button onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== typeId))} className="p-0.5 hover:bg-stone-300 rounded-full transition-colors">
                  <X className="w-3 h-3 text-stone-500" />
                </button>
              </Badge>
            );
          })}
          {(startDate || endDate) && (
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-stone-150 border-stone-200 text-stone-800 py-1 pl-2.5 pr-1 rounded-lg text-xs font-bold transition-all">
              {startDate ? format(new Date(startDate), 'MM/dd') : '*'} - {endDate ? format(new Date(endDate), 'MM/dd') : '*'}
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-0.5 hover:bg-stone-300 rounded-full transition-colors">
                <X className="w-3 h-3 text-stone-500" />
              </button>
            </Badge>
          )}
          <button 
            onClick={handleClearAllFilters}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 underline ml-2 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Timeline view */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm">
        {sortedActivity?.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No activity logs match your criteria</p>
            <p className="text-sm text-stone-400 mt-1">Try resetting filters or changing search keywords.</p>
          </div>
        ) : (
          <div className="relative border-l border-stone-200 ml-3 md:ml-6 space-y-8">
            {sortedActivity?.map((log: any) => (
              <div key={log.id} className="relative pl-8 md:pl-10 group">
                {/* Dot / Icon */}
                <span className={`absolute -left-3 md:-left-4 top-1 flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full border shadow-sm transition-transform group-hover:scale-110 z-10 ${getActivityColor(log.action)}`}>
                  {getActivityIcon(log.action)}
                </span>
                
                {/* Content */}
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md self-start">
                      {log.action}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(log.createdAt), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-stone-800 text-sm md:text-base font-medium leading-relaxed">
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
