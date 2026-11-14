import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  GitCompare, 
  Edit3, 
  Briefcase, 
  Brain,
  History,
  Layers,
  ExternalLink
} from 'lucide-react';
import { ResumeAnalysis } from './ResumeAnalysis';

interface ResumeWorkspaceProps {
  resume: any;
  analysesHistory?: any[];
  onOpenDiff: () => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, currentName: string) => void;
  onDelete: (id: string) => void;
  isDuplicating?: boolean;
}

export const ResumeWorkspace: React.FC<ResumeWorkspaceProps> = ({
  resume,
  analysesHistory = [],
  onOpenDiff,
  onDuplicate,
  onRename,
  onDelete,
  isDuplicating = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'document' | 'analysis' | 'applications'>('document');
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    const text = resume.fileContent || resume.notes || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const text = resume.fileContent || resume.notes || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.resumeName}_v${resume.versionNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const contentText = resume.fileContent || resume.notes || 'No document content recorded for this version.';
  const linkedApps = resume.applications || [];

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[600px]">
      {/* Notion-style Document Header */}
      <div className="p-6 border-b border-stone-200 dark:border-stone-800 space-y-4 bg-stone-50/40 dark:bg-stone-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {resume.resumeName}
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              v{resume.versionNumber}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
              {resume.targetRole}
            </span>
            {resume.atsScore !== null && resume.atsScore !== undefined && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                resume.atsScore >= 80 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200' 
                  : resume.atsScore >= 60 
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200' 
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
              }`}>
                ATS: {resume.atsScore}/100
              </span>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onRename(resume.id, resume.resumeName)}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
              title="Rename version"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rename</span>
            </button>

            <button
              onClick={onOpenDiff}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
              title="Diff with another version"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            <button
              onClick={() => onDuplicate(resume.id)}
              disabled={isDuplicating}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
              title="Create branch / duplicate"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fork</span>
            </button>

            <button
              onClick={handleCopyText}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
              title="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadText}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
              title="Export as .txt"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${resume.resumeName}?`)) {
                  onDelete(resume.id);
                }
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs font-medium"
              title="Delete version"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-stone-400">
          <span>Created: {format(new Date(resume.createdAt), 'MMM d, yyyy')}</span>
          <span>•</span>
          <span>Size: {(resume.fileSize / 1024).toFixed(1)} KB</span>
          <span>•</span>
          <span>Linked to {linkedApps.length} active applications</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pt-1 -mb-4">
          <button
            onClick={() => setActiveTab('document')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'document'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'analysis'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>ATS Diagnostic & Match</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'applications'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Linked Applications ({linkedApps.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="p-6 flex-1 overflow-auto">
        {activeTab === 'document' && (
          <div className="max-w-4xl mx-auto bg-stone-50 dark:bg-stone-950/60 p-6 sm:p-8 rounded-xl border border-stone-200 dark:border-stone-800/80 font-mono text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap select-text shadow-inner">
            {contentText}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="max-w-4xl mx-auto">
            <ResumeAnalysis resume={resume} analysesHistory={analysesHistory} />
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Jobs where this resume version was submitted:
              </p>
            </div>

            {linkedApps.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                No job applications linked to this resume version yet. You can attach it inside Application Details.
              </div>
            ) : (
              <div className="space-y-2">
                {linkedApps.map((app: any) => (
                  <div
                    key={app.id}
                    onClick={() => navigate(`/applications?appId=${app.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {app.company?.companyName || 'Company'}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {app.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {app.status}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
