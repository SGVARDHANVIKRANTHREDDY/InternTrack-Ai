import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { format } from 'date-fns';
import { 
  BriefcaseBusiness, 
  Award, 
  UserCheck, 
  Clock, 
  Sparkles, 
  LineChart, 
  FileText, 
  History, 
  ChevronRight, 
  RefreshCw,
  Send,
  Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

import { MetricCard } from '../components/dashboard/MetricCard';
import { PipelineDistribution } from '../components/dashboard/PipelineDistribution';
import { ActionTriageList } from '../components/dashboard/ActionTriageList';
import { CareerInsightsCard } from '../components/dashboard/CareerInsightsCard';

const SOURCE_COLORS = ['#d97706', '#b45309', '#f59e0b', '#fbbf24', '#fef3c7', '#78350f'];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: () => apiRequest('/analytics')
  });

  const { data: activity, isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ['activity'],
    queryFn: () => apiRequest('/activity')
  });

  const { data: apps, isLoading: appsLoading } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: () => apiRequest('/applications')
  });

  const { data: aiInsights, isLoading: insightsLoading } = useQuery<any>({
    queryKey: ['ai-insights'],
    queryFn: () => apiRequest('/analytics/ai-insights')
  });

  if (analyticsLoading || activityLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="text-xs text-stone-500 font-mono">Loading dashboard metrics...</span>
        </div>
      </div>
    );
  }

  const sourceData = Object.entries(analytics?.bySource || {})
    .map(([name, stats]: any) => ({
      name, 
      value: stats.count
    }))
    .filter(d => d.value > 0);

  const followUpsDue = apps?.filter((a: any) => {
    if (!a.nextFollowUpDate || a.followUpStatus === 'REPLIED' || ['Rejected', 'Offer Received'].includes(a.status)) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Pipeline Dashboard
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Real-time telemetry across recruitment funnel, conversion velocity, and actionable priorities.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/applications?action=new')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Track Application</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Applications"
          value={analytics?.totalApplications || 0}
          subtitle="Active recruitment records"
          icon={BriefcaseBusiness}
        />
        <MetricCard
          title="Offer Conversion"
          value={`${(analytics?.offerRate || 0).toFixed(1)}%`}
          subtitle="Application to offer rate"
          icon={Award}
          highlight={(analytics?.offerRate || 0) > 0}
        />
        <MetricCard
          title="Follow-Up Success"
          value={`${(analytics?.followUpSuccessRate || 0).toFixed(1)}%`}
          subtitle="Recruiter response yield"
          icon={UserCheck}
        />
        <MetricCard
          title="Follow-ups Pending"
          value={followUpsDue.length}
          subtitle="Action required soon"
          icon={Clock}
        />
      </div>

      {/* Main Grid: 2 Cols Left, 1 Col Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline Distribution vs Conversion Progression */}
          <PipelineDistribution
            statusCounts={analytics?.statusCounts || {}}
            totalApplications={analytics?.totalApplications || 0}
          />

          {/* AI Career Performance Coach */}
          <CareerInsightsCard
            insights={aiInsights}
            isLoading={insightsLoading}
          />

          {/* Applications by Source / Job Board Breakdown */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  <LineChart className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Applications by Portal Source
                </h3>
              </div>
              <span className="text-xs text-stone-400 font-mono">
                {sourceData.length} channels
              </span>
            </div>

            <div className="h-60 min-h-[220px]">
              {sourceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400">
                  No portal source data logged yet. Track portal sources in job records.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderColor: '#292524', 
                        borderRadius: '0.5rem', 
                        fontSize: '11px',
                        color: '#fafaf9' 
                      }} 
                    />
                    <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]}>
                      {sourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Resume Version Performance Tracker */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Resume Version Conversion
                </h3>
              </div>
              <Link to="/resumes" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <span>Manage Resumes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!analytics?.byResume || analytics.byResume.length === 0 ? (
              <p className="text-stone-400 text-xs text-center py-6">
                No resume assignment tracking records found. Assign resume versions inside Application Details.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">Resume Version</th>
                      <th className="py-2.5 text-center">Applications</th>
                      <th className="py-2.5 text-center">Interview Rate</th>
                      <th className="py-2.5 text-center">Offer Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {analytics.byResume.map((r: any) => (
                      <tr key={r.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                        <td className="py-3 font-semibold text-stone-900 dark:text-stone-100">{r.name}</td>
                        <td className="py-3 text-center font-mono">{r.count}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono font-medium">
                            {r.interviewRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                            {r.offerRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Action Triage List */}
          <ActionTriageList applications={apps || []} />

          {/* Recent Activity Mini-Feed */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Recent Activity
                </h3>
              </div>
              <Link to="/timeline" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-0.5">
                <span>All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {activity?.length === 0 ? (
                <p className="text-stone-400 text-xs text-center py-6">No recent activity logged.</p>
              ) : (
                activity?.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="text-xs space-y-1 pb-2.5 border-b border-stone-100 dark:border-stone-800/60 last:border-0 last:pb-0">
                    <p className="font-semibold text-stone-900 dark:text-stone-100">{log.action}</p>
                    <p className="text-stone-500 dark:text-stone-400 leading-snug">{log.details}</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                      {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
