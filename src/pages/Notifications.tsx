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
  MessageSquare,
  Trash2,
  Check
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Notifications() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Custom confirmation modals state
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

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

  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: (_, deletedId) => {
      setSelectedIds(prev => prev.filter(id => id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteBulkMutation = useMutation({
    mutationFn: (ids: string[]) => apiRequest('/notifications/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }),
    onSuccess: (_, deletedIds) => {
      setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)));
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

  // Toggle selection for a single notification
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-stone-200 p-6 rounded-2xl shadow-sm">
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
            onClick={() => {
              setTab('ALL');
              setSelectedIds([]);
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'ALL' 
                ? 'border-amber-600 text-amber-800' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            All ({notifications?.length || 0})
          </button>
          <button 
            onClick={() => {
              setTab('UNREAD');
              setSelectedIds([]);
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'UNREAD' 
                ? 'border-amber-600 text-amber-800' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button 
            onClick={() => {
              setTab('READ');
              setSelectedIds([]);
            }}
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

      {/* Bulk action selection bar */}
      {filtered.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-3 px-4 flex items-center justify-between gap-4 text-xs md:text-sm text-stone-600 shadow-sm">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every((n: any) => selectedIds.includes(n.id))}
              onChange={(e) => {
                if (e.target.checked) {
                  // Select all visible filtered notifications
                  const visibleIds = filtered.map((n: any) => n.id);
                  setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                } else {
                  // Deselect all visible filtered notifications
                  const visibleIds = filtered.map((n: any) => n.id);
                  setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
                }
              }}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
              id="select-all-notifications"
            />
            <label htmlFor="select-all-notifications" className="font-semibold cursor-pointer select-none">
              {selectedIds.length > 0 ? `Selected ${selectedIds.length} of ${filtered.length}` : 'Select All on this tab'}
            </label>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={deleteBulkMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 shadow-sm"
            >
              <Trash2 className={`w-3.5 h-3.5 ${deleteBulkMutation.isPending ? 'animate-spin' : ''}`} />
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      )}

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
          filtered.map((n: any) => {
            const isSelected = selectedIds.includes(n.id);
            return (
              <div 
                key={n.id} 
                className={`p-4 md:p-5 rounded-xl border flex gap-4 items-start shadow-sm transition-all hover:shadow-md ${getNotificationStyles(n.type, n.read)} bg-white ${
                  isSelected ? 'ring-2 ring-amber-500/50 border-amber-300' : ''
                }`}
              >
                {/* Selection checkbox */}
                <div className="pt-2 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(n.id)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
                  />
                </div>

                {/* Type icon badge */}
                <span className={`p-2.5 rounded-lg border bg-white shadow-sm flex items-center justify-center shrink-0`}>
                  {getNotificationIcon(n.type)}
                </span>

                {/* Message text */}
                <div className="flex-1 min-w-0" onClick={() => handleToggleSelect(n.id)}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1 cursor-pointer">
                    <h4 className={`text-sm md:text-base font-bold text-stone-900 ${!n.read ? 'font-black' : ''}`}>
                      {n.title}
                    </h4>
                    <span className="text-xs text-stone-400 font-mono">
                      {format(new Date(n.createdAt), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                  <p className="text-stone-600 text-sm md:text-base leading-relaxed cursor-pointer select-none">
                    {n.message}
                  </p>
                </div>

                {/* Action buttons (Read / Delete) */}
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markReadMutation.mutate(n.id);
                      }}
                      disabled={markReadMutation.isPending}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-stone-600 transition-colors flex items-center gap-1"
                      title="Mark as read"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSingleDeleteId(n.id);
                      setIsSingleDeleteOpen(true);
                    }}
                    disabled={deleteSingleMutation.isPending}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all flex items-center justify-center"
                    title="Delete notification"
                  >
                    <Trash2 className={`w-4 h-4 ${deleteSingleMutation.isPending && singleDeleteId === n.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Single Notification Delete Confirmation Dialog */}
      <Dialog open={isSingleDeleteOpen} onOpenChange={setIsSingleDeleteOpen}>
        <DialogContent className="bg-white border border-stone-200 rounded-xl max-w-sm p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-stone-900">Delete Notification?</DialogTitle>
          </DialogHeader>
          <div className="mt-2 text-sm text-stone-500">
            <p>
              Are you sure you want to permanently delete this notification?
            </p>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsSingleDeleteOpen(false);
                setSingleDeleteId(null);
              }}
              className="flex-1 h-10 border-stone-200 text-stone-700 font-bold hover:bg-stone-50"
              disabled={deleteSingleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (singleDeleteId) {
                  deleteSingleMutation.mutate(singleDeleteId, {
                    onSuccess: () => {
                      setIsSingleDeleteOpen(false);
                      setSingleDeleteId(null);
                    }
                  });
                }
              }}
              className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={deleteSingleMutation.isPending}
            >
              {deleteSingleMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Notifications Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="bg-white border border-stone-200 rounded-xl max-w-sm p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-stone-900">Delete Selected Notifications?</DialogTitle>
          </DialogHeader>
          <div className="mt-2 text-sm text-stone-500">
            <p>
              Are you sure you want to permanently delete the <strong className="text-stone-900 font-bold">{selectedIds.length}</strong> selected notifications?
            </p>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteOpen(false)}
              className="flex-1 h-10 border-stone-200 text-stone-700 font-bold hover:bg-stone-50"
              disabled={deleteBulkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                deleteBulkMutation.mutate(selectedIds, {
                  onSuccess: () => {
                    setIsBulkDeleteOpen(false);
                  }
                });
              }}
              className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={deleteBulkMutation.isPending}
            >
              {deleteBulkMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
