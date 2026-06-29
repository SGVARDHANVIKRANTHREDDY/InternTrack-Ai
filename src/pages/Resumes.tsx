import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { apiRequest } from '../lib/api';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Upload, 
  Copy, 
  Download, 
  Edit3, 
  Trash2, 
  Plus, 
  History, 
  Link2, 
  RefreshCw, 
  ArrowRight, 
  AlertCircle, 
  Folder, 
  List, 
  Grid, 
  Check, 
  ChevronRight, 
  X, 
  HelpCircle,
  TrendingUp,
  Brain,
  Diff,
  BookOpen,
  Eye,
  FileCheck,
  Award,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Machine Learning Engineer',
  'AI Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Cyber Security Engineer',
  'Cloud Engineer',
  'Product Engineer'
];

interface Resume {
  id: string;
  resumeName: string;
  versionNumber: number;
  targetRole: string;
  fileContent?: string;
  fileUrl?: string;
  mimeType: string;
  fileSize: number;
  notes?: string;
  atsScore?: number | null;
  aiSummary?: string | null;
  strengths?: string; // stringified JSON
  weaknesses?: string; // stringified JSON
  missingKeywords?: string; // stringified JSON
  recommendedSkills?: string; // stringified JSON
  formattingIssues?: string; // stringified JSON
  suggestions?: string; // stringified JSON
  status: string;
  createdAt: string;
  updatedAt: string;
  applications: any[];
}

