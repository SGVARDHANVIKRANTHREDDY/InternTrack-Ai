import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { format, differenceInDays } from 'date-fns';
import { 
  BriefcaseBusiness, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  LineChart, 
  PieChart, 
  Send, 
  CheckCircle,
  FileText,
  Building,
  ArrowRight,
  TrendingUp,
  History,
  Award,
  ChevronRight,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

// Recharts visualization palette configuration
const PIPELINE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
// AI insights source performance configuration
const SOURCE_COLORS = ['#d97706', '#b45309', '#f59e0b', '#fbbf24', '#fef3c7', '#78350f'];

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: () => apiRequest('/analytics')
  });

  const { data: activity, isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ['activity'],
    queryFn: () => apiRequest('/activity')
  });

  const { data: apps } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: () => apiRequest('/applications')
  });

  const { data: aiInsights, isLoading: insightsLoading } = useQuery<any>({
    queryKey: ['ai-insights'],
    queryFn: () => apiRequest('/analytics/ai-insights')
  });

  const generateInsightsMutation = useMutation({
    mutationFn: () => apiRequest('/analytics/ai-insights', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  if (analyticsLoading || activityLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const statusData = Object.entries(analytics?.statusCounts || {}).map(([name, value]) => ({
    name, value
  }));

  const sourceData = Object.entries(analytics?.bySource || {}).map(([name, stats]: any) => ({
    name, value: stats.count
  })).filter(d => d.value > 0);

  const upcomingDeadlines = apps
    ?.filter((a: any) => a.deadlineDate && new Date(a.deadlineDate) >= new Date() && !['Rejected', 'Offer Received'].includes(a.status))
    ?.sort((a: any, b: any) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime())
    ?.slice(0, 4) || [];

  // Filter follow-ups due today and this week
  const now = new Date();
  const followUpsDue = apps?.filter((a: any) => {
    if (!a.nextFollowUpDate || a.followUpStatus === 'REPLIED') return false;
    const date = new Date(a.nextFollowUpDate);
    const diff = differenceInDays(date, now);
    return diff <= 7;
  }) || [];

  const followUpsDueToday = followUpsDue.filter(a => {
    const date = new Date(a.nextFollowUpDate);
    return differenceInDays(date, now) <= 0;
  });

  const parsedRecommendations = aiInsights?.recommendations
    ? typeof aiInsights.recommendations === 'string'
      ? JSON.parse(aiInsights.recommendations)
      : aiInsights.recommendations
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-stone-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Your Recruitment Dashboard</h2>
          <p className="text-stone-500 text-sm">Visualize pipeline health, analyze application sources, and review automated AI tailored tips.</p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50"
          >
            {generateInsightsMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {aiInsights ? 'Re-Analyze Applications' : 'Run AI Application Analyzer'}
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <BriefcaseBusiness className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Total Mapped</p>
            <p className="text-2xl font-extrabold text-stone-900">{analytics?.totalApplications || 0}</p>
            <p className="text-xs text-stone-400 mt-0.5">Active applications</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Offer Conversion</p>
            <p className="text-2xl font-extrabold text-emerald-600">{(analytics?.offerRate || 0).toFixed(1)}%</p>
            <p className="text-xs text-stone-400 mt-0.5">Application to offer conversion</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Follow-Up Success</p>
            <p className="text-2xl font-extrabold text-amber-600">{(analytics?.followUpSuccessRate || 0).toFixed(1)}%</p>
            <p className="text-xs text-stone-400 mt-0.5">Recruiter response rate</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Follow-ups Due</p>
            <p className="text-2xl font-extrabold text-rose-600">{followUpsDue.length}</p>
            <p className="text-xs text-stone-400 mt-0.5">{followUpsDueToday.length} due today</p>
          </div>
        </div>
      </div>

      {/* Main Panel Content (two-thirds left, one-third right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Charts Section */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-amber-600" />
                Pipeline Analysis
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Application Pipeline */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-stone-600">Applications by Current Status</p>
                <div className="h-56 min-h-[220px]">
                  {statusData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-stone-400">No applications tracked yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#78716c'}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#78716c'}} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '0.5rem', fontSize: '11px' }}
                        />
                        <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Source breakdown */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-stone-600">Applications by Portal Source</p>
                <div className="h-56 min-h-[220px]">
                  {sourceData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-stone-400">No portal source data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sourceData} layout="vertical">
                        <XAxis type="number" tick={{fontSize: 10, fill: '#78716c'}} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 9, fill: '#78716c'}} tickLine={false} axisLine={false} width={85} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '0.5rem', fontSize: '11px' }}
                        />
                        <Bar dataKey="value" fill="#b45309" radius={[0, 4, 4, 0]}>
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights & Recommendations */}
          <div className="bg-gradient-to-br from-amber-50/50 to-stone-50 border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute right-[-5%] top-[-10%] w-40 h-40 bg-amber-400/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center justify-between border-b border-amber-200/30 pb-4">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                AI Career Performance Coach
              </h3>
              {aiInsights && (
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200/50 px-2 py-0.5 rounded-md font-mono">
                  Analyzed {format(new Date(aiInsights.createdAt), 'MMM d')}
                </span>
              )}
            </div>

            {insightsLoading ? (
              <div className="py-6 text-center text-sm text-stone-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                Loading AI Insights...
              </div>
            ) : !aiInsights ? (
              <div className="py-8 text-center space-y-4">
                <p className="text-stone-500 font-medium text-sm">No career insights generated yet.</p>
                <p className="text-xs text-stone-400 max-w-md mx-auto">Click &quot;Run AI Application Analyzer&quot; to inspect your applications, success rate ratios, sources, and receive tailor-made strategy recommendations.</p>
                <button 
                  onClick={() => generateInsightsMutation.mutate()}
                  disabled={generateInsightsMutation.isPending}
                  className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Analyze My Applications Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Funnel Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-white border border-stone-200 p-3 rounded-xl shadow-xs text-center">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Strongest Sector</span>
                    <span className="text-xs font-bold text-amber-800 block truncate mt-1">{aiInsights.mostSuccessfulIndustry}</span>
                  </div>
                  <div className="bg-white border border-stone-200 p-3 rounded-xl shadow-xs text-center">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Top Portal</span>
                    <span className="text-xs font-bold text-amber-800 block truncate mt-1">{aiInsights.mostSuccessfulSource}</span>
                  </div>
                  <div className="bg-white border border-stone-200 p-3 rounded-xl shadow-xs text-center">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Drop-off Stage</span>
                    <span className="text-xs font-bold text-rose-700 block truncate mt-1">{aiInsights.mostCommonRejectionStage}</span>
                  </div>
                  <div className="bg-white border border-stone-200 p-3 rounded-xl shadow-xs text-center col-span-1">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Peak Funnel</span>
                    <span className="text-xs font-bold text-stone-800 block truncate mt-1" title={aiInsights.highestConversionFunnel}>{aiInsights.highestConversionFunnel}</span>
                  </div>
                  <div className="bg-white border border-stone-200 p-3 rounded-xl shadow-xs text-center col-span-1">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Bottleneck</span>
                    <span className="text-xs font-bold text-stone-800 block truncate mt-1" title={aiInsights.weakestFunnelStage}>{aiInsights.weakestFunnelStage}</span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-3">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    Personalized Action Recommendations
                  </p>
                  <ul className="space-y-2.5">
                    {parsedRecommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex gap-2.5 text-sm text-stone-700 leading-relaxed items-start">
                        <span className="w-5 h-5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Resume Version Performance */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-4">
              <FileText className="w-5 h-5 text-amber-600" />
              Resume Performance Tracker
            </h3>

            {!analytics?.byResume || analytics.byResume.length === 0 ? (
              <p className="text-stone-400 text-xs text-center py-6">No resume assignment tracking records found. Assign resume versions inside Application Details.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-2.5 font-bold">Resume Name & Version</th>
                      <th className="py-2.5 font-bold text-center">Applications</th>
                      <th className="py-2.5 font-bold text-center">Interview Rate</th>
                      <th className="py-2.5 font-bold text-center">Offer Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {analytics.byResume.map((r: any) => (
                      <tr key={r.id} className="hover:bg-stone-50/50">
                        <td className="py-3 font-bold text-stone-900">{r.name}</td>
                        <td className="py-3 text-center font-semibold">{r.count}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md font-bold text-indigo-700">
                            {r.interviewRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md font-bold text-emerald-700">
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

        {/* Right Column (1 Col) */}
        <div className="space-y-8">
          
          {/* Follow-ups Due Widget */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <Send className="w-4 h-4 text-amber-600" />
              Follow-Ups Due (7 Days)
            </h3>
            
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {followUpsDue.length === 0 ? (
                <p className="text-stone-400 text-xs text-center py-6">All clear! No recruiter follow-ups due this week.</p>
              ) : (
                followUpsDue.map((app: any) => {
                  const daysLeft = differenceInDays(new Date(app.nextFollowUpDate), now);
                  const isOverdue = daysLeft < 0;
                  return (
                    <div key={app.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase truncate text-stone-500">
                          {app.company?.companyName}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOverdue 
                            ? 'bg-rose-100 text-rose-800' 
                            : daysLeft === 0 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Today' : `In ${daysLeft} days`}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-stone-900 truncate">{app.role}</p>
                      {app.followUpNotes && (
                        <p className="text-[10px] text-stone-500 truncate italic">Notes: {app.followUpNotes}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              Deadlines Upcoming
            </h3>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-stone-400 text-xs text-center py-6">No upcoming deadlines.</p>
              ) : (
                upcomingDeadlines.map((app: any) => {
                  const daysLeft = differenceInDays(new Date(app.deadlineDate), now);
                  return (
                    <div key={app.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{app.company?.companyName}</p>
                        <p className="text-[10px] text-stone-500 truncate">{app.role}</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md shrink-0 border ${
                        daysLeft <= 3 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-stone-100 border-stone-200 text-stone-600'
                      }`}>
                        {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity Mini-Timeline */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                Recent Logs
              </h3>
              <Link to="/timeline" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5">
                Full Log
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {activity?.length === 0 ? (
                <p className="text-stone-400 text-xs text-center py-6">No activity logged.</p>
              ) : (
                activity?.slice(0, 3).map((log: any) => (
                  <div key={log.id} className="text-xs space-y-0.5">
                    <p className="font-bold text-stone-900">{log.action}</p>
                    <p className="text-stone-500 leading-snug">{log.details}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</p>
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
