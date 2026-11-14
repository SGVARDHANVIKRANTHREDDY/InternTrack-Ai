import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { format } from 'date-fns';
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  Target, 
  Compass, 
  AlertTriangle, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface CareerInsightsCardProps {
  insights: any;
  isLoading: boolean;
}

export const CareerInsightsCard: React.FC<CareerInsightsCardProps> = ({ insights, isLoading }) => {
  const queryClient = useQueryClient();

  const generateInsightsMutation = useMutation({
    mutationFn: () => apiRequest('/analytics/ai-insights', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  const parsedRecommendations: string[] = insights?.recommendations
    ? typeof insights.recommendations === 'string'
      ? JSON.parse(insights.recommendations)
      : insights.recommendations
    : [];

  return (
    <div className="bg-gradient-to-br from-amber-500/[0.04] via-stone-50/50 to-amber-500/[0.02] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-900 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-6 shadow-xs relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                AI Career Performance Coach
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                PRO
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Pattern analysis across job portals, interview conversions, and application outcomes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {insights?.createdAt && (
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              Analyzed {format(new Date(insights.createdAt), 'MMM d, h:mm a')}
            </span>
          )}
          <button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-all shadow-xs hover:shadow disabled:opacity-60"
          >
            {generateInsightsMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{insights ? 'Re-Analyze' : 'Analyze Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400 dark:text-stone-500">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
          <span className="text-xs">Synthesizing application analytics...</span>
        </div>
      ) : !insights ? (
        <div className="py-10 text-center max-w-md mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            No pipeline insights generated yet
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Run the AI analyzer to detect drop-off bottlenecks, your highest-converting job boards, and prioritized recommendations.
          </p>
          <button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Analyze My Applications Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Signal Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 p-3 rounded-lg text-center">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                Top Sector
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block truncate mt-1">
                {insights.mostSuccessfulIndustry || 'General'}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 p-3 rounded-lg text-center">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                Top Portal
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block truncate mt-1">
                {insights.mostSuccessfulSource || 'Direct'}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 p-3 rounded-lg text-center">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                Drop-off Stage
              </span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block truncate mt-1">
                {insights.mostCommonRejectionStage || 'Initial Screen'}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 p-3 rounded-lg text-center">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                Peak Funnel
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block truncate mt-1" title={insights.highestConversionFunnel}>
                {insights.highestConversionFunnel || 'Application'}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 p-3 rounded-lg text-center">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                Bottleneck
              </span>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block truncate mt-1" title={insights.weakestFunnelStage}>
                {insights.weakestFunnelStage || 'Screening'}
              </span>
            </div>
          </div>

          {/* Action Recommendations */}
          <div className="bg-white/90 dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Prioritized Strategic Actions</span>
            </div>

            <div className="space-y-2">
              {parsedRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