export default function Resumes() {
  const queryClient = useQueryClient();
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'ai-analysis' | 'linked-apps' | 'history'>('overview');
  
  // Modals / Dropdowns
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Rename State
  const [renameTargetId, setRenameTargetId] = useState('');
  const [newName, setNewName] = useState('');

  // Compare State
  const [compareLeftId, setCompareLeftId] = useState('');
  const [compareRightId, setCompareRightId] = useState('');

  // Paste Editor State
  const [pastedName, setPastedName] = useState('');
  const [pastedRole, setPastedRole] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState('');
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Drag and Drop Upload State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadTargetRole, setUploadTargetRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [uploadResumeName, setUploadResumeName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Resumes
  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => apiRequest('/resumes')
  });

  // Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['resume-stats'],
    queryFn: () => apiRequest('/resumes/stats')
  });

  // Auto-set first resume as selected
  useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResume) {
      setSelectedResume(resumes[0]);
    } else if (resumes && selectedResume) {
      // Keep selected resume up to date
      const updated = resumes.find(r => r.id === selectedResume.id);
      if (updated) setSelectedResume(updated);
    }
  }, [resumes, selectedResume]);

  // Load drafted paste from localStorage on mount
  useEffect(() => {
    const savedText = localStorage.getItem('resume_paste_draft_text');
    const savedName = localStorage.getItem('resume_paste_draft_name');
    const savedRole = localStorage.getItem('resume_paste_draft_role');
    if (savedText) setPastedText(savedText);
    if (savedName) setPastedName(savedName);
    if (savedRole) setPastedRole(savedRole);
  }, []);

  // Autosave paste draft to localStorage
  useEffect(() => {
    let timer: any;
    if (pastedText || pastedName || pastedRole) {
      setIsDraftSaving(true);
      timer = setTimeout(() => {
        localStorage.setItem('resume_paste_draft_text', pastedText);
        localStorage.setItem('resume_paste_draft_name', pastedName);
        localStorage.setItem('resume_paste_draft_role', pastedRole);
        setIsDraftSaving(false);
      }, 800);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pastedText, pastedName, pastedRole]);

  // Mutations
  const createResumeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/resumes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setSelectedResume(data);
      setIsUploadOpen(false);
      setIsPasteOpen(false);
      // Clear storage
      localStorage.removeItem('resume_paste_draft_text');
      localStorage.removeItem('resume_paste_draft_name');
      localStorage.removeItem('resume_paste_draft_role');
      setPastedText('');
      setPastedName('');
      setPastedRole('');
      setUploadedFile(null);
    }
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setSelectedResume(null);
    }
  });

  const duplicateResumeMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/resumes/${id}/duplicate`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setSelectedResume(data);
    }
  });

  const renameResumeMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => apiRequest(`/resumes/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ resumeName: name })
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      setIsRenameOpen(false);
      if (selectedResume && selectedResume.id === data.id) {
        setSelectedResume(data);
      }
    }
  });

  const analyzeResumeMutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => apiRequest(`/resumes/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ targetRole: role })
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setSelectedResume(data);
    }
  });

  // Fetch AI analyses history for currently selected resume
  const { data: analysesHistory } = useQuery<any[]>({
    queryKey: ['resume-analyses', selectedResume?.id],
    queryFn: () => apiRequest(`/resumes/${selectedResume?.id}/analyses`),
    enabled: !!selectedResume?.id
  });

  // Parse safety helpers
  const parseJsonArray = (jsonStr?: string | null): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  // Drag and Drop helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt'];
    if (!extension || !allowed.includes(extension)) {
      alert('Only PDF, DOCX, and TXT file formats are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('The file size exceeds the 10MB maximum limit.');
      return;
    }
    setUploadedFile(file);
    setUploadResumeName(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleFileUploadSubmit = async () => {
    if (!uploadedFile) return;
    const roleToUse = uploadTargetRole === 'Other' ? customRole : uploadTargetRole;
    if (!roleToUse) {
      alert('Please specify a target role.');
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      createResumeMutation.mutate({
        resumeName: uploadResumeName || uploadedFile.name,
        targetRole: roleToUse,
        fileContent: text || 'Uploaded resume content',
        mimeType: uploadedFile.type,
        fileSize: uploadedFile.size,
        notes: `Original uploaded file: ${uploadedFile.name}`
      });
    };
    reader.readAsText(uploadedFile);
  };

  const handlePasteSubmit = () => {
    if (!pastedName || !pastedRole || !pastedText) {
      setPasteFeedback('All fields are required to create a resume version.');
      return;
    }
    createResumeMutation.mutate({
      resumeName: pastedName,
      targetRole: pastedRole,
      fileContent: pastedText,
      mimeType: 'text/plain',
      fileSize: pastedText.length,
      notes: 'Pasted custom editor resume version.'
    });
  };

  // Difference calculator for Side-by-Side compare
  const getCompareDiff = () => {
    const left = resumes?.find(r => r.id === compareLeftId);
    const right = resumes?.find(r => r.id === compareRightId);
    if (!left || !right) return [];

    const linesL = (left.fileContent || left.notes || '').split('\n');
    const linesR = (right.fileContent || right.notes || '').split('\n');
    const max = Math.max(linesL.length, linesR.length);
    
    const diff = [];
    for (let i = 0; i < max; i++) {
      const lL = linesL[i] || '';
      const lR = linesR[i] || '';
      if (lL === lR) {
        diff.push({ lL, lR, type: 'equal' });
      } else if (!lL && lR) {
        diff.push({ lL: '', lR, type: 'addition' });
      } else if (lL && !lR) {
        diff.push({ lL, lR: '', type: 'deletion' });
      } else {
        diff.push({ lL, lR, type: 'modified' });
      }
    }
    return diff;
  };

  // Helper stats calculating
  const totalVersCount = resumes?.length || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-stone-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            Resume Center
          </h1>
          <p className="text-sm text-stone-500">Upload, manage, version, and evaluate your resumes for various roles with Recruiter AI.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsPasteOpen(true)}
            variant="outline" 
            className="h-11 rounded-xl px-4 border-stone-200 text-stone-700 bg-white hover:bg-stone-50 transition-all font-bold text-xs"
          >
            <Copy className="w-4 h-4 mr-2 text-stone-500" />
            Paste Resume
          </Button>
          
          <Button 
            onClick={() => setIsUploadOpen(true)}
            className="h-11 rounded-xl px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-900/10 border-0"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Analytics Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-stone-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">Total Versions</span>
              <span className="text-xl font-black text-stone-900">{stats?.totalResumes || totalVersCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-stone-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">Best ATS Score</span>
              <span className="text-xl font-black text-stone-900">
                {stats?.bestAtsScore ? `${stats.bestAtsScore}/100` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-stone-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">Most Applied</span>
              <span className="text-xs font-bold text-stone-700 block truncate max-w-[150px]">
                {stats?.mostUsedResume || 'None'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-stone-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">Last Uploaded</span>
              <span className="text-xs font-mono font-bold text-stone-600 block">
                {stats?.latestUpload ? format(new Date(stats.latestUpload), 'MMM d, yyyy') : 'No records'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Resumes Library List (Takes 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-4 h-4 text-stone-400" />
              My Resumes Library
            </h3>
            
            {resumes && resumes.length > 1 && (
              <Button 
                onClick={() => {
                  setCompareLeftId(resumes[0].id);
                  setCompareRightId(resumes[1].id);
                  setIsCompareOpen(true);
                }}
                variant="ghost" 
                className="text-xs font-extrabold text-amber-700 hover:text-amber-800 p-0 h-auto"
              >
                <Diff className="w-3.5 h-3.5 mr-1" />
                Compare
              </Button>
            )}
          </div>

          <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
            {resumesLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-stone-200 p-4 rounded-xl animate-pulse space-y-2">
                    <div className="h-4 bg-stone-100 rounded w-2/3"></div>
                    <div className="h-3 bg-stone-50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {!resumesLoading && resumes?.length === 0 && (
              <div className="bg-white border border-stone-200 border-dashed rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="font-bold text-stone-700 text-sm">No Resumes Uploaded</p>
                <p className="text-xs text-stone-400 mt-1 max-w-[200px] mx-auto">Upload or paste your resume text to start matching target roles.</p>
              </div>
            )}

            {resumes?.map((resume) => {
              const active = selectedResume?.id === resume.id;
              const linkedCount = resume.applications?.length || 0;
              return (
                <div 
                  key={resume.id}
                  onClick={() => setSelectedResume(resume)}
                  className={`bg-white border text-left p-4 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-md' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="truncate">
                      <h4 className="font-extrabold text-stone-900 text-sm truncate flex items-center gap-1.5">
                        {resume.resumeName}
                        <Badge variant="outline" className="bg-stone-50 text-stone-600 font-mono text-[10px] py-0 px-1 rounded-sm shrink-0 border-stone-200">
                          v{resume.versionNumber}
                        </Badge>
                      </h4>
                      <p className="text-xs text-stone-400 truncate mt-0.5">{resume.targetRole}</p>
                    </div>

                    {resume.atsScore ? (
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${resume.atsScore >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {resume.atsScore}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-bold bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded-md">
                        Unanalyzed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-100 pt-2.5 mt-2.5 text-[11px] text-stone-400">
                    <span className="font-mono">{format(new Date(resume.createdAt), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1 font-bold text-stone-500">
                      <Link2 className="w-3.5 h-3.5 text-stone-400" />
                      {linkedCount} linked {linkedCount === 1 ? 'app' : 'apps'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Workspace (Takes 8 cols) */}
        <div className="lg:col-span-8">
          {selectedResume ? (
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[580px]">
              {/* Card Header with Operations */}
              <div className="bg-stone-50/50 border-b border-stone-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    {selectedResume.resumeName}
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 font-bold text-xs py-0.5 border-amber-200">
                      Version {selectedResume.versionNumber}
                    </Badge>
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">Target Role: <span className="font-bold text-stone-800">{selectedResume.targetRole}</span></p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    onClick={() => {
                      setNewName(selectedResume.resumeName);
                      setRenameTargetId(selectedResume.id);
                      setIsRenameOpen(true);
                    }}
                    variant="outline" 
                    className="h-8 text-xs rounded-lg border-stone-200 hover:bg-stone-100 text-stone-700 font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Rename
                  </Button>

                  <Button 
                    onClick={() => duplicateResumeMutation.mutate(selectedResume.id)}
                    variant="outline" 
                    className="h-8 text-xs rounded-lg border-stone-200 hover:bg-stone-100 text-stone-700 font-bold"
                    disabled={duplicateResumeMutation.isPending}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Duplicate
                  </Button>

                  <Button 
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this resume version?')) {
                        deleteResumeMutation.mutate(selectedResume.id);
                      }
                    }}
                    variant="outline" 
                    className="h-8 text-xs rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
                    disabled={deleteResumeMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>

                  {/* Standard text download */}
                  <Button 
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([selectedResume.fileContent || selectedResume.notes || ''], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = `${selectedResume.resumeName}.txt`;
                      document.body.appendChild(element);
                      element.click();
                    }}
                    variant="outline" 
                    className="h-8 text-xs rounded-lg border-stone-200 hover:bg-stone-100 text-stone-700 font-bold"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="border-b border-stone-100 bg-white flex px-6">
                <button 
                  onClick={() => setActiveSubTab('overview')}
                  className={`py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 px-3 transition-colors ${activeSubTab === 'overview' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Resume Content
                  </span>
                </button>

                <button 
                  onClick={() => setActiveSubTab('ai-analysis')}
                  className={`py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 px-3 transition-colors ${activeSubTab === 'ai-analysis' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    AI Recruiter Analysis
                  </span>
                </button>

                <button 
                  onClick={() => setActiveSubTab('linked-apps')}
                  className={`py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 px-3 transition-colors ${activeSubTab === 'linked-apps' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Linked Applications
                  </span>
                </button>

                <button 
                  onClick={() => setActiveSubTab('history')}
                  className={`py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 px-3 transition-colors ${activeSubTab === 'history' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Analyses History
                  </span>
                </button>
              </div>

              {/* Workspace Tab Body Content */}
              <div className="p-6 flex-1 bg-stone-50/20 overflow-y-auto max-h-[500px]">
                {activeSubTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200/50 pb-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">File Contents Overview</span>
                      <span className="text-xs text-stone-500 font-mono font-bold">Size: {Math.round(selectedResume.fileSize / 1024)} KB</span>
                    </div>

                    <div className="bg-white border border-stone-200 p-5 rounded-xl font-mono text-xs leading-relaxed text-stone-700 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar select-text shadow-inner">
                      {selectedResume.fileContent || selectedResume.notes || 'No file contents available.'}
                    </div>
                  </div>
                )}

                {activeSubTab === 'ai-analysis' && (
                  <div className="space-y-6">
                    {/* Score section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white rounded-xl border border-stone-200 shadow-sm gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl border-4 ${
                          selectedResume.atsScore && selectedResume.atsScore >= 80 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : selectedResume.atsScore && selectedResume.atsScore >= 60 
                            ? 'bg-amber-50 border-amber-500 text-amber-700' 
                            : 'bg-rose-50 border-rose-500 text-rose-700'
                        }`}>
                          {selectedResume.atsScore || 'N/A'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-base">ATS Match Evaluation</h4>
                          <p className="text-xs text-stone-500">How compatible is this resume version with the {selectedResume.targetRole} role description.</p>
                        </div>
                      </div>

                      <Button 
                        onClick={() => analyzeResumeMutation.mutate({ id: selectedResume.id, role: selectedResume.targetRole })}
                        className="h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                        disabled={analyzeResumeMutation.isPending}
                      >
                        {analyzeResumeMutation.isPending ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            Refresh AI Analysis
                          </>
                        )}
                      </Button>
                    </div>

                    {selectedResume.atsScore ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary & Strengths */}
                        <div className="space-y-6">
                          <Card className="bg-white border-stone-200 shadow-sm rounded-xl">
                            <CardHeader className="p-4 border-b border-stone-100">
                              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                AI Professional Summary
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <p className="text-stone-700 text-sm leading-relaxed">{selectedResume.aiSummary || 'No summary available.'}</p>
                            </CardContent>
                          </Card>

                          <Card className="bg-white border-stone-200 shadow-sm rounded-xl">
                            <CardHeader className="p-4 border-b border-stone-100">
                              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Key Strengths
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <ul className="space-y-2">
                                {parseJsonArray(selectedResume.strengths).map((str, idx) => (
                                  <li key={idx} className="text-xs text-stone-700 flex gap-2">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    {str}
                                  </li>
                                ))}
                                {parseJsonArray(selectedResume.strengths).length === 0 && (
                                  <span className="text-xs text-stone-400">No strengths logged.</span>
                                )}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Weaknesses & Missing Keywords */}
                        <div className="space-y-6">
                          <Card className="bg-white border-stone-200 shadow-sm rounded-xl">
                            <CardHeader className="p-4 border-b border-stone-100">
                              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                Missing Critical Keywords
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="flex flex-wrap gap-1.5">
                                {parseJsonArray(selectedResume.missingKeywords).map((kw, idx) => (
                                  <Badge key={idx} variant="secondary" className="bg-rose-50 border-rose-100 text-rose-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                                    {kw}
                                  </Badge>
                                ))}
                                {parseJsonArray(selectedResume.missingKeywords).length === 0 && (
                                  <span className="text-xs text-stone-400">No missing keywords identified! Good job!</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-white border-stone-200 shadow-sm rounded-xl">
                            <CardHeader className="p-4 border-b border-stone-100">
                              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                                Suggested Skills to Add
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="flex flex-wrap gap-1.5">
                                {parseJsonArray(selectedResume.recommendedSkills).map((sk, idx) => (
                                  <Badge key={idx} variant="secondary" className="bg-indigo-50 border-indigo-150 text-indigo-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                                    {sk}
                                  </Badge>
                                ))}
                                {parseJsonArray(selectedResume.recommendedSkills).length === 0 && (
                                  <span className="text-xs text-stone-400">Perfect skill alignment.</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Formatting & Suggestions (full width) */}
                        <div className="md:col-span-2 space-y-6">
                          <Card className="bg-white border-stone-200 shadow-sm rounded-xl">
                            <CardHeader className="p-4 border-b border-stone-100">
                              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-stone-400">
                                Formatting & Structural Feedback
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <ul className="space-y-1.5">
                                {parseJsonArray(selectedResume.formattingIssues).map((fi, idx) => (
                                  <li key={idx} className="text-xs text-amber-800 bg-amber-50/50 border border-amber-100 px-3 py-2 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    {fi}
                                  </li>
                                ))}
                                {parseJsonArray(selectedResume.formattingIssues).length === 0 && (
                                  <span className="text-xs text-stone-500 font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    No formatting structural errors found!
                                  </span>
                                )}
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="bg-white border-stone-200 shadow-sm rounded-xl">
                            <CardHeader className="p-4 border-b border-stone-100">
                              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-stone-400">
                                Recruiter Actionable Suggestions
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {parseJsonArray(selectedResume.suggestions).map((sug, idx) => (
                                  <div key={idx} className="text-xs text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-200/60 leading-relaxed">
                                    <span className="font-extrabold text-amber-700 mr-1.5">Recommendation {idx + 1}:</span>
                                    {sug}
                                  </div>
                                ))}
                                {parseJsonArray(selectedResume.suggestions).length === 0 && (
                                  <span className="text-xs text-stone-400">Excellent content setup.</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-stone-200 rounded-xl p-12 text-center shadow-sm">
                        <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60 animate-bounce" />
                        <h4 className="font-bold text-stone-800 text-sm">Resume Evaluation Pending</h4>
                        <p className="text-xs text-stone-400 max-w-md mx-auto mt-1 mb-4">Run the AI Recruiter Analysis to benchmark your resume, fetch an ATS score compatibility, identify gaps, and see optimization suggestions.</p>
                        <Button 
                          onClick={() => analyzeResumeMutation.mutate({ id: selectedResume.id, role: selectedResume.targetRole })}
                          className="h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                          disabled={analyzeResumeMutation.isPending}
                        >
                          Evaluate with AI Recruiter
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'linked-apps' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200/50 pb-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Linked Applications Tracking</span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                        {selectedResume.applications?.length || 0} applications
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedResume.applications?.map((app: any) => (
                        <div key={app.id} className="bg-white border border-stone-200 p-4 rounded-xl flex items-center justify-between shadow-xs hover:border-stone-300 transition-all">
                          <div>
                            <h5 className="font-extrabold text-stone-900 text-sm">{app.role}</h5>
                            <p className="text-xs text-stone-400 mt-0.5">Status: <span className="font-bold text-stone-600">{app.status}</span></p>
                          </div>
                          
                          <Badge variant="secondary" className="bg-stone-50 text-stone-600 border border-stone-200 text-[10px] font-mono">
                            Linked on {format(new Date(app.createdAt), 'MM/dd/yyyy')}
                          </Badge>
                        </div>
                      ))}

                      {(!selectedResume.applications || selectedResume.applications.length === 0) && (
                        <div className="text-center py-12 text-stone-400">
                          <Link2 className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                          <p className="text-xs font-medium text-stone-500">No linked applications found</p>
                          <p className="text-[11px] text-stone-400 mt-0.5">Select this resume version inside the applications pipeline page to link them.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSubTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200/50 pb-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Historical AI Evaluations History</span>
                      <span className="text-xs text-stone-400 font-mono font-bold">Resiliency store active</span>
                    </div>

                    <div className="space-y-3">
                      {analysesHistory?.map((hist: any, index: number) => (
                        <div key={hist.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
                            <div>
                              <span className="font-bold text-stone-900 text-xs">Run #{analysesHistory.length - index}</span>
                              <span className="text-xs text-stone-400 ml-2">For: {hist.targetRole}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                Score: {hist.atsScore}/100
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {format(new Date(hist.createdAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-stone-700 leading-relaxed">{hist.aiSummary}</p>
                        </div>
                      ))}

                      {(!analysesHistory || analysesHistory.length === 0) && (
                        <div className="text-center py-12 text-stone-400">
                          <History className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                          <p className="text-xs font-medium text-stone-500">No historical analyses stored</p>
                          <p className="text-[11px] text-stone-400 mt-0.5">Evaluation runs are logged permanently here once requested.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-16 text-center shadow-sm min-h-[580px] flex flex-col justify-center items-center">
              <FileText className="w-16 h-16 text-stone-200 mb-4 animate-pulse" />
              <h3 className="font-black text-stone-800 text-lg">No Resume Selected</h3>
              <p className="text-sm text-stone-400 max-w-md mx-auto mt-1 mb-6">Select an existing resume version from the library sidebar, or create a brand new version to configure pipeline triggers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drag & Drop Upload Dialog Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="bg-white border border-stone-200 rounded-2xl max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-stone-900">Upload Resume File</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!uploadedFile ? (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-amber-500 bg-amber-50/20' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.docx,.txt" 
                  className="hidden" 
                />
                <Upload className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-stone-700">Drag & drop your resume file here</p>
                <p className="text-xs text-stone-400 mt-1">or click to browse your computer (PDF, DOCX, TXT up to 10MB)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50/30 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900 truncate max-w-[240px]">{uploadedFile.name}</p>
                      <p className="text-xs text-stone-500 font-mono">{Math.round(uploadedFile.size / 1024)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setUploadedFile(null)} className="p-1 hover:bg-amber-100 rounded-full transition-colors">
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Rename Resume (Optional)</label>
                  <Input 
                    placeholder="Enter custom resume name" 
                    value={uploadResumeName} 
                    onChange={e => setUploadResumeName(e.target.value)} 
                    className="h-10 rounded-lg border-stone-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Target Role suggestions</label>
                  <Select value={uploadTargetRole} onValueChange={setUploadTargetRole}>
                    <SelectTrigger className="h-10 rounded-lg border-stone-200 bg-stone-50">
                      <SelectValue placeholder="Select target pipeline role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 text-stone-800">
                      {SUGGESTED_ROLES.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other (Custom Input)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {uploadTargetRole === 'Other' && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Specify custom role</label>
                    <Input 
                      placeholder="e.g. Graphic Designer Intern" 
                      value={customRole} 
                      onChange={e => setCustomRole(e.target.value)} 
                      className="h-10 rounded-lg border-stone-200"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleFileUploadSubmit}
                  className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                  disabled={createResumeMutation.isPending}
                >
                  {createResumeMutation.isPending ? 'Processing Upload...' : 'Complete Upload'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste Resume Professional Editor Dialog */}
      <Dialog open={isPasteOpen} onOpenChange={setIsPasteOpen}>
        <DialogContent className="bg-white border border-stone-200 rounded-2xl max-w-2xl p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-black text-stone-900">Paste & Editor Custom Resume</DialogTitle>
            <span className="text-[10px] font-mono text-stone-400">
              {isDraftSaving ? 'Draft saving...' : 'Draft saved locally'}
            </span>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Resume Version Title</label>
                <Input 
                  placeholder="e.g. SWE Summer 2026 Resume" 
                  value={pastedName} 
                  onChange={e => setPastedName(e.target.value)} 
                  className="h-10 rounded-lg border-stone-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Target Pipeline Role</label>
                <Input 
                  placeholder="e.g. Machine Learning Intern" 
                  value={pastedRole} 
                  onChange={e => setPastedRole(e.target.value)} 
                  className="h-10 rounded-lg border-stone-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Resume Plain Text Content</label>
                <span className="text-xs text-stone-400 font-mono">
                  {pastedText.length} characters / {pastedText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <Textarea 
                placeholder="Paste your full formatted resume content here..." 
                className="h-80 resize-none bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 font-mono text-xs p-4 rounded-xl leading-relaxed custom-scrollbar"
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
              />
            </div>

            {pasteFeedback && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {pasteFeedback}
              </p>
            )}

            <Button 
              onClick={handlePasteSubmit}
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md border-0"
              disabled={createResumeMutation.isPending}
            >
              {createResumeMutation.isPending ? 'Saving to Database...' : 'Save Resume Version'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog Modal */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="bg-white border border-stone-200 rounded-xl max-w-sm p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-wider text-stone-900">Rename Resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Enter new resume name" 
              className="h-10 border-stone-200"
            />
            <Button 
              onClick={() => renameResumeMutation.mutate({ id: renameTargetId, name: newName })}
              className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              disabled={renameResumeMutation.isPending}
            >
              Update Name
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Side-by-Side Version Comparison Modal */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="bg-white border border-stone-200 rounded-2xl max-w-5xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-stone-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Diff className="w-5 h-5 text-amber-600" />
              Side-by-Side Version Comparison
            </DialogTitle>
          </DialogHeader>

          {/* Select dropdown selectors */}
          <div className="grid grid-cols-2 gap-4 bg-stone-50/50 p-3 rounded-xl border border-stone-200/50 mb-4 shrink-0">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Baseline Version (Left)</label>
              <Select value={compareLeftId} onValueChange={setCompareLeftId}>
                <SelectTrigger className="bg-white border-stone-200 h-9 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-stone-200 text-stone-800 text-xs">
                  {resumes?.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.resumeName} (v{r.versionNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Comparison Version (Right)</label>
              <Select value={compareRightId} onValueChange={setCompareRightId}>
                <SelectTrigger className="bg-white border-stone-200 h-9 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-stone-200 text-stone-800 text-xs">
                  {resumes?.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.resumeName} (v{r.versionNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Side by side file renderer container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar border border-stone-200 rounded-xl bg-stone-50/20 p-4 max-h-[480px]">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-stone-200/60 pr-2">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block mb-2">Left Resume Text</span>
                <div className="space-y-1 font-mono text-[11px] leading-relaxed select-text">
                  {getCompareDiff().map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`min-h-[1.5rem] px-1.5 py-0.5 rounded ${
                        item.type === 'deletion' 
                          ? 'bg-rose-50 text-rose-700 font-bold border-l-2 border-rose-500' 
                          : item.type === 'modified' 
                          ? 'bg-amber-50/50 text-amber-800 font-bold' 
                          : 'text-stone-700'
                      }`}
                    >
                      {item.lL || <span className="opacity-0">empty</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pl-2">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block mb-2">Right Resume Text</span>
                <div className="space-y-1 font-mono text-[11px] leading-relaxed select-text">
                  {getCompareDiff().map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`min-h-[1.5rem] px-1.5 py-0.5 rounded ${
                        item.type === 'addition' 
                          ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500' 
                          : item.type === 'modified' 
                          ? 'bg-amber-50/50 text-amber-800 font-bold' 
                          : 'text-stone-700'
                      }`}
                    >
                      {item.lR || <span className="opacity-0">empty</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
