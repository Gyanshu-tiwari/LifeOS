import React from 'react';
import { LucideIcon } from 'lucide-react';
import { LifeOSButton } from './LifeOSButton';

export interface LifeOSEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const LifeOSEmptyState: React.FC<LifeOSEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-soft text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-3xl bg-blue-50 text-[#1E60F2] flex items-center justify-center border border-blue-100 shadow-soft-sm">
        <Icon className="w-7 h-7" strokeWidth={1.8} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <LifeOSButton onClick={onAction} variant="primary" size="md">
            {actionLabel}
          </LifeOSButton>
        </div>
      )}
    </div>
  );
};
