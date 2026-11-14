import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  highlight?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
}: MetricCardProps) {
  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        highlight
          ? 'bg-gradient-to-br from-amber-500/10 via-white dark:via-stone-900 to-amber-500/5 border-amber-500/30 shadow-xs'
          : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            highlight
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
          {value}
        </span>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.value === 0
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                : trend.positive ?? trend.value > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {trend.value > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>
              {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
            </span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
