import React from 'react';

export interface LifeOSBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'teal';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const LifeOSBadge: React.FC<LifeOSBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-[#1E60F2] border-blue-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80',
  };

  const pulseColors = {
    primary: 'bg-[#1E60F2]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10.5px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseColors[variant]}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
