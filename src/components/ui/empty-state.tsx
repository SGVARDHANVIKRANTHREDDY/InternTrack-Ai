import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-xs flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center mb-3.5 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      
      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
        {title}
      </h3>
      
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2.5 mt-5">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}

          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-xs hover:shadow flex items-center gap-1.5"
            >
              {action.icon && <action.icon className="w-3.5 h-3.5" />}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
