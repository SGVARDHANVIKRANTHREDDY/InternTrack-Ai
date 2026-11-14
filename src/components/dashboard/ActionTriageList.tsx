import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { differenceInDays, format } from 'date-fns';
import { 
  AlertCircle, 
  Clock, 
  Send, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ActionTriageListProps {
  applications: any[];
}

export const ActionTriageList: React.FC<ActionTriageListProps> = ({ applications = [] }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const now = new Date();

  // Mark follow-up as completed mutation
  const markFollowUpRepliedMutation = useMutation({
    mutationFn: (appId: string) => 
      apiRequest(`/applications/${appId}`, {
        method: 'PUT',
        body: JSON.stringify({ followUpStatus: 'REPLIED' })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  // Calculate follow-ups
  const followUps = applications
    .filter(a => a.nextFollowUpDate && a.followUpStatus !== 'REPLIED' && !['Rejected', 'Offer Received'].includes(a.status))
    .map(a => {
      const days = differenceInDays(new Date(a.nextFollowUpDate), now);
      return { ...a, daysUntil: days };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  // Calculate upcoming deadlines
  const deadlines = applications
    .filter(a => a.deadlineDate && new Date(a.deadlineDate) >= now && !['Rejected', 'Offer Received'].includes(a.status))
    .map(a => {
      const days = differenceInDays(new Date(a.deadlineDate), now);
      return { ...a, daysUntil: days };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  // Scheduled interviews
  const upcomingInterviews = applications
    .filter(a => a.status === 'Interview Scheduled')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Follow-ups Due Action Widget */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Follow-ups Requiring Attention
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            {followUps.length} pending
          </span>
        </div>

        {followUps.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400 dark:text-stone-500">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1.5 text-emerald-500" />
            All caught up! No recruiter follow-ups pending.
          </div>
        ) : (
          <div className="space-y-2.5">
            {followUps.map((app) => {
              const isOverdue = app.daysUntil < 0;
              const isToday = app.daysUntil === 0;

              return (
                <div 
                  key={app.id} 
                  className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-stone-100 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/60 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
                >
                  <div 
                    onClick={() => navigate(`/applications?appId=${app.id}`)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {app.company?.companyName || 'Company'}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isOverdue 
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400' 
                          : isToday 
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' 
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}>
                        {isOverdue ? `${Math.abs(app.daysUntil)}d overdue` : isToday ? 'Due today' : `In ${app.daysUntil}d`}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {app.role} {app.followUpNotes && `— ${app.followUpNotes}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => markFollowUpRepliedMutation.mutate(app.id)}
                      disabled={markFollowUpRepliedMutation.isPending}
                      title="Mark as Replied / Completed"
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Done</span>
                    </button>
                    <button
                      onClick={() => navigate(`/applications?appId=${app.id}`)}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                      title="Open in Inspector"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deadlines Approaching */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Upcoming Deadlines
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            {deadlines.length}
          </span>
        </div>

        {deadlines.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400 dark:text-stone-500">
            No application deadlines in the immediate future.
          </div>
        ) : (
          <div className="space-y-2">
            {deadlines.map((app) => (
              <div 
                key={app.id} 
                onClick={() => navigate(`/applications?appId=${app.id}`)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 dark:border-stone-800/80 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {app.company?.companyName}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    {app.role}
                  </p>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  app.daysUntil <= 2 
                    ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300' 
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}>
                  {app.daysUntil === 0 ? 'Today' : `${app.daysUntil}d left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Interview Stages */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Interview Pipeline
              </h3>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {upcomingInterviews.length} active
            </span>
          </div>

          <div className="space-y-2">
            {upcomingInterviews.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/applications?appId=${app.id}`)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/30 dark:bg-indigo-950/20 hover:border-indigo-300 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {app.company?.companyName}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    {app.role}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                  Prep AI
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
