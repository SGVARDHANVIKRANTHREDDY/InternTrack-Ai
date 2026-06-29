import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { format } from 'date-fns';
import { 
  Bell, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  CheckCheck, 
  Eye, 
  EyeOff, 
  PlusSquare,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';

export default function Notifications() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  const { data: notifications, isLoading } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications')
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DEADLINE': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'INTERVIEW': return <Calendar className="w-5 h-5 text-emerald-600" />;
      case 'FOLLOWUP': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'SYSTEM': return <PlusSquare className="w-5 h-5 text-indigo-600" />;
      default: return <Bell className="w-5 h-5 text-stone-500" />;
    }
  };

  const getNotificationStyles = (type: string, read: boolean) => {
    let colors = 'bg-stone-50 border-stone-200';
    if (!read) {
      switch (type) {
        case 'DEADLINE': colors = 'bg-amber-50/50 border-amber-200/60'; break;
        case 'INTERVIEW': colors = 'bg-emerald-50/50 border-emerald-200/60'; break;
        case 'FOLLOWUP': colors = 'bg-blue-50/50 border-blue-200/60'; break;
        case 'SYSTEM': colors = 'bg-indigo-50/50 border-indigo-200/60'; break;
      }
    }
    return colors;
  };

  const filtered = notifications?.filter((n: any) => {
    if (tab === 'UNREAD') return !n.read;
    if (tab === 'READ') return n.read;
    return true;
  }) || [];

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-stone-200 p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Notification Center</h2>
          <p className="text-sm text-stone-500">Automated deadline tracking, follow-ups, and system alerts.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-semibold text-sm rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm shrink-0 self-start md:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 flex items-center justify-between gap-4">
        <div className="flex gap-6">
          <button 
            onClick={() => setTab('ALL')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'ALL' 
                ? 'border-amber-600 text-amber-800' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            All ({notifications?.length || 0})
          </button>
          <button 
            onClick={() => setTab('UNREAD')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'UNREAD' 
                ? 'border-amber-600 text-amber-800' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button 
            onClick={() => setTab('READ')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'READ' 
                ? 'border-amber-600 text-amber-800' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Read ({notifications?.filter((n: any) => n.read).length || 0})
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm">
            <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No notifications found</p>
            <p className="text-sm text-stone-400 mt-1">
              {tab === 'UNREAD' ? "You've read all your alerts! Awesome work." : "Check back later for deadlines or follow-up due alerts."}
            </p>
          </div>
        ) : (
          filtered.map((n: any) => (
            <div 
              key={n.id} 
              className={`p-4 md:p-5 rounded-xl border flex gap-4 items-start shadow-sm transition-shadow hover:shadow-md ${getNotificationStyles(n.type, n.read)} bg-white`}
            >
              {/* Type icon badge */}
              <span className={`p-2.5 rounded-lg border bg-white shadow-sm flex items-center justify-center shrink-0`}>
                {getNotificationIcon(n.type)}
              </span>

              {/* Message text */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                  <h4 className={`text-sm md:text-base font-bold text-stone-900 ${!n.read ? 'font-black' : ''}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-stone-400 font-mono">
                    {format(new Date(n.createdAt), 'MMM d, yyyy • h:mm a')}
                  </span>
                </div>
                <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                  {n.message}
                </p>
              </div>

              {/* Mark read toggle */}
              {!n.read && (
                <button 
                  onClick={() => markReadMutation.mutate(n.id)}
                  disabled={markReadMutation.isPending}
                  className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-stone-600 transition-colors flex items-center gap-1 shrink-0"
                  title="Mark as read"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
