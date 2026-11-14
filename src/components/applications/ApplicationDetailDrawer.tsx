import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { format } from 'date-fns';
import { 
  X, 
  Building, 
  Trash2, 
  Send, 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  History, 
  Calendar,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApplicationTimeline } from './ApplicationTimeline';

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

const SOURCES = ['LINKEDIN', 'INTERNSHALA', 'WELLFOUND', 'COMPANY_CAREERS', 'REFERRAL', 'OTHER'];

interface ApplicationDetailDrawerProps {
  app: any;
  onClose: () => void;
  resumes?: any[];
}

export function ApplicationDetailDrawer({ app, onClose, resumes }: ApplicationDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'followup' | 'interview' | 'tailor'>('overview');

  // Queries for Interview Prep & Resume Tailoring
  const { data: prepHistory, refetch: refetchPrep, isLoading: prepLoading } = useQuery<any>({
    queryKey: ['prep-history', app?.id],
    queryFn: () => apiRequest(`/applications/${app.id}/interview-prep`),
    enabled: !!app?.id,
  });

  const { data: tailorLatest, refetch: refetchTailor, isLoading: tailorLoading } = useQuery<any>({
    queryKey: ['tailor-latest', app?.id],
    queryFn: () => apiRequest(`/applications/${app.id}/tailor-resume`),
    enabled: !!app?.id,
  });

  // Mutations
  const updateApp = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  const deleteApp = useMutation({
    mutationFn: (id: string) => apiRequest(`/applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      onClose();
    },
  });

  const generatePrep = useMutation({
    mutationFn: (appId: string) => apiRequest(`/applications/${appId}/interview-prep`, { method: 'POST' }),
    onSuccess: () => {
      refetchPrep();
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  const generateTailor = useMutation({
    mutationFn: (appId: string) => apiRequest(`/applications/${appId}/tailor-resume`, { method: 'POST' }),
    onSuccess: () => {
      refetchTailor();
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  const handleUpdateField = (field: string, value: any) => {
    let formatted = value;
    if (['deadlineDate', 'followUpDate', 'nextFollowUpDate'].includes(field)) {
      formatted = value ? new Date(value).toISOString() : null;
    }
    updateApp.mutate({ id: app.id, data: { [field]: formatted } });
  };

  if (!app) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded-md font-bold uppercase text-stone-500 dark:text-stone-400 tracking-wider">
                Application Inspector
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${STATUS_COLORS[app.status] || ''}`}>
                {app.status}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 truncate">{app.role}</h2>
            <p className="text-stone-600 dark:text-stone-400 font-medium text-sm flex items-center gap-1.5 mt-1">
              <Building className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{app.company?.companyName}</span>
              {app.company?.companyWebsite && (
                <a 
                  href={app.company.companyWebsite} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 ml-1 text-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
            aria-label="Close inspector drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-stone-200 dark:border-stone-800 px-5 sm:px-6 flex items-center gap-2 overflow-x-auto bg-white dark:bg-stone-900">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline & Audit' },
            { id: 'followup', label: 'Follow-Ups' },
            { id: 'interview', label: 'Interview Prep' },
            { id: 'tailor', label: 'AI Resume Match' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-semibold tracking-normal border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-600 dark:border-amber-500 text-amber-900 dark:text-amber-300'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Pipeline Status</label>
                  <Select value={app.status} onValueChange={(v) => handleUpdateField('status', v)}>
                    <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                      {Object.keys(STATUS_COLORS).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Priority Rating</label>
                  <Select value={app.priority} onValueChange={(v) => handleUpdateField('priority', v)}>
                    <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Portal Source</label>
                  <Select value={app.source || 'OTHER'} onValueChange={(v) => handleUpdateField('source', v)}>
                    <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                      {SOURCES.map((src) => (
                        <SelectItem key={src} value={src}>{src}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Deadline Target</label>
                  <input
                    type="date"
                    className="w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-sm text-stone-800 dark:text-stone-100 focus:outline-none"
                    value={app.deadlineDate ? app.deadlineDate.split('T')[0] : ''}
                    onChange={(e) => handleUpdateField('deadlineDate', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Assigned Resume Version</label>
                  <Select
                    value={app.resumeVersionId || 'none'}
                    onValueChange={(v) => handleUpdateField('resumeVersionId', v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-9 rounded-xl">
                      <SelectValue placeholder="No Linked Resume" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                      <SelectItem value="none">No Linked Resume</SelectItem>
                      {resumes?.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.resumeName} (v{r.versionNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Company Info Box */}
              <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 p-4 rounded-xl flex gap-3.5 items-start">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-stone-900 dark:text-stone-100">Linked Company Profile</p>
                  <p className="text-stone-500 dark:text-stone-400 leading-normal">
                    Industry: {app.company?.industry || 'Unknown'}. Location: {app.company?.location || 'Remote/TBD'}.
                  </p>
                </div>
              </div>

              {/* Delete Button */}
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this application?')) {
                    deleteApp.mutate(app.id);
                  }
                }}
                className="w-full bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 h-9 text-xs font-semibold rounded-xl shadow-none"
                disabled={deleteApp.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Application
              </Button>
            </div>
          )}

          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <ApplicationTimeline 
              applicationId={app.id} 
              applicationCreatedAt={app.createdAt} 
              applicationUpdatedAt={app.updatedAt} 
            />
          )}

          {/* TAB: FOLLOW-UPS */}
          {activeTab === 'followup' && (
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 p-4 rounded-xl space-y-3">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-amber-600" />
                  Follow-Up Tracker Controls
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="followUpSent"
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                      checked={app.followUpSent || false}
                      onChange={(e) => handleUpdateField('followUpSent', e.target.checked)}
                    />
                    <label htmlFor="followUpSent" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Follow-Up Sent
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recruiterReplied"
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                      checked={app.recruiterReplied || false}
                      onChange={(e) => handleUpdateField('recruiterReplied', e.target.checked)}
                    />
                    <label htmlFor="recruiterReplied" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Recruiter Replied
                    </label>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Follow-Up Sent Date</label>
                    <input
                      type="date"
                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-sm text-stone-800 dark:text-stone-100 focus:outline-none"
                      value={app.followUpDate ? app.followUpDate.split('T')[0] : ''}
                      onChange={(e) => handleUpdateField('followUpDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Next Follow-Up Target</label>
                    <input
                      type="date"
                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-sm text-stone-800 dark:text-stone-100 focus:outline-none"
                      value={app.nextFollowUpDate ? app.nextFollowUpDate.split('T')[0] : ''}
                      onChange={(e) => handleUpdateField('nextFollowUpDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Follow-Up Status</label>
                    <Select value={app.followUpStatus || 'WAITING'} onValueChange={(v) => handleUpdateField('followUpStatus', v)}>
                      <SelectTrigger className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 h-9 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                        <SelectItem value="WAITING">WAITING</SelectItem>
                        <SelectItem value="FOLLOWED_UP">FOLLOWED UP</SelectItem>
                        <SelectItem value="REPLIED">REPLIED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-stone-400">Recruiter Interaction Notes</label>
                    <textarea
                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-800 dark:text-stone-100 focus:outline-none h-20 placeholder:text-stone-400"
                      placeholder="Add recruiter contact info, email contents, reply dates, or conversation notes..."
                      value={app.followUpNotes || ''}
                      onChange={(e) => handleUpdateField('followUpNotes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-4 rounded-xl flex gap-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>
                  Follow-ups scheduled here appear directly in your Dashboard Action Triage stream for prompt execution.
                </span>
              </div>
            </div>
          )}

          {/* TAB: INTERVIEW PREP */}
          {activeTab === 'interview' && (() => {
            const latestPrep = prepHistory && prepHistory.length > 0 ? prepHistory[0] : null;
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                    AI Mock Interview Preparation File
                  </h3>
                  <button
                    onClick={() => generatePrep.mutate(app.id)}
                    disabled={generatePrep.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
                  >
                    {generatePrep.isPending ? 'Generating...' : latestPrep ? 'Regenerate Study File' : 'Generate Study File'}
                  </button>
                </div>

                {prepLoading ? (
                  <div className="py-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                    Loading generated files...
                  </div>
                ) : !latestPrep ? (
                  <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 p-8 rounded-xl text-center space-y-3">
                    <BrainCircuit className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-200">No mock preparation file generated yet</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto leading-normal">
                      Click the generate button above. Gemini will construct structured DSA themes, HR templates, technical interview sheets, and company research.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* DSA Topics */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase text-stone-400">DSA Core Focus Areas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          try {
                            const parsed = typeof latestPrep.dsaTopics === 'string' ? JSON.parse(latestPrep.dsaTopics) : latestPrep.dsaTopics;
                            return Array.isArray(parsed) ? parsed.map((t: any, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] rounded-md">
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
                              <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 rounded-xl text-xs space-y-1">
                                <p className="font-bold text-stone-900 dark:text-stone-100">Q: {q.question || q}</p>
                                <p className="text-stone-600 dark:text-stone-400 leading-relaxed"><b>Tips:</b> {q.tips || q.answer || 'Practice whiteboard explanation.'}</p>
                              </div>
                            )) : <span className="text-xs text-stone-500">None recommended</span>;
                          } catch {
                            return <span className="text-xs text-stone-500">None recommended</span>;
                          }
                        })()}
                      </div>
                    </div>

                    {/* Company Research */}
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 rounded-xl text-xs space-y-2">
                      <p className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">Target Company Deep Dive Report</p>
                      {(() => {
                        try {
                          const parsed = typeof latestPrep.companyResearch === 'string' ? JSON.parse(latestPrep.companyResearch) : latestPrep.companyResearch;
                          return parsed ? (
                            <div className="space-y-1.5 leading-relaxed text-stone-700 dark:text-stone-300">
                              <p><b>Company Overview:</b> {parsed.overview || parsed}</p>
                              <p><b>Core Products:</b> {parsed.products || 'See main website.'}</p>
                              <p><b>Interview Strategy:</b> {parsed.interviewTips || 'Be collaborative.'}</p>
                            </div>
                          ) : <span className="text-stone-500 text-xs">No analysis available.</span>;
                        } catch {
                          return <div className="text-stone-700 dark:text-stone-300 leading-relaxed">{latestPrep.companyResearch}</div>;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: AI RESUME MATCH */}
          {activeTab === 'tailor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  ATS Optimization Matching Report
                </h3>
                <button
                  onClick={() => generateTailor.mutate(app.id)}
                  disabled={generateTailor.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
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
                <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 p-8 rounded-xl text-center space-y-3">
                  <Sparkles className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200">No ATS optimization match run yet</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto leading-normal">
                    Click the analyze button above. Gemini will parse the job requirements, evaluate your linked resume, score your ATS readiness, and identify missing keywords.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* ATS Score Gauge */}
                  <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 p-4 rounded-xl">
                    <div className="w-14 h-14 rounded-full border-4 border-amber-600 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-base shrink-0 bg-white dark:bg-stone-900 shadow-xs">
                      {tailorLatest.atsScore}%
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-stone-900 dark:text-stone-100">ATS Competency Score</p>
                      <p className="text-stone-500 dark:text-stone-400">
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
                    <p className="text-[10px] font-bold uppercase text-stone-400">Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        try {
                          const parsed = typeof tailorLatest.missingKeywords === 'string' ? JSON.parse(tailorLatest.missingKeywords) : tailorLatest.missingKeywords;
                          return Array.isArray(parsed) ? parsed.map((k: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 font-semibold text-[10px] rounded-md">
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
                            <span key={idx} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] rounded-md">
                              {s}
                            </span>
                          )) : <span className="text-xs text-stone-500">None flagged</span>;
                        } catch {
                          return <span className="text-xs text-stone-500">None flagged</span>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
