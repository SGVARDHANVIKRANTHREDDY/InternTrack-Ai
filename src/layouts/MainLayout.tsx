import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  BriefcaseBusiness, 
  Building2, 
  KanbanSquare, 
  FileText, 
  LogOut, 
  Bell, 
  History, 
  Check, 
  Settings, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Search,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useState, useRef, useEffect } from 'react';
import { CommandPalette } from '../components/command/CommandPalette';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener
  useKeyboardShortcuts({
    onOpenCommand: () => setIsCommandOpen(prev => !prev),
    onEscape: () => {
      setIsMobileMenuOpen(false);
      setShowBellDropdown(false);
      setIsCommandOpen(false);
    }
  });

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Applications', path: '/applications', icon: BriefcaseBusiness },
    { name: 'Kanban Board', path: '/kanban', icon: KanbanSquare },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Resumes', path: '/resumes', icon: FileText },
    { name: 'Timeline', path: '/timeline', icon: History },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Preserved query
  const { data: notifications } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications'),
    refetchInterval: 30000,
  });

  // Preserved mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBellDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-950 relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 dark:bg-amber-500/5 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-stone-800/5 dark:bg-amber-400/5 blur-[100px]"></div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette 
        open={isCommandOpen} 
        onOpenChange={setIsCommandOpen} 
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-Out Navigation Sheet */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 z-50 transform transition-transform duration-250 ease-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-amber-500 flex items-center justify-center text-amber-500 dark:text-stone-950 font-bold">I</div>
            <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">InternTrack AI</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300' 
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 truncate">{user?.name}</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Toggle theme"
            >
              {actualTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Linear Style with Collapse Support) */}
      <aside className={`hidden md:flex flex-col border-r border-stone-200 dark:border-stone-800/80 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md z-10 transition-all duration-200 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-amber-500 flex items-center justify-center text-amber-500 dark:text-stone-950 font-bold shrink-0">I</div>
            {!isSidebarCollapsed && (
              <h1 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">InternTrack AI</h1>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive 
                    ? 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-medium' 
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800/80">
          {!isSidebarCollapsed ? (
            <div className="bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/50 p-3 rounded-xl mb-2">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-400 uppercase tracking-wider mb-1">Signed In</p>
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stone-800 to-stone-700 border border-amber-300 dark:border-amber-500 flex items-center justify-center text-amber-400 font-bold text-xs" title={user?.name}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          <button 
            onClick={logout}
            className={`flex items-center gap-2.5 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 rounded-lg transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : 'px-3'}`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        {/* Topbar */}
        <header className="h-16 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between px-4 sm:px-8 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 md:hidden"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Raycast-style search command trigger */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-3 px-3.5 py-1.5 bg-stone-100/80 dark:bg-stone-800/70 hover:bg-stone-200/70 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs text-stone-500 dark:text-stone-400 transition-colors w-48 sm:w-80 justify-between text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Search or command...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded">
                ⌘K
              </kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={`Switch to ${actualTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle color theme"
            >
              {actualTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Interactive Bell Notification dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowBellDropdown(!showBellDropdown)}
                className="relative p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showBellDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">Notifications</span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">{unreadCount} Unread</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-50 dark:divide-stone-800/50">
                    {unreadNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-stone-400 dark:text-stone-500">
                        No unread notifications!
                      </div>
                    ) : (
                      unreadNotifications.slice(0, 5).map((n) => (
                        <div key={n.id} className="p-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/40 flex items-start gap-2 text-left">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{n.title}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-normal">{n.message}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(n.id);
                            }}
                            className="p-1 rounded-md text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <Link 
                    to="/notifications" 
                    onClick={() => setShowBellDropdown(false)}
                    className="block text-center text-xs font-semibold text-amber-700 dark:text-amber-400 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 py-2 border-t border-stone-100 dark:border-stone-800 transition-colors"
                  >
                    View All Notifications
                  </Link>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <Link to="/settings" className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stone-800 to-stone-700 border border-amber-300 dark:border-amber-500 flex items-center justify-center text-amber-400 font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>

      {/* Raycast-grade Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}
