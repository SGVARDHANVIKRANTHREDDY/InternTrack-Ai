import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { format } from 'date-fns';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lightbulb, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Brain,
  History,
  Tag
} from 'lucide-react';

interface ResumeAnalysisProps {
  resume: any;
  analysesHistory?: any[];
}

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Machine Learning Engineer',
  'AI Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Full Stack Engineer',
  'Product Manager'
];

export const ResumeAnalysis: React.FC<ResumeAnalysisProps> = ({ resume, analysesHistory = [] }) => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState(resume.targetRole || 'Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: (targetRole: string) => 
      apiRequest(`/resumes/${resume.id}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ targetRole })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume-analyses', resume.id] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  const parseJsonArray = (val?: string | null): string[] => {
    if (!val) return [];
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const strengths = parseJsonArray(resume.strengths);
  const weaknesses = parseJsonArray(resume.weaknesses);
  const missingKeywords = parseJsonArray(resume.missingKeywords);
  const suggestions = parseJsonArray(resume.suggestions);
  const formattingIssues = parseJsonArray(resume.formattingIssues);

  const atsScore = resume.atsScore !== null && resume.atsScore !== undefined ? resume.atsScore : null;

  const handleRunAnalysis = () => {
    const role = selectedRole === 'Custom' ? customRole : selectedRole;
    if (!role) return;
    analyzeMutation.mutate(role);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Action & Target Role Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200/60 dark:border-amber-950/60 bg-amber-50/40 dark:bg-amber-950/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Recruiter ATS Diagnostic
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Evaluated against role expectations, industry keywords, and ATS screening filters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
          >
            {SUGGESTED_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value="Custom">Custom Role...</option>
          </select>

          {selectedRole === 'Custom' && (
            <input
              type="text"
              placeholder="e.g. SRE"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-2.5 py-1.5 w-28 text-stone-800 dark:text-stone-200"
            />
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={analyzeMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {analyzeMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{atsScore !== null ? 'Re-Evaluate' : 'Evaluate ATS'}</span>
          </button>
        </div>
      </div>

      {/* Score Overview */}
      {atsScore !== null ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main Radial / Big Number ATS Card */}
          <div className="md:col-span-1 p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Overall ATS Score
            </span>
            <div className="relative flex items-center justify-center">
              <div className={`text-4xl font-black tabular-nums ${
                atsScore >= 80 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : atsScore >= 60 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-rose-600 dark:text-rose-400'
              }`}>
                {atsScore}
              </div>
              <span className="text-xs font-bold text-stone-400 ml-1">/100</span>
            </div>
            <span className={`text-[11px] font-semibold mt-2 px-2 py-0.5 rounded-full ${
              atsScore >= 80 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                : atsScore >= 60 
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}>
              {atsScore >= 80 ? 'ATS Optimized' : atsScore >= 60 ? 'Competitive' : 'Needs Work'}
            </span>
          </div>

          {/* AI Summary */}
          <div className="md:col-span-3 p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1.5">
                Executive Assessment
              </span>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {resume.aiSummary || 'No executive summary available. Re-run ATS diagnostic to analyze.'}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-800/80 mt-3">
              <span>Target Role: <strong className="text-stone-700 dark:text-stone-200">{resume.targetRole}</strong></span>
              {analysesHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{analysesHistory.length} previous scans</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-3">
          <Sparkles className="w-8 h-8 mx-auto text-amber-600 dark:text-amber-400 opacity-60" />
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            No ATS Diagnostic Yet
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Click &quot;Evaluate ATS&quot; to scan keyword density, identify missing technical skills, and check formatting compatibility.
          </p>
        </div>
      )}

      {/* Missing Keywords Chip Cloud */}
      {missingKeywords.length > 0 && (
        <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Missing High-Value Keywords ({missingKeywords.length})
            </h4>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Recruiters and automated screening tools filter specifically for these terms in {resume.targetRole} positions:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {missingKeywords.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60"
              >
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses 2-Column Grid */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Key Strengths ({strengths.length})
              </h4>
            </div>
            <ul className="space-y-2">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses / Gaps */}
          <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Identified Gaps ({weaknesses.length})
              </h4>
            </div>
            <ul className="space-y-2">
              {weaknesses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Concrete Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Targeted Improvements
            </h4>
          </div>
          <div className="space-y-2">
            {suggestions.map((sug, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40">
                <span className="font-mono font-bold text-amber-600 shrink-0">#{idx + 1}</span>
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Scans Modal / Accordion */}
      {showHistory && analysesHistory.length > 0 && (
        <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/70 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Historical Scan Log
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {analysesHistory.map((scan) => (
              <div key={scan.id} className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{scan.targetRole}</span>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {format(new Date(scan.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-600 font-mono text-sm">{scan.atsScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
