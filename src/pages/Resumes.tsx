import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { 
  FileText, 
  Plus, 
  Upload, 
  Copy, 
  Search, 
  GitCompare, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Award,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { ResumeWorkspace } from '../components/resumes/ResumeWorkspace';
import { ResumeUploadModal } from '../components/resumes/ResumeUploadModal';
import { ResumeDiffModal } from '../components/resumes/ResumeDiffModal';

export default function Resumes() {
  const queryClient = useQueryClient();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState('');
  const [newName, setNewName] = useState('');

  // Fetch all resumes
  const { data: resumes = [], isLoading: resumesLoading } = useQuery<any[]>({
    queryKey: ['resumes'],
    queryFn: () => apiRequest('/resumes'),
  });

  // Fetch summary stats
  const { data: stats } = useQuery<any>({
    queryKey: ['resume-stats'],
    queryFn: () => apiRequest('/resumes/stats'),
  });

  // Select first resume by default
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    } else if (resumes.length > 0 && selectedResumeId) {
      // If current selection was deleted, select first
      if (!resumes.some(r => r.id === selectedResumeId)) {
        setSelectedResumeId(resumes[0].id);
      }
    }
  }, [resumes, selectedResumeId]);

  const selectedResume = resumes.find(r => r.id === selectedResumeId) || resumes[0];

  // Fetch AI analyses history for currently selected resume
  const { data: analysesHistory = [] } = useQuery<any[]>({
    queryKey: ['resume-analyses', selectedResume?.id],
    queryFn: () => apiRequest(`/resumes/${selectedResume?.id}/analyses`),
    enabled: !!selectedResume?.id,
  });

  // Mutations
  const createResumeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/resumes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (newResume) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setSelectedResumeId(newResume.id);
      setIsUploadOpen(false);
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  const duplicateResumeMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/resumes/${id}/duplicate`, { method: 'POST' }),
    onSuccess: (forkedResume) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setSelectedResumeId(forkedResume.id);
    },
  });

  const renameResumeMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      apiRequest(`/resumes/${id}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ resumeName: name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setIsRenameOpen(false);
      setNewName('');
    },
  });

  const handleOpenRename = (id: string, currentName: string) => {
    setRenameTargetId(id);
    setNewName(currentName);
    setIsRenameOpen(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    renameResumeMutation.mutate({ id: renameTargetId, name: newName.trim() });
  };

  const filteredResumes = resumes.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.resumeName.toLowerCase().includes(q) ||
      (r.targetRole && r.targetRole.toLowerCase().includes(q))
    );
  });

  if (resumesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          <span className="text-xs text-stone-500 font-mono">Loading resume versions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            Resume Workspace & ATS Evaluator
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Tailor resume versions for specific target roles, inspect keyword matches, and track version progression.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {resumes.length > 1 && (
            <button
              onClick={() => setIsDiffOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-medium text-xs rounded-xl shadow-xs transition-colors"
            >
              <GitCompare className="w-4 h-4 text-stone-500" />
              <span>Compare Versions</span>
            </button>
          )}

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Version</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search resumes or roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Versions List */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-2 shadow-xs space-y-1 max-h-[640px] overflow-y-auto">
            {filteredResumes.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 px-4">
                No matching resume versions found.
              </div>
            ) : (
              filteredResumes.map((r) => {
                const isSelected = selectedResume?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResumeId(r.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80 shadow-xs'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {r.resumeName}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                        v{r.versionNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {r.targetRole}
                      </span>

                      {r.atsScore !== null && r.atsScore !== undefined ? (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          r.atsScore >= 80 
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                            : r.atsScore >= 60 
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200' 
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          ATS {r.atsScore}
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">Unscanned</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Workspace (8 Columns) */}
        <div className="lg:col-span-8">
          {selectedResume ? (
            <ResumeWorkspace
              resume={selectedResume}
              analysesHistory={analysesHistory}
              onOpenDiff={() => setIsDiffOpen(true)}
              onDuplicate={(id) => duplicateResumeMutation.mutate(id)}
              onRename={handleOpenRename}
              onDelete={(id) => deleteResumeMutation.mutate(id)}
              isDuplicating={duplicateResumeMutation.isPending}
            />
          ) : (
            <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
              <FileText className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-700 mb-3" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                No Resume Versions Tracked
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Upload your resume file or paste plain text to start customizing versions for each target company or role.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
              >
                Add Your First Resume
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload / Paste Modal */}
      <ResumeUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={(data) => createResumeMutation.mutate(data)}
        isSubmitting={createResumeMutation.isPending}
      />

      {/* Diff Modal */}
      {isDiffOpen && (
        <ResumeDiffModal
          isOpen={isDiffOpen}
          onClose={() => setIsDiffOpen(false)}
          resumes={resumes}
          defaultLeftId={selectedResume?.id}
        />
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={(open) => !open && setIsRenameOpen(false)}>
        <DialogContent className="max-w-md w-[95vw] bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-stone-900 dark:text-stone-100">
              Rename Resume Version
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRename} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Version Name
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRenameOpen(false)}
                className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renameResumeMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
