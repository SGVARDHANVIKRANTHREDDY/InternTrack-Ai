import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { X, Plus, Building, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_OPTIONS = [
  'Wishlist', 'Applied', 'OA Scheduled', 'OA Completed',
  'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected'
];

const SOURCE_OPTIONS = ['LINKEDIN', 'INTERNSHALA', 'WELLFOUND', 'COMPANY_CAREERS', 'REFERRAL', 'OTHER'];

interface ApplicationFormModalProps {
  open: boolean;
  onClose: () => void;
  companies: any[];
  resumes: any[];
}

export function ApplicationFormModal({ open, onClose, companies, resumes }: ApplicationFormModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    companyId: '',
    role: '',
    status: 'Wishlist',
    priority: 'Medium',
    deadlineDate: '',
    source: 'OTHER',
    resumeVersionId: '',
  });

  const [error, setError] = useState('');

  const createApp = useMutation({
    mutationFn: (newApp: any) =>
      apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({
          ...newApp,
          deadlineDate: newApp.deadlineDate ? new Date(newApp.deadlineDate).toISOString() : null,
          resumeVersionId: newApp.resumeVersionId || null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      onClose();
      setFormData({
        companyId: '',
        role: '',
        status: 'Wishlist',
        priority: 'Medium',
        deadlineDate: '',
        source: 'OTHER',
        resumeVersionId: '',
      });
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create application');
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId) {
      setError('Please select or specify a target company');
      return;
    }
    if (!formData.role.trim()) {
      setError('Please specify the position / role name');
      return;
    }
    setError('');
    createApp.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Add New Application</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Track an internship opportunity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl">
              {error}
            </div>
          )}

          {/* Company Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">Target Company *</label>
            <Select
              value={formData.companyId}
              onValueChange={(val) => setFormData({ ...formData, companyId: val })}
            >
              <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-10 rounded-xl">
                <SelectValue placeholder="Select target company" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 max-h-56">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName} {c.industry ? `(${c.industry})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role / Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">Job Title / Role *</label>
            <Input
              required
              placeholder="e.g. Software Engineering Intern, ML Intern"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 rounded-xl h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">Initial Status</label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">Priority</label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">Portal Source</label>
              <Select
                value={formData.source}
                onValueChange={(val) => setFormData({ ...formData, source: val })}
              >
                <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                  {SOURCE_OPTIONS.map((src) => (
                    <SelectItem key={src} value={src}>{src.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">Application Deadline</label>
              <input
                type="date"
                value={formData.deadlineDate}
                onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-800 dark:text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Resume Version */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">Link Resume Version</label>
            <Select
              value={formData.resumeVersionId || 'none'}
              onValueChange={(val) => setFormData({ ...formData, resumeVersionId: val === 'none' ? '' : val })}
            >
              <SelectTrigger className="bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 h-10 rounded-xl">
                <SelectValue placeholder="No Linked Resume" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                <SelectItem value="none">No Linked Resume</SelectItem>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.resumeName} (v{r.versionNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createApp.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 shadow-xs"
            >
              {createApp.isPending ? 'Saving...' : 'Track Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
