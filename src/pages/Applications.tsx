import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  ExternalLink, 
  Send, 
  BrainCircuit, 
  Sparkles, 
  CheckCircle, 
  HelpCircle,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
  Check,
  X,
  FileUp,
  Briefcase,
  Building,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  'Wishlist': 'bg-stone-100 text-stone-700 border-stone-200',
  'Applied': 'bg-sky-50 text-sky-700 border-sky-100',
  'OA Scheduled': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'OA Completed': 'bg-purple-50 text-purple-700 border-purple-100',
  'Interview Scheduled': 'bg-amber-50 text-amber-700 border-amber-100',
  'Interview Completed': 'bg-amber-100 text-amber-900 border-amber-200',
  'Offer Received': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-100',
  'Withdrawn': 'bg-stone-100 text-stone-600 border-stone-200'
};

const SOURCES = ['LINKEDIN', 'INTERNSHALA', 'WELLFOUND', 'COMPANY_CAREERS', 'REFERRAL', 'OTHER'];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'deadline', label: 'Deadline' },
  { id: 'company', label: 'Company Name' },
  { id: 'priority', label: 'Priority' },
  { id: 'recently_updated', label: 'Recently Updated' }
];

export default function Applications() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'followup' | 'interview' | 'tailor'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Filter States
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort State
  const [sortOption, setSortOption] = useState('newest');

  // Popover States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Form State for Adding
  const [formData, setFormData] = useState({
    companyId: '',
    role: '',
    status: 'Wishlist',
    priority: 'Medium',
    deadlineDate: '',
    source: 'OTHER',
    resumeVersionId: ''
  });

  // Queries
  const { data: apps, isLoading: appsLoading } = useQuery<any[]>({ 
    queryKey: ['applications'], 
    queryFn: () => apiRequest('/applications') 
  });
  
  const { data: companies } = useQuery<any[]>({ 
    queryKey: ['companies'], 
    queryFn: () => apiRequest('/companies') 
  });
  
  const { data: resumes } = useQuery<any[]>({ 
    queryKey: ['resumes'], 
    queryFn: () => apiRequest('/resumes') 
  });

  // Selected App Details Queries
  const { data: prepHistory, refetch: refetchPrep, isLoading: prepLoading } = useQuery<any>({
    queryKey: ['prep-history', selectedApp?.id],
    queryFn: () => apiRequest(`/applications/${selectedApp.id}/interview-prep`),
    enabled: !!selectedApp?.id
  });

  const { data: tailorLatest, refetch: refetchTailor, isLoading: tailorLoading } = useQuery<any>({
    queryKey: ['tailor-latest', selectedApp?.id],
    queryFn: () => apiRequest(`/applications/${selectedApp.id}/tailor-resume`),
    enabled: !!selectedApp?.id
  });

  // Mutations
  const createApp = useMutation({
    mutationFn: (newApp: any) => apiRequest('/applications', { 
      method: 'POST', 
      body: JSON.stringify({
        ...newApp, 
        deadlineDate: newApp.deadlineDate ? new Date(newApp.deadlineDate).toISOString() : null
      }) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setIsOpen(false);
      setFormData({ companyId: '', role: '', status: 'Wishlist', priority: 'Medium', deadlineDate: '', source: 'OTHER', resumeVersionId: '' });
    }
  });

  const updateApp = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      if (selectedApp?.id === updated.id) {
        setSelectedApp(updated);
      }
    }
  });

  const deleteApp = useMutation({
    mutationFn: (id: string) => apiRequest(`/applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setSelectedApp(null);
    }
  });

  const generatePrep = useMutation({
    mutationFn: (appId: string) => apiRequest(`/applications/${appId}/interview-prep`, { method: 'POST' }),
    onSuccess: () => {
      refetchPrep();
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  const generateTailor = useMutation({
    mutationFn: (appId: string) => apiRequest(`/applications/${appId}/tailor-resume`, { method: 'POST' }),
    onSuccess: () => {
      refetchTailor();
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  if (appsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // ESC key listener to close panels
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

  // Filter & Search Logic
  const filteredApps = apps ? apps.filter((app: any) => {
    const searchLower = searchTerm.toLowerCase();
    const roleMatch = app.role.toLowerCase().includes(searchLower);
    const companyMatch = app.company?.companyName.toLowerCase().includes(searchLower);
    if (searchTerm && !roleMatch && !companyMatch) return false;

    if (selectedStatuses.length > 0 && !selectedStatuses.includes(app.status)) return false;
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(app.priority)) return false;
    if (selectedSources.length > 0 && !selectedSources.includes(app.source)) return false;
    if (selectedCompanies.length > 0 && !selectedCompanies.includes(app.companyId)) return false;
    if (selectedResumes.length > 0 && !selectedResumes.includes(app.resumeVersionId)) return false;

    if (startDate) {
      const appDate = new Date(app.createdAt);
      const start = new Date(startDate);
      if (appDate < start) return false;
    }
    if (endDate) {
      const appDate = new Date(app.createdAt);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (appDate > end) return false;
    }

    return true;
  }) : [];

  // Sort Logic
  const sortedApps = [...filteredApps].sort((a: any, b: any) => {
    if (sortOption === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOption === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortOption === 'deadline') {
      if (!a.deadlineDate) return 1;
      if (!b.deadlineDate) return -1;
      return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
    }
    if (sortOption === 'company') {
      return (a.company?.companyName || '').localeCompare(b.company?.companyName || '');
    }
    if (sortOption === 'priority') {
      const pVal = (p: string) => p === 'High' ? 3 : p === 'Medium' ? 2 : 1;
      return pVal(b.priority) - pVal(a.priority);
    }
    if (sortOption === 'recently_updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });

  const hasActiveFilters = selectedStatuses.length > 0 || 
    selectedPriorities.length > 0 || 
    selectedSources.length > 0 || 
    selectedCompanies.length > 0 || 
    selectedResumes.length > 0 || 
    startDate || 
    endDate;

  const handleClearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedSources([]);
    setSelectedCompanies([]);
    setSelectedResumes([]);
    setStartDate('');
    setEndDate('');
  };

  const handleUpdateField = (fieldName: string, value: any) => {
    if (!selectedApp) return;
    const updateData: any = {};
    updateData[fieldName] = value;
    
    // Auto-convert date strings
    if (fieldName.includes('Date') && value) {
      updateData[fieldName] = new Date(value).toISOString();
    }

    updateApp.mutate({ id: selectedApp.id, data: updateData });
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-stone-200 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Applications</h1>
          <p className="text-sm text-stone-500">Track and optimize your internship search, recruiter interactions, and AI mock prep files.</p>
        </div>

        {/* Add trigger */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-all h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow hover:shadow-md hover:scale-[1.01]">
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </DialogTrigger>
          <DialogContent className="bg-white border-stone-200 text-stone-900 max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-stone-900">Track New Internship</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createApp.mutate(formData); }} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Company</label>
                  <Select value={formData.companyId} onValueChange={v => setFormData({...formData, companyId: v})}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 h-10 rounded-lg"><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-stone-900">
                      {companies?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Internship Role</label>
                  <Input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Software Engineering Intern" className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 h-10 rounded-lg" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">Portal Source</label>
                  <Select value={formData.source} onValueChange={v => setFormData({...formData, source: v})}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-stone-900">
                      {SOURCES.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">Priority Rating</label>
                  <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-stone-900">
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">Application Deadline</label>
                  <Input type="date" value={formData.deadlineDate} onChange={e => setFormData({...formData, deadlineDate: e.target.value})} className="bg-stone-50 border-stone-200 text-stone-900 h-10 rounded-lg" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">Current Pipeline Status</label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-stone-900">
                      {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Assigned Resume Version</label>
                  <Select value={formData.resumeVersionId} onValueChange={v => setFormData({...formData, resumeVersionId: v})}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 h-10 rounded-lg"><SelectValue placeholder="Optional - Link a resume" /></SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-stone-900">
                      {resumes?.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.resumeName} (v{r.versionNumber})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 rounded-lg shadow mt-2" disabled={createApp.isPending}>Save Application</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="relative flex flex-col md:flex-row gap-3 items-center justify-between bg-white border border-stone-200 p-4 rounded-xl shadow-sm z-30">
        <div className="flex items-center gap-2 w-full md:w-auto bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg">
          <Search className="w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search by role or company..." 
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
                  {selectedStatuses.length + selectedPriorities.length + selectedSources.length + selectedCompanies.length + selectedResumes.length + (startDate || endDate ? 1 : 0)}
                </span>
              )}
            </Button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-stone-200 shadow-xl rounded-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                    <span className="font-extrabold text-stone-900 text-sm uppercase tracking-wider">Filters</span>
                    <button onClick={handleClearAllFilters} className="text-xs font-bold text-amber-700 hover:text-amber-800 underline">
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Status filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Status</label>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-stone-50 rounded-lg border border-stone-150">
                        {Object.keys(STATUS_COLORS).map(st => {
                          const active = selectedStatuses.includes(st);
                          return (
                            <button
                              key={st}
                              onClick={() => {
                                if (active) {
                                  setSelectedStatuses(selectedStatuses.filter(s => s !== st));
                                } else {
                                  setSelectedStatuses([...selectedStatuses, st]);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded-md font-bold border transition-all ${active ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Priority</label>
                      <div className="flex gap-1.5">
                        {['High', 'Medium', 'Low'].map(pr => {
                          const active = selectedPriorities.includes(pr);
                          return (
                            <button
                              key={pr}
                              onClick={() => {
                                if (active) {
                                  setSelectedPriorities(selectedPriorities.filter(p => p !== pr));
                                } else {
                                  setSelectedPriorities([...selectedPriorities, pr]);
                                }
                              }}
                              className={`flex-1 py-1 text-xs rounded-md font-bold border transition-all ${active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                            >
                              {pr}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Source filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Application Source</label>
                      <div className="flex flex-wrap gap-1.5">
                        {SOURCES.map(src => {
                          const active = selectedSources.includes(src);
                          return (
                            <button
                              key={src}
                              onClick={() => {
                                if (active) {
                                  setSelectedSources(selectedSources.filter(s => s !== src));
                                } else {
                                  setSelectedSources([...selectedSources, src]);
                                }
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md font-bold border transition-all ${active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                            >
                              {src}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Company Filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Company</label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-stone-50 rounded-lg border border-stone-150">
                        {companies?.map(c => {
                          const active = selectedCompanies.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                if (active) {
                                  setSelectedCompanies(selectedCompanies.filter(cid => cid !== c.id));
                                } else {
                                  setSelectedCompanies([...selectedCompanies, c.id]);
                                }
                              }}
                              className={`px-2 py-0.5 text-xs rounded-md font-bold border transition-all ${active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                            >
                              {c.companyName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resume Version Filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Resume Version</label>
                      <div className="flex flex-col gap-1 max-h-28 overflow-y-auto p-1.5 bg-stone-50 rounded-lg border border-stone-150">
                        {resumes?.map(r => {
                          const active = selectedResumes.includes(r.id);
                          return (
                            <button
                              key={r.id}
                              onClick={() => {
                                if (active) {
                                  setSelectedResumes(selectedResumes.filter(rid => rid !== r.id));
                                } else {
                                  setSelectedResumes([...selectedResumes, r.id]);
                                }
                              }}
                              className={`w-full text-left px-2 py-1 text-xs rounded-md font-bold border transition-all ${active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                            >
                              {r.resumeName} (v{r.versionNumber})
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
                <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 shadow-xl rounded-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center bg-stone-50/50 border border-stone-200 p-3 rounded-xl">
          <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Active Filters:</span>
          {selectedStatuses.map(status => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1.5 bg-stone-150 hover:bg-stone-200/80 border-stone-200 text-stone-800 py-1 pl-2.5 pr-1 rounded-lg text-xs font-bold transition-all">
              {status}
              <button onClick={() => setSelectedStatuses(selectedStatuses.filter(s => s !== status))} className="p-0.5 hover:bg-stone-300 rounded-full transition-colors">
                <X className="w-3 h-3 text-stone-500" />
              </button>
            </Badge>
          ))}
          {selectedPriorities.map(priority => (
            <Badge key={priority} variant="secondary" className="flex items-center gap-1.5 bg-rose-50 border-rose-150 text-rose-800 py-1 pl-2.5 pr-1 rounded-lg text-xs font-bold transition-all">
              {priority} Priority
              <button onClick={() => setSelectedPriorities(selectedPriorities.filter(p => p !== priority))} className="p-0.5 hover:bg-rose-100 rounded-full transition-colors">
                <X className="w-3 h-3 text-rose-500" />
              </button>
            </Badge>
          ))}
          {selectedSources.map(source => (
            <Badge key={source} variant="secondary" className="flex items-center gap-1.5 bg-stone-150 border-stone-200 text-stone-800 py-1 pl-2.5 pr-1 rounded-lg text-xs font-bold transition-all">
              {source}
              <button onClick={() => setSelectedSources(selectedSources.filter(s => s !== source))} className="p-0.5 hover:bg-stone-300 rounded-full transition-colors">
                <X className="w-3 h-3 text-stone-500" />
              </button>
            </Badge>
          ))}
          {selectedCompanies.map(companyId => {
            const companyName = companies?.find(c => c.id === companyId)?.companyName || 'Company';
            return (
              <Badge key={companyId} variant="secondary" className="flex items-center gap-1.5 bg-amber-50 border-amber-250 text-amber-900 py-1 pl-2.5 pr-1 rounded-lg text-xs font-bold transition-all">
                {companyName}
                <button onClick={() => setSelectedCompanies(selectedCompanies.filter(c => c !== companyId))} className="p-0.5 hover:bg-amber-100 rounded-full transition-colors">
                  <X className="w-3 h-3 text-amber-500" />
                </button>
              </Badge>
            );
          })}
          {selectedResumes.map(resumeId => {
            const resumeName = resumes?.find(r => r.id === resumeId)?.resumeName || 'Resume';
            return (
              <Badge key={resumeId} variant="secondary" className="flex items-center gap-1.5 bg-indigo-50 border-indigo-200 text-indigo-800 py-1 pl-2.5 pr-1 rounded-lg text-xs font-bold transition-all">
                {resumeName}
                <button onClick={() => setSelectedResumes(selectedResumes.filter(r => r !== resumeId))} className="p-0.5 hover:bg-indigo-100 rounded-full transition-colors">
                  <X className="w-3 h-3 text-indigo-500" />
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

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Apps List Table (takes remaining width) */}
        <div className={`${selectedApp ? 'lg:col-span-6' : 'lg:col-span-12'} bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300`}>
          <Table>
            <TableHeader>
              <TableRow className="border-stone-200 hover:bg-stone-50">
                <TableHead className="text-stone-500 font-bold">Company</TableHead>
                <TableHead className="text-stone-500 font-bold">Role</TableHead>
                <TableHead className="text-stone-500 font-bold">Status</TableHead>
                <TableHead className="text-stone-500 font-bold hidden md:table-cell">Priority</TableHead>
                <TableHead className="text-stone-500 font-bold hidden md:table-cell text-right">Applied Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedApps?.map((app: any) => (
                <TableRow 
                  key={app.id} 
                  onClick={() => { setSelectedApp(app); setActiveTab('details'); }}
                  className={`border-stone-200 cursor-pointer transition-colors ${
                    selectedApp?.id === app.id ? 'bg-amber-50/40 hover:bg-amber-50/50' : 'hover:bg-stone-50/50'
                  }`}
                >
                  <TableCell className="font-extrabold text-stone-900">{app.company?.companyName}</TableCell>
                  <TableCell className="text-stone-700 font-medium">{app.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${STATUS_COLORS[app.status] || ''} font-semibold py-0.5 rounded-md`}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-stone-700 hidden md:table-cell">
                    <span className={`inline-block px-1.5 py-0.5 text-[11px] font-bold rounded-md ${
                      app.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {app.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-stone-500 text-right font-mono text-xs hidden md:table-cell">{format(new Date(app.createdAt), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))}
              {sortedApps?.length === 0 && (
                <TableRow className="border-stone-200 hover:bg-stone-50">
                  <TableCell colSpan={5} className="text-center py-12 text-stone-400">
                    <Briefcase className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                    <p className="font-medium text-stone-500">No applications found</p>
                    <p className="text-xs text-stone-400 mt-1">Add a new record or adjust current search filters.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detailed Application Inspect Side Drawer */}
        {selectedApp && (
          <div className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl p-6 shadow-md space-y-6 relative animate-in fade-in slide-in-from-right-4 duration-200 sticky top-4">
            
            {/* Close button */}
            <button 
              onClick={() => setSelectedApp(null)} 
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div>
              <span className="text-[10px] bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md font-extrabold uppercase text-stone-500 tracking-wider">
                Application Inspect
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 mt-1.5 leading-tight">{selectedApp.role}</h2>
              <p className="text-stone-500 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                <Building className="w-4 h-4 text-stone-400" />
                {selectedApp.company?.companyName}
              </p>
            </div>

            {/* Tabs Row */}
            <div className="border-b border-stone-200 flex items-center gap-4 overflow-x-auto pb-0.5">
              <button 
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
                  activeTab === 'details' ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                Details
              </button>
              <button 
                onClick={() => setActiveTab('followup')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
                  activeTab === 'followup' ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                Follow-Ups
              </button>
              <button 
                onClick={() => setActiveTab('interview')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
                  activeTab === 'interview' ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                Interview Prep
              </button>
              <button 
                onClick={() => setActiveTab('tailor')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
                  activeTab === 'tailor' ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                AI Resume Match
              </button>
            </div>

            {/* Tab: Details */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Pipeline Status</label>
                    <Select value={selectedApp.status} onValueChange={v => handleUpdateField('status', v)}>
                      <SelectTrigger className="bg-stone-50 border-stone-200 h-9 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-stone-200 text-stone-900">
                        {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Priority Rating</label>
                    <Select value={selectedApp.priority} onValueChange={v => handleUpdateField('priority', v)}>
                      <SelectTrigger className="bg-stone-50 border-stone-200 h-9 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-stone-200 text-stone-900">
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Portal Source</label>
                    <Select value={selectedApp.source || 'OTHER'} onValueChange={v => handleUpdateField('source', v)}>
                      <SelectTrigger className="bg-stone-50 border-stone-200 h-9 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-stone-200 text-stone-900">
                        {SOURCES.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Deadline Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-800 focus:outline-none"
                      value={selectedApp.deadlineDate ? selectedApp.deadlineDate.split('T')[0] : ''}
                      onChange={e => handleUpdateField('deadlineDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Assigned Resume Version</label>
                    <Select value={selectedApp.resumeVersionId || 'none'} onValueChange={v => handleUpdateField('resumeVersionId', v === 'none' ? null : v)}>
                      <SelectTrigger className="bg-stone-50 border-stone-200 h-9 rounded-lg"><SelectValue placeholder="No Linked Resume" /></SelectTrigger>
                      <SelectContent className="bg-white border-stone-200 text-stone-900">
                        <SelectItem value="none">No Linked Resume</SelectItem>
                        {resumes?.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>{r.resumeName} (v{r.versionNumber})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Info Card block */}
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl flex gap-3.5 items-start">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-stone-800">Linked Company Profile</p>
                    <p className="text-stone-500 leading-normal">
                      This application is linked to <b>{selectedApp.company?.companyName}</b>. 
                      Industry: {selectedApp.company?.industry || 'Unknown'}. 
                      Location: {selectedApp.company?.location || 'Remote/TBD'}.
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => { if (confirm('Are you sure you want to delete this application?')) deleteApp.mutate(selectedApp.id); }}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 h-9 text-xs font-bold rounded-lg shadow-none"
                  disabled={deleteApp.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Application
                </Button>
              </div>
            )}

            {/* Tab: Follow-Ups */}
            {activeTab === 'followup' && (
              <div className="space-y-4">
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-amber-600" />
                    Follow-Up Tracker Controls
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="followUpSent"
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                        checked={selectedApp.followUpSent || false}
                        onChange={e => handleUpdateField('followUpSent', e.target.checked)}
                      />
                      <label htmlFor="followUpSent" className="text-xs font-bold text-stone-700">Follow-Up Sent</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="recruiterReplied"
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                        checked={selectedApp.recruiterReplied || false}
                        onChange={e => handleUpdateField('recruiterReplied', e.target.checked)}
                      />
                      <label htmlFor="recruiterReplied" className="text-xs font-bold text-stone-700">Recruiter Replied</label>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-bold uppercase text-stone-400">Follow-Up Sent Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-800 focus:outline-none"
                        value={selectedApp.followUpDate ? selectedApp.followUpDate.split('T')[0] : ''}
                        onChange={e => handleUpdateField('followUpDate', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-stone-400">Next Follow-Up Target</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-800 focus:outline-none"
                        value={selectedApp.nextFollowUpDate ? selectedApp.nextFollowUpDate.split('T')[0] : ''}
                        onChange={e => handleUpdateField('nextFollowUpDate', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-stone-400">Follow-Up Status</label>
                      <Select value={selectedApp.followUpStatus || 'WAITING'} onValueChange={v => handleUpdateField('followUpStatus', v)}>
                        <SelectTrigger className="bg-white border-stone-200 h-9 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border-stone-200 text-stone-900">
                          <SelectItem value="WAITING">WAITING</SelectItem>
                          <SelectItem value="FOLLOWED_UP">FOLLOWED UP</SelectItem>
                          <SelectItem value="REPLIED">REPLIED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-bold uppercase text-stone-400">Recruiter Interaction Notes</label>
                      <textarea 
                        className="w-full bg-white border border-stone-200 rounded-lg p-3 text-xs text-stone-800 focus:outline-none h-20 placeholder:text-stone-400"
                        placeholder="Add recruiter contact info, email contents, reply dates, or conversation notes..."
                        value={selectedApp.followUpNotes || ''}
                        onChange={e => handleUpdateField('followUpNotes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3.5 text-xs text-blue-700 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <span>
                    Auto-notifications will remind you when follow-ups are due or overdue. Update these statuses regularly to maintain correct dashboard tracking.
                  </span>
                </div>
              </div>
            )}

            {/* Tab: Interview Prep */}
            {activeTab === 'interview' && (() => {
              const latestPrep = prepHistory && prepHistory.length > 0 ? prepHistory[0] : null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BrainCircuit className="w-5 h-5 text-amber-600" />
                      AI Mock Interview Preparation File
                    </h3>
                    <button 
                      onClick={() => generatePrep.mutate(selectedApp.id)}
                      disabled={generatePrep.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {generatePrep.isPending ? 'Generating...' : latestPrep ? 'Regenerate Study file' : 'Generate Study File'}
                    </button>
                  </div>

                  {prepLoading ? (
                    <div className="py-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      Loading generated files...
                    </div>
                  ) : !latestPrep ? (
                    <div className="bg-stone-50 border border-stone-200 p-8 rounded-xl text-center space-y-3">
                      <BrainCircuit className="w-10 h-10 text-stone-300 mx-auto" />
                      <p className="text-xs font-bold text-stone-800">No mock preparation file generated yet</p>
                      <p className="text-xs text-stone-400 max-w-sm mx-auto leading-normal">
                        Click the generate button above. Gemini will construct structured DSA themes, HR templates, technical interview sheets, and full company research reports.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
                      {/* DSA Topics */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase text-stone-400">DSA Core Focus Areas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            try {
                              const parsed = typeof latestPrep.dsaTopics === 'string' ? JSON.parse(latestPrep.dsaTopics) : latestPrep.dsaTopics;
                              return Array.isArray(parsed) ? parsed.map((t: any, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] rounded">
                                  {t}
                                </span>
                              )) : <span className="text-xs text-stone-500">None recommended</span>;
                            } catch {
                              return <span className="text-xs text-stone-500">None recommended</span>;
                            }
                          })()}
                        </div>
                      </div>

                      {/* Technical Questions */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-stone-400">AI Curated Technical Questions</p>
                        <div className="space-y-2">
                          {(() => {
                            try {
                              const parsed = typeof latestPrep.technicalQuestions === 'string' ? JSON.parse(latestPrep.technicalQuestions) : latestPrep.technicalQuestions;
                              return Array.isArray(parsed) ? parsed.map((q: any, idx: number) => (
                                <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                                  <p className="font-extrabold text-stone-900">Q: {q.question || q}</p>
                                  <p className="text-stone-600 leading-relaxed"><b>Tips:</b> {q.tips || q.answer || 'Practice whiteboard explanation.'}</p>
                                </div>
                              )) : <span className="text-xs text-stone-500">None recommended</span>;
                            } catch {
                              return <span className="text-xs text-stone-500">None recommended</span>;
                            }
                          })()}
                        </div>
                      </div>

                      {/* HR Questions */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-stone-400">AI HR & Behavioral Prep</p>
                        <div className="space-y-2">
                          {(() => {
                            try {
                              const parsed = typeof latestPrep.hrQuestions === 'string' ? JSON.parse(latestPrep.hrQuestions) : latestPrep.hrQuestions;
                              return Array.isArray(parsed) ? parsed.map((q: any, idx: number) => (
                                <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                                  <p className="font-extrabold text-stone-900">Q: {q.question || q}</p>
                                  <p className="text-stone-600 leading-relaxed"><b>Framework Answer:</b> {q.tips || q.answer || 'Use STAR format (Situation, Task, Action, Result).'}</p>
                                </div>
                              )) : <span className="text-xs text-stone-500">None recommended</span>;
                            } catch {
                              return <span className="text-xs text-stone-500">None recommended</span>;
                            }
                          })()}
                        </div>
                      </div>

                      {/* Resume Specific */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-stone-400">Resume-Based Deep Dives</p>
                        <div className="space-y-2">
                          {(() => {
                            try {
                              const parsed = typeof latestPrep.resumeQuestions === 'string' ? JSON.parse(latestPrep.resumeQuestions) : latestPrep.resumeQuestions;
                              return Array.isArray(parsed) ? parsed.map((q: any, idx: number) => (
                                <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                                  <p className="font-extrabold text-stone-900">Q: {q.question || q}</p>
                                  <p className="text-stone-600 leading-relaxed"><b>Tips:</b> {q.tips || q.answer || 'Focus on your listed skills & tech stacks.'}</p>
                                </div>
                              )) : <p className="text-xs text-stone-500 italic">No resume linked or no specific questions found. Link your resume version in Details tab first.</p>;
                            } catch {
                              return <p className="text-xs text-stone-500 italic">No resume linked or no specific questions found. Link your resume version in Details tab first.</p>;
                            }
                          })()}
                        </div>
                      </div>

                      {/* Company Research */}
                      <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl text-xs space-y-2">
                        <p className="text-[10px] font-bold uppercase text-amber-800">Target Company Deep Dive Report</p>
                        {(() => {
                          try {
                            const parsed = typeof latestPrep.companyResearch === 'string' ? JSON.parse(latestPrep.companyResearch) : latestPrep.companyResearch;
                            return parsed ? (
                              <div className="space-y-1.5 leading-relaxed text-stone-700">
                                <p><b>Company Overview:</b> {parsed.overview || parsed}</p>
                                <p><b>Core Products:</b> {parsed.products || 'See main website.'}</p>
                                <p><b>Recent Milestones/News:</b> {parsed.recentNews || 'Expanding tech stacks.'}</p>
                                <p><b>Interview Strategy:</b> {parsed.interviewTips || 'Be collaborative.'}</p>
                              </div>
                            ) : <span className="text-stone-500 text-xs">No analysis available.</span>;
                          } catch {
                            return <div className="text-stone-700 leading-relaxed">{latestPrep.companyResearch}</div>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tab: AI Resume Match */}
            {activeTab === 'tailor' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    ATS Optimization Matching Report
                  </h3>
                  <button 
                    onClick={() => generateTailor.mutate(selectedApp.id)}
                    disabled={generateTailor.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generateTailor.isPending ? 'Analyzing Match...' : tailorLatest ? 'Regenerate ATS Report' : 'Run ATS Match'}
                  </button>
                </div>

                {tailorLoading ? (
                  <div className="py-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                    Loading ATS calculations...
                  </div>
                ) : !tailorLatest ? (
                  <div className="bg-stone-50 border border-stone-200 p-8 rounded-xl text-center space-y-3">
                    <Sparkles className="w-10 h-10 text-stone-300 mx-auto animate-pulse" />
                    <p className="text-xs font-bold text-stone-800">No ATS optimization match run yet</p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto leading-normal">
                      Click the analyze button above. Gemini will parse the job requirements, evaluate your linked resume, score your ATS readiness, identify missing keywords, and suggest structural updates.
                    </p>
                  </div>
                ) : (() => {
                  let suggestedChanges: any[] = [];
                  let projectsToHighlight: any[] = [];
                  let plainSuggestionsText = '';

                  try {
                    if (tailorLatest.suggestions) {
                      const parsedObj = JSON.parse(tailorLatest.suggestions);
                      if (parsedObj && typeof parsedObj === 'object') {
                        suggestedChanges = parsedObj.suggestedChanges || [];
                        projectsToHighlight = parsedObj.projectsToHighlight || [];
                      } else {
                        plainSuggestionsText = tailorLatest.suggestions;
                      }
                    }
                  } catch {
                    plainSuggestionsText = tailorLatest.suggestions;
                  }

                  return (
                    <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
                      {/* ATS SCORE */}
                      <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 p-4 rounded-xl">
                        <div className="w-14 h-14 rounded-full border-4 border-amber-600 flex items-center justify-center font-black text-amber-800 text-base shrink-0 bg-white shadow-xs">
                          {tailorLatest.atsScore}%
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="font-extrabold text-stone-900">ATS Competency Score</p>
                          <p className="text-stone-500">
                            {tailorLatest.atsScore >= 80 
                              ? 'Excellent match! High probability of passing screens.' 
                              : tailorLatest.atsScore >= 60 
                                ? 'Moderate match. Insert the recommended skills to pass screens.' 
                                : 'Low match. High risk of automatic reject.'}
                          </p>
                        </div>
                      </div>

                      {/* Missing Keywords */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase text-stone-400">Missing Keywords (Action: Add these)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            try {
                              const parsed = typeof tailorLatest.missingKeywords === 'string' ? JSON.parse(tailorLatest.missingKeywords) : tailorLatest.missingKeywords;
                              return Array.isArray(parsed) ? parsed.map((k: any, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold text-[10px] rounded">
                                  {k}
                                </span>
                              )) : <span className="text-xs text-stone-500">None flagged</span>;
                            } catch {
                              return <span className="text-xs text-stone-500">None flagged</span>;
                            }
                          })()}
                        </div>
                      </div>

                      {/* Recommended Skills */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase text-stone-400">Critical Required Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            try {
                              const parsed = typeof tailorLatest.recommendedSkills === 'string' ? JSON.parse(tailorLatest.recommendedSkills) : tailorLatest.recommendedSkills;
                              return Array.isArray(parsed) ? parsed.map((s: any, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[10px] rounded">
                                  {s}
                                </span>
                              )) : <span className="text-xs text-stone-500">None flagged</span>;
                            } catch {
                              return <span className="text-xs text-stone-500">None flagged</span>;
                            }
                          })()}
                        </div>
                      </div>

                      {/* Recommended Changes */}
                      {suggestedChanges.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase text-stone-400">Recommended Resume Bullet Changes</p>
                          <div className="space-y-2">
                            {suggestedChanges.map((c: any, idx: number) => (
                              <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs leading-relaxed text-stone-700 space-y-1">
                                <p><b>Section:</b> {c.section || 'General'}</p>
                                <p><b>Current Draft:</b> <span className="text-rose-600 line-through">{c.original || c}</span></p>
                                <p><b>Suggested Revision:</b> <span className="text-emerald-700 font-bold">{c.revised || c}</span></p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : plainSuggestionsText ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase text-stone-400">AI Tailoring Recommendations</p>
                          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs leading-relaxed text-stone-700 whitespace-pre-wrap">
                            {plainSuggestionsText}
                          </div>
                        </div>
                      ) : null}

                      {/* Projects to Highlight */}
                      {projectsToHighlight.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase text-stone-400">Recommended Projects & Portfolios to Showcase</p>
                          <div className="space-y-2">
                            {projectsToHighlight.map((p: any, idx: number) => (
                              <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                                <p className="font-extrabold text-stone-900">{p.projectName || p}</p>
                                <p className="text-stone-600 leading-relaxed"><b>Why highlight:</b> {p.reason || p.tips || 'Connects directly with role responsibilities.'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
