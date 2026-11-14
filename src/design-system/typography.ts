/**
 * @file typography.ts
 * InternTrack AI Typography System
 * Built on Geist Variable font with WCAG AA compliance targets.
 */

export const typography = {
  // Headings
  display: 'font-sans text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100',
  h1: 'font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100',
  h2: 'font-sans text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100',
  h3: 'font-sans text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100',
  h4: 'font-sans text-base font-semibold text-stone-900 dark:text-stone-100',
  
  // Body
  bodyLarge: 'font-sans text-base text-stone-700 dark:text-stone-300 leading-relaxed',
  body: 'font-sans text-sm text-stone-700 dark:text-stone-300 leading-normal',
  bodyMuted: 'font-sans text-sm text-stone-500 dark:text-stone-400 leading-normal',
  bodySmall: 'font-sans text-xs text-stone-600 dark:text-stone-400 leading-normal',
  caption: 'font-sans text-xs text-stone-400 dark:text-stone-500',
  
  // Labels & Tags
  label: 'font-sans text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400',
  labelSmall: 'font-sans text-[11px] font-medium text-stone-600 dark:text-stone-300',
  
  // Numbers / Metrics (Tabular lining figures)
  metricHero: 'font-sans text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums',
  metricCard: 'font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums',
  metricSmall: 'font-sans text-sm font-semibold text-stone-900 dark:text-stone-100 tabular-nums',
  
  // Interactive / Links
  link: 'font-sans text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors',
  button: 'font-sans text-sm font-medium tracking-normal',
  buttonSmall: 'font-sans text-xs font-medium tracking-normal',
  
  // Code / Monospace
  mono: 'font-mono text-xs text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded',
} as const;
