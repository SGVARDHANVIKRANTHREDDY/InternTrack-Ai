import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { 
  User, 
  Sun, 
  Moon, 
  Laptop, 
  Download, 
  Command, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Shield,
  HelpCircle,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';

export default function Settings() {
  const { user, setUser, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [graduationYear, setGraduationYear] = useState<number | ''>(user?.graduationYear || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [github, setGithub] = useState(user?.github || '');
  const [resumeLink, setResumeLink] = useState(user?.resumeLink || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Danger Zone
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setProfileSuccessMsg('Profile updated successfully.');
      setProfileErrorMsg('');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
      setProfileSuccessMsg('');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    const payload: any = {
      name: name.trim(),
      college: college.trim() || null,
      graduationYear: graduationYear ? Number(graduationYear) : null,
      linkedin: linkedin.trim() || null,
      github: github.trim() || null,
      resumeLink: resumeLink.trim() || null,
    };

    updateProfileMutation.mutate(payload);
  };

  // Safe CSV Export
  const handleExportCSV = async () => {
    try {
      const apps = await apiRequest('/applications');
      if (!apps || apps.length === 0) {
        alert('No applications found to export.');
        return;
      }

      const headers = ['Company', 'Role', 'Status', 'Priority', 'Job URL', 'Applied Date', 'Deadline', 'Follow-Up Date', 'Salary'];
      const escapeCsvCell = (val: any) => {
        if (val === null || val === undefined) return '""';
        let str = String(val).replace(/"/g, '""');
        if (/^[=\+\-@\t\r]/.test(str)) {
          str = "'" + str; // Sanitize against formula injection
        }
        return `"${str}"`;
      };

      const rows = apps.map((a: any) => [
        escapeCsvCell(a.company?.companyName || ''),
        escapeCsvCell(a.role),
        escapeCsvCell(a.status),
        escapeCsvCell(a.priority),
        escapeCsvCell(a.jobUrl || ''),
        escapeCsvCell(a.appliedDate ? new Date(a.appliedDate).toISOString().split('T')[0] : ''),
        escapeCsvCell(a.deadlineDate ? new Date(a.deadlineDate).toISOString().split('T')[0] : ''),
        escapeCsvCell(a.nextFollowUpDate ? new Date(a.nextFollowUpDate).toISOString().split('T')[0] : ''),
        escapeCsvCell(a.salary || ''),
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `interntrack_applications_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export error: ${err.message || err}`);
    }
  };

  // Full JSON Backup Export
  const handleExportJSON = async () => {
    try {
      const [apps, resumes, activity] = await Promise.all([
        apiRequest('/applications').catch(() => []),
        apiRequest('/resumes').catch(() => []),
        apiRequest('/activity').catch(() => []),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        user: { name: user?.name, email: user?.email },
        applications: apps,
        resumes: resumes,
        activity: activity,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `interntrack_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export error: ${err.message || err}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Account & Preferences
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Customize your candidate profile, appearance themes, keyboard commands, and export your recruitment data.
        </p>
      </div>

      {/* 1. Profile Information */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Candidate Profile
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Your credentials are used by the AI assistant to tailor interview responses and resume reviews.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
          {profileSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Email Address (Account ID)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 rounded-lg p-2.5 text-stone-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                College / University
              </label>
              <input
                type="text"
                placeholder="e.g. Stanford University"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                placeholder="2026"
                min={2000}
                max={2035}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                GitHub Profile URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Portfolio / Public Resume Link
            </label>
            <input
              type="url"
              placeholder="https://myportfolio.dev"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
              className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Appearance & Theme Selection */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Appearance & Theme
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              High-contrast stone and amber palette matching Linear-grade dark/light standards.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'light'
                ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold">Light Mode</span>
            <span className="text-[10px] text-stone-400">Warm stone canvas</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'dark'
                ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Moon className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold">Dark Mode</span>
            <span className="text-[10px] text-stone-400">Obsidian stone surfaces</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'system'
                ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Laptop className="w-5 h-5 text-stone-500" />
            <span className="text-xs font-bold">System Default</span>
            <span className="text-[10px] text-stone-400">Matches OS settings</span>
          </button>
        </div>
      </div>

      {/* 3. Keyboard Shortcuts Cheat-Sheet */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Command className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Raycast-style speed shortcuts for high-velocity navigation.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-700 dark:text-stone-300">Open Command Palette</span>
            <kbd className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-[11px] font-semibold text-stone-600 dark:text-stone-300">
              ⌘K / Ctrl+K
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-700 dark:text-stone-300">Track New Application</span>
            <kbd className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-[11px] font-semibold text-stone-600 dark:text-stone-300">
              ⌘N / Ctrl+N
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-700 dark:text-stone-300">Jump to Applications</span>
            <kbd className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-[11px] font-semibold text-stone-600 dark:text-stone-300">
              ⌘⇧A / Ctrl+Shift+A
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-700 dark:text-stone-300">Close Drawers / Modals</span>
            <kbd className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-[11px] font-semibold text-stone-600 dark:text-stone-300">
              Esc
            </kbd>
          </div>
        </div>
      </div>

      {/* 4. Data Export & Backups */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Data Portability & Export
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Export your recruitment history at any time with formula-injection-safe CSV or raw JSON backup.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Applications (CSV)</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Sanitized against formula injection. Compatible with Microsoft Excel, Google Sheets, and Notion databases.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-lg text-stone-800 dark:text-stone-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs">
                <FileCode className="w-4 h-4 text-amber-600" />
                <span>Full JSON Backup</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Complete archive containing applications, resumes, ATS diagnostic scans, and activity logs.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-lg text-stone-800 dark:text-stone-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Onboarding Guide Trigger */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Product Walkthrough & Feature Tour
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Revisit the 5-step guided walkthrough to explore core workflows and AI capabilities.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl transition-colors shrink-0"
        >
          Launch Tour
        </button>
      </div>

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
