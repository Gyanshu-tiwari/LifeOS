import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface LifeOSPageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'teal';
    icon?: LucideIcon;
  };
  actions?: React.ReactNode;
  className?: string;
}

export const LifeOSPageHeader: React.FC<LifeOSPageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 ${className}`}
    >
      <div className="space-y-1">
        {badge && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E60F2] border border-blue-200/80 inline-flex items-center gap-1">
              {badge.icon && <badge.icon className="w-3.5 h-3.5" />}
              <span>{badge.text}</span>
            </span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
