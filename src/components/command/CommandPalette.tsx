import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  BriefcaseBusiness, 
  KanbanSquare, 
  Building2, 
  FileText, 
  History, 
  Bell, 
  Settings, 
  Plus, 
  Sun, 
  Moon, 
  Sparkles,
  Search,
  ArrowRight
} from 'lucide-react';

interface CommandPaletteProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onNewApplication?: () => void;
}

export function CommandPalette({ 
  open, 
  isOpen, 
  onOpenChange, 
  onClose, 
  onNewApplication 
}: CommandPaletteProps) {
  const isPaletteOpen = isOpen ?? open ?? false;
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const navigate = useNavigate();
  const { actualTheme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');

  // Fetch applications for live search
  const { data: apps } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: () => apiRequest('/applications'),
    enabled: isPaletteOpen,
  });

  // Fetch companies for live search
  const { data: companies } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: () => apiRequest('/companies'),
    enabled: isPaletteOpen,
  });

  useEffect(() => {
    if (!isPaletteOpen) setSearch('');
  }, [isPaletteOpen]);

  if (!isPaletteOpen) return null;

  const runCommand = (command: () => void) => {
    command();
    handleClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global Command Menu" className="flex flex-col h-full">
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-100 dark:border-stone-800/80">
            <Search className="w-5 h-5 text-stone-400 dark:text-stone-500 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search applications, companies..."
              className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
              No matching results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="px-2 py-1 text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => {
                  if (onNewApplication) onNewApplication();
                  else navigate('/applications?action=new');
                })}
                className="flex items-center justify-between px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span>Create New Application</span>
                </div>
                <kbd className="text-[10px] text-stone-400 dark:text-stone-500">⌘N</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => toggleTheme())}
                className="flex items-center justify-between px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                    {actualTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </div>
                  <span>Toggle Theme ({actualTheme === 'dark' ? 'Light Mode' : 'Dark Mode'})</span>
                </div>
              </Command.Item>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="px-2 py-1 text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/'))}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <LayoutDashboard className="w-4 h-4 text-stone-500" />
                <span>Dashboard</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/applications'))}
                className="flex items-center justify-between px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <div className="flex items-center gap-2.5">
                  <BriefcaseBusiness className="w-4 h-4 text-stone-500" />
                  <span>Applications</span>
                </div>
                <kbd className="text-[10px] text-stone-400 dark:text-stone-500">⌘⇧A</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/kanban'))}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <KanbanSquare className="w-4 h-4 text-stone-500" />
                <span>Kanban Board</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/companies'))}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <Building2 className="w-4 h-4 text-stone-500" />
                <span>Companies</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/resumes'))}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Resumes Workspace</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/timeline'))}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <History className="w-4 h-4 text-stone-500" />
                <span>Activity Timeline</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/settings'))}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
              >
                <Settings className="w-4 h-4 text-stone-500" />
                <span>Account & Settings</span>
              </Command.Item>
            </Command.Group>

            {/* Live Applications Search */}
            {apps && apps.length > 0 && (
              <Command.Group heading="Applications" className="px-2 py-1 text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
                {apps.slice(0, 5).map((app: any) => (
                  <Command.Item
                    key={app.id}
                    value={`${app.role} ${app.company?.companyName}`}
                    onSelect={() => runCommand(() => navigate(`/applications?appId=${app.id}`))}
                    className="flex items-center justify-between px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {app.company?.companyName?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{app.role}</span>
                        <span className="text-stone-500 dark:text-stone-400 text-xs ml-1.5 font-normal">at {app.company?.companyName}</span>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 shrink-0">
                      {app.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Live Companies Search */}
            {companies && companies.length > 0 && (
              <Command.Group heading="Companies" className="px-2 py-1 text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
                {companies.slice(0, 4).map((c: any) => (
                  <Command.Item
                    key={c.id}
                    value={c.companyName}
                    onSelect={() => runCommand(() => navigate('/companies'))}
                    className="flex items-center justify-between px-3 py-2 text-sm text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors aria-selected:bg-amber-50 dark:aria-selected:bg-amber-950/40 aria-selected:text-amber-800 dark:aria-selected:text-amber-300"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                      <span className="font-medium text-stone-900 dark:text-stone-100">{c.companyName}</span>
                    </div>
                    <span className="text-xs text-stone-400 dark:text-stone-500">{c.industry || 'Company'}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Guide */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/50">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>InternTrack AI</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
