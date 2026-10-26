import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-3xl p-8 border border-gray-100 shadow-soft-sm text-center max-w-md mx-auto my-4 flex flex-col items-center',
        className
      )}
    >
      <div className="w-14 h-14 bg-gray-50 text-lifeos-subtle rounded-2xl flex items-center justify-center mb-4 border border-gray-100/80 shadow-soft-sm">
        <Icon size={26} strokeWidth={1.8} />
      </div>

      <h3 className="text-base font-bold text-lifeos-navy mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-lifeos-muted leading-relaxed mb-5 max-w-xs">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-lifeos-blue text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm hover:bg-lifeos-accent transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
