import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, BriefcaseBusiness, Building2, KanbanSquare, FileText, LogOut, Bell, History, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useState, useRef, useEffect } from 'react';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Applications', path: '/applications', icon: BriefcaseBusiness },
    { name: 'Kanban Board', path: '/kanban', icon: KanbanSquare },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Resumes', path: '/resumes', icon: FileText },
    { name: 'Timeline', path: '/timeline', icon: History },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const { data: notifications } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications'),
    refetchInterval: 30000, // Refetch every 30s
  });

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

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-stone-800 bg-stone-50 relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-stone-800/5 blur-[100px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-stone-200 bg-white/50 backdrop-blur-md z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-amber-500 font-bold">I</div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">InternTrack AI</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-amber-100/50 text-amber-700 font-medium' 
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-200">
          <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl mb-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Welcome Back</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-900 truncate">{user?.name}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        {/* Topbar */}
        <header className="h-16 border-b border-stone-200 flex items-center justify-between px-8 bg-white/50 backdrop-blur-md shrink-0 relative z-20">
          <div className="flex items-center gap-4 bg-stone-100 px-4 py-2 rounded-full border border-stone-200 w-96">
            <h2 className="text-sm font-semibold text-stone-600 capitalize">
              {navItems.find(i => i.path === location.pathname)?.name || 'Overview'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Interactive Bell Notification dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowBellDropdown(!showBellDropdown)}
                className="relative focus:outline-none flex items-center justify-center p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <Bell className="w-6 h-6 text-stone-500 hover:text-stone-800" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-amber-600 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showBellDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-xl py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm">Notifications</span>
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">{unreadCount} Unread</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-50">
                    {unreadNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-stone-400">
                        No unread notifications!
                      </div>
                    ) : (
                      unreadNotifications.slice(0, 5).map((n) => (
                        <div key={n.id} className="p-3 hover:bg-stone-50/50 flex items-start gap-2 text-left">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">{n.title}</p>
                            <p className="text-xs text-stone-500 mt-0.5 leading-normal">{n.message}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(n.id);
                            }}
                            className="p-1 rounded-md text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
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
                    className="block text-center text-xs font-bold text-amber-700 bg-stone-50 hover:bg-stone-100 py-2.5 border-t border-stone-100 transition-colors"
                  >
                    View All Notifications
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-900 leading-none">{user?.name}</p>
                <p className="text-xs text-stone-500">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-stone-800 to-stone-700 border-2 border-amber-200 flex items-center justify-center text-amber-400 font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
