import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, GitCompare, ArrowRight, Layers } from 'lucide-react';

interface ResumeDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: any[];
  defaultLeftId?: string;
  defaultRightId?: string;
}

export const ResumeDiffModal: React.FC<ResumeDiffModalProps> = ({
  isOpen,
  onClose,
  resumes,
  defaultLeftId,
  defaultRightId,
}) => {
  const [leftId, setLeftId] = useState(defaultLeftId || resumes[0]?.id || '');
  const [rightId, setRightId] = useState(defaultRightId || (resumes[1]?.id || resumes[0]?.id || ''));
  const [mobileTab, setMobileTab] = useState<'left' | 'right'>('left');

  const leftResume = resumes.find((r) => r.id === leftId);
  const rightResume = resumes.find((r) => r.id === rightId);

  // Compute line-by-line diff
  const linesLeft = (leftResume?.fileContent || leftResume?.notes || '').split('\n');
  const linesRight = (rightResume?.fileContent || rightResume?.notes || '').split('\n');
  const maxLines = Math.max(linesLeft.length, linesRight.length);

  const diffRows = [];
  for (let i = 0; i < maxLines; i++) {
    const lL = linesLeft[i] ?? '';
    const lR = linesRight[i] ?? '';
    if (lL === lR) {
      diffRows.push({ lL, lR, type: 'equal', lineNum: i + 1 });
    } else if (!lL && lR) {
      diffRows.push({ lL: '', lR, type: 'addition', lineNum: i + 1 });
    } else if (lL && !lR) {
      diffRows.push({ lL, lR: '', type: 'deletion', lineNum: i + 1 });
    } else {
      diffRows.push({ lL, lR, type: 'modified', lineNum: i + 1 });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <DialogHeader className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-stone-900 dark:text-stone-100">
                Resume Version Diff Inspector
              </DialogTitle>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Compare line changes, technical additions, and content variations between iterations.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Version Pickers Bar */}
        <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-1/2 flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 shrink-0">Version A:</span>
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 font-medium text-stone-900 dark:text-stone-100"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.resumeName} (v{r.versionNumber}) — {r.targetRole}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-1/2 flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 shrink-0">Version B:</span>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 font-medium text-stone-900 dark:text-stone-100"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.resumeName} (v{r.versionNumber}) — {r.targetRole}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="sm:hidden flex border-b border-stone-200 dark:border-stone-800 p-2 gap-2 bg-stone-100 dark:bg-stone-800">
          <button
            onClick={() => setMobileTab('left')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center ${
              mobileTab === 'left'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500'
            }`}
          >
            Version A
          </button>
          <button
            onClick={() => setMobileTab('right')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center ${
              mobileTab === 'right'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500'
            }`}
          >
            Version B
          </button>
        </div>

        {/* Diff Canvas */}
        <div className="flex-1 overflow-auto font-mono text-xs p-2 sm:p-4 space-y-0.5 max-h-[60vh]">
          {diffRows.map((row, idx) => {
            const isAddition = row.type === 'addition';
            const isDeletion = row.type === 'deletion';
            const isModified = row.type === 'modified';

            return (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-2 gap-1 rounded py-0.5 px-1 hover:bg-stone-100 dark:hover:bg-stone-800/50"
              >
                {/* Left Side (Desktop or Mobile left tab) */}
                <div
                  className={`flex items-start gap-2 ${
                    mobileTab !== 'left' ? 'hidden sm:flex' : 'flex'
                  } ${
                    isDeletion
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                      : isModified
                      ? 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span className="text-[10px] text-stone-400 select-none w-7 text-right shrink-0">
                    {row.lineNum}
                  </span>
                  <span className="text-[10px] font-bold select-none shrink-0">
                    {isDeletion ? '-' : isModified ? '~' : ' '}
                  </span>
                  <span className="break-all whitespace-pre-wrap">{row.lL || ' '}</span>
                </div>

                {/* Right Side (Desktop or Mobile right tab) */}
                <div
                  className={`flex items-start gap-2 ${
                    mobileTab !== 'right' ? 'hidden sm:flex' : 'flex'
                  } ${
                    isAddition
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : isModified
                      ? 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span className="text-[10px] text-stone-400 select-none w-7 text-right shrink-0">
                    {row.lineNum}
                  </span>
                  <span className="text-[10px] font-bold select-none shrink-0">
                    {isAddition ? '+' : isModified ? '~' : ' '}
                  </span>
                  <span className="break-all whitespace-pre-wrap">{row.lR || ' '}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Addition
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Deletion
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Modified
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md text-stone-700 dark:text-stone-200 font-medium"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
