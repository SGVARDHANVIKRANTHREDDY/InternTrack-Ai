import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { Layers, ArrowRight, BarChart3, TrendingUp, Info } from 'lucide-react';

const PIPELINE_PALETTE = [
  '#78716c', // Wishlist (stone)
  '#0284c7', // Applied (sky)
  '#6366f1', // OA Scheduled (indigo)
  '#a855f7', // OA Completed (purple)
  '#f59e0b', // Interview Scheduled (amber)
  '#d97706', // Interview Completed (amber dark)
  '#10b981', // Offer Received (emerald)
  '#f43f5e', // Rejected (rose)
];

interface PipelineDistributionProps {
  statusCounts: Record<string, number>;
  totalApplications: number;
}

export function PipelineDistribution({ statusCounts, totalApplications }: PipelineDistributionProps) {
  const [activeTab, setActiveTab] = useState<'distribution' | 'progression'>('distribution');

  // Distribution Data: snapshot of current statuses
  const distributionData = [
    { name: 'Wishlist', count: statusCounts['Wishlist'] || 0 },
    { name: 'Applied', count: statusCounts['Applied'] || 0 },
    { name: 'OA', count: (statusCounts['OA Scheduled'] || 0) + (statusCounts['OA Completed'] || 0) },
    { name: 'Interview', count: (statusCounts['Interview Scheduled'] || 0) + (statusCounts['Interview Completed'] || 0) },
    { name: 'Offer', count: statusCounts['Offer Received'] || 0 },
    { name: 'Rejected', count: statusCounts['Rejected'] || 0 },
  ];

  // Progression Data: Cumulative progression cohort
  const appliedCount = totalApplications - (statusCounts['Wishlist'] || 0);
  const oaCount = (statusCounts['OA Scheduled'] || 0) + (statusCounts['OA Completed'] || 0) + (statusCounts['Interview Scheduled'] || 0) + (statusCounts['Interview Completed'] || 0) + (statusCounts['Offer Received'] || 0);
  const interviewCount = (statusCounts['Interview Scheduled'] || 0) + (statusCounts['Interview Completed'] || 0) + (statusCounts['Offer Received'] || 0);
  const offerCount = statusCounts['Offer Received'] || 0;

  const progressionStages = [
    { 
      stage: 'Total Applied', 
      count: Math.max(appliedCount, 0), 
      rate: totalApplications > 0 ? Math.round((Math.max(appliedCount, 0) / totalApplications) * 100) : 0,
      sublabel: 'of all tracked records'
    },
    { 
      stage: 'OA Stage', 
      count: Math.max(oaCount, 0), 
      rate: appliedCount > 0 ? Math.round((Math.max(oaCount, 0) / appliedCount) * 100) : 0,
      sublabel: 'passed initial screening'
    },
    { 
      stage: 'Interviews', 
      count: Math.max(interviewCount, 0), 
      rate: appliedCount > 0 ? Math.round((Math.max(interviewCount, 0) / appliedCount) * 100) : 0,
      sublabel: 'reached interview rounds'
    },
    { 
      stage: 'Offers Received', 
      count: Math.max(offerCount, 0), 
      rate: appliedCount > 0 ? Math.round((Math.max(offerCount, 0) / appliedCount) * 100) : 0,
      sublabel: 'overall offer conversion'
    },
  ];

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
            {activeTab === 'distribution' ? 'Current Pipeline Distribution' : 'Conversion Progression'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {activeTab === 'distribution'
              ? 'Real-time snapshot of active applications currently in each status.'
              : 'Stage-by-stage progression rates based on active cohort records.'}
          </p>
        </div>

        <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/80 dark:border-stone-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'distribution'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Distribution</span>
          </button>

          <button
            onClick={() => setActiveTab('progression')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'progression'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progression</span>
          </button>
        </div>
      </div>

      {/* View A: Current Distribution Chart */}
      {activeTab === 'distribution' && (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                stroke="#a8a29e" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#a8a29e" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(28, 25, 23, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#f5f5f4',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                itemStyle={{ color: '#f5f5f4' }}
                cursor={{ fill: 'rgba(217, 119, 6, 0.08)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIPELINE_PALETTE[index % PIPELINE_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* View B: Progression Funnel Cards */}
      {activeTab === 'progression' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {progressionStages.map((stage, idx) => (
            <div 
              key={stage.stage} 
              className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Step {idx + 1}
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  {stage.rate}%
                </span>
              </div>

              <div>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  {stage.count} <span className="text-xs font-normal text-stone-500">apps</span>
                </p>
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                  {stage.stage}
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 leading-tight mt-0.5">
                  {stage.sublabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
