import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { format } from 'date-fns';
import { 
  Bell, 
  Calendar, 
  Clock, 
  CheckCheck, 
  Eye, 
  MessageSquare,
  Sparkles 
} from 'lucide-react';
import { EmptyState } from '../components/ui/empty-state';

export default function Notifications() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          <span className="text-xs text-stone-500 font-mono">Loading notifications...</span>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DEADLINE': return <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'INTERVIEW': return <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'FOLLOWUP': return <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default: return <Bell className="w-5 h-5 text-stone-500" />;
    }
  };

  const filtered = notifications.filter((n: any) => {
    if (tab === 'UNREAD') return !n.read;
    if (tab === 'READ') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" />
            Notifications & Alerts
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Automated alerts for approaching deadlines, follow-up reminders, and pipeline events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 dark:border-stone-800 flex items-center gap-6">
        <button
          onClick={() => setTab('ALL')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
            tab === 'ALL'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setTab('UNREAD')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
            tab === 'UNREAD'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setTab('READ')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
            tab === 'READ'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All caught up!"
            description={
              tab === 'UNREAD'
                ? "You have read all of your active alerts."
                : "No notifications logged yet. Deadlines and recruiter follow-ups will appear here."
            }
          />
        ) : (
          filtered.map((n: any) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all shadow-xs ${
                !n.read
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-xs font-bold text-stone-900 dark:text-stone-100 ${!n.read ? 'font-black' : ''}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-2">
                    {format(new Date(n.createdAt), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => markReadMutation.mutate(n.id)}
                  disabled={markReadMutation.isPending}
                  className="px-2.5 py-1 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 transition-colors flex items-center gap-1 shrink-0"
                  title="Mark as read"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Read</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
