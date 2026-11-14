import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { format } from 'date-fns';
import { Clock, CheckCircle2, History, Send, FileEdit, Sparkles, AlertCircle } from 'lucide-react';

interface ApplicationTimelineProps {
  applicationId: string;
  applicationCreatedAt: string;
  applicationUpdatedAt?: string;
}

export function ApplicationTimeline({ applicationId, applicationCreatedAt }: ApplicationTimelineProps) {
  const { data: allActivities, isLoading } = useQuery<any[]>({
    queryKey: ['activity'],
    queryFn: () => apiRequest('/activity'),
  });

  // Filter activities belonging to this specific application
  const appActivities = (allActivities || []).filter(
    (act: any) => act.entityId === applicationId || (act.details && act.details.includes(applicationId))
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Status Changed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Follow-Up Sent':
        return <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Resume Assigned':
      case 'Application Updated':
        return <FileEdit className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <Clock className="w-4 h-4 text-stone-500 dark:text-stone-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
          <History className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          Application Event History
        </h4>
        <span className="text-[11px] text-stone-400 dark:text-stone-500">Live Audit Trail</span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
          Loading timeline events...
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
          {/* Application Created Event (Baseline) */}
          <div className="relative flex items-start gap-3">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Application Tracked</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Record initially created in InternTrack
              </p>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 block">
                {applicationCreatedAt ? format(new Date(applicationCreatedAt), 'MMM d, yyyy • h:mm a') : 'Initial'}
              </span>
            </div>
          </div>

          {/* Real Status Transitions and Interactions */}
          {appActivities.map((event: any) => (
            <div key={event.id} className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center shrink-0">
                {getActionIcon(event.action)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">{event.action}</p>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 leading-normal">
                  {event.details || 'Status update logged.'}
                </p>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 block">
                  {event.createdAt ? format(new Date(event.createdAt), 'MMM d, yyyy • h:mm a') : ''}
                </span>
              </div>
            </div>
          ))}

          {appActivities.length === 0 && (
            <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/60 dark:border-stone-700/60 text-xs text-stone-500 dark:text-stone-400">
              No subsequent status updates recorded yet. Future status updates and follow-ups will appear here chronologically.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
