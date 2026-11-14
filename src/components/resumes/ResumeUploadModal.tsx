import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Copy, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    resumeName: string;
    targetRole: string;
    fileContent: string;
    mimeType: string;
    fileSize: number;
    notes?: string;
  }) => void;
  isSubmitting: boolean;
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
  'Cloud Engineer',
  'Product Manager'
];

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [resumeName, setResumeName] = useState('');
  const [targetRole, setTargetRole] = useState(SUGGESTED_ROLES[0]);
  const [customRole, setCustomRole] = useState('');
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste state
  const [pastedText, setPastedText] = useState('');

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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setFileError('');
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const valid = ['pdf', 'docx', 'txt'];
    if (!ext || !valid.includes(ext)) {
      setFileError('Invalid file format. Please upload PDF, DOCX, or TXT.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10MB limit.');
      return;
    }
    setFile(selectedFile);
    if (!resumeName) {
      setResumeName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = targetRole === 'Custom' ? customRole.trim() : targetRole;
    if (!finalRole) {
      setFileError('Please specify a target role.');
      return;
    }

    if (mode === 'upload') {
      if (!file) {
        setFileError('Please select a resume file to upload.');
        return;
      }

      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'pdf') {
        const reader = new FileReader();
        reader.onerror = () => setFileError('Failed to read the PDF file. Please try again.');
        reader.onload = async (evt) => {
          try {
            const arrayBuffer = evt.target?.result as ArrayBuffer;
            const pdfjsLib = (window as any).pdfjsLib;

            let extractedText = '';
            if (pdfjsLib) {
              pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

              const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
              const pdf = await loadingTask.promise;
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                extractedText += pageText + '\n';
              }
            }

            if (!extractedText.trim()) {
              extractedText = `PDF Document: ${file.name}\n(Binary PDF uploaded with size ${(file.size / 1024).toFixed(1)} KB)`;
            }

            onSubmit({
              resumeName: resumeName.trim() || file.name,
              targetRole: finalRole,
              fileContent: extractedText,
              mimeType: file.type || 'application/pdf',
              fileSize: file.size,
              notes: `Original uploaded file: ${file.name}`,
            });
          } catch (err: any) {
            setFileError(`Failed to parse PDF: ${err.message || 'Unknown error'}`);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (extension === 'docx') {
        const reader = new FileReader();
        reader.onerror = () => setFileError('Failed to read the Word document. Please try again.');
        reader.onload = async (evt) => {
          try {
            const arrayBuffer = evt.target?.result as ArrayBuffer;
            const mammoth = (window as any).mammoth;

            let extractedText = '';
            if (mammoth) {
              const result = await mammoth.extractRawText({ arrayBuffer });
              extractedText = result.value || '';
            }

            if (!extractedText.trim()) {
              extractedText = `Word Document: ${file.name}\n(Uploaded with size ${(file.size / 1024).toFixed(1)} KB)`;
            }

            onSubmit({
              resumeName: resumeName.trim() || file.name,
              targetRole: finalRole,
              fileContent: extractedText,
              mimeType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              fileSize: file.size,
              notes: `Original uploaded Word document: ${file.name}`,
            });
          } catch (err: any) {
            setFileError(`Failed to parse Word document: ${err.message || 'Unknown error'}`);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onerror = () => setFileError('Failed to read text file.');
        reader.onload = (evt) => {
          const content = (evt.target?.result as string) || '';
          onSubmit({
            resumeName: resumeName.trim() || file.name,
            targetRole: finalRole,
            fileContent: content || 'Empty text resume content',
            mimeType: file.type || 'text/plain',
            fileSize: file.size,
            notes: `Original uploaded file: ${file.name}`,
          });
        };
        reader.readAsText(file);
      }
    } else {
      if (!pastedText.trim()) {
        setFileError('Please paste resume text.');
        return;
      }
      onSubmit({
        resumeName: resumeName.trim() || 'Pasted Resume',
        targetRole: finalRole,
        fileContent: pastedText,
        mimeType: 'text/plain',
        fileSize: pastedText.length,
        notes: 'Pasted custom editor resume version.'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-[95vw] p-0 overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <DialogHeader className="p-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-stone-900 dark:text-stone-100">
                Add New Resume Version
              </DialogTitle>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Create a role-specific resume version to link to job applications and evaluate ATS match.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 flex gap-2 border-b border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              mode === 'upload'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              mode === 'paste'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            Paste Plain Text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {fileError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Metadata Row: Name & Target Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Version Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FullStack_Summer2026"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Target Role *
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100 font-medium"
              >
                {SUGGESTED_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="Custom">Custom Role...</option>
              </select>
            </div>
          </div>

          {targetRole === 'Custom' && (
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Custom Role Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Systems Engineer"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>
          )}

          {/* Body: Upload or Paste */}
          {mode === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
                  : file
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-stone-200 dark:border-stone-800 hover:border-amber-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{file.name}</p>
                  <p className="text-[10px] text-stone-400 font-mono">{(file.size / 1024).toFixed(1)} KB • Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-stone-500">
                  <Upload className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Drag and drop your resume file here
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Supports PDF, DOCX, or TXT up to 10MB
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Resume Content *
              </label>
              <textarea
                required
                rows={8}
                placeholder="Paste the full text of your resume here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full text-xs font-mono bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-3 text-stone-900 dark:text-stone-100 leading-relaxed resize-y"
              />
              <span className="text-[10px] text-stone-400 font-mono block text-right mt-1">
                {pastedText.length} characters
              </span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <Upload className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Creating Version...' : 'Save Resume Version'}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
