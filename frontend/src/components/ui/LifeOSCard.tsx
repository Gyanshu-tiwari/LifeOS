import React from 'react';

export interface LifeOSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'subtle';
  hoverable?: boolean;
}

export const LifeOSCard: React.FC<LifeOSCardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200/90 shadow-soft',
    elevated: 'bg-white border border-slate-200/80 shadow-soft-md',
    glass: 'bg-white/85 backdrop-blur-md border border-white/60 shadow-soft',
    subtle: 'bg-slate-50/80 border border-slate-200/60 shadow-none',
  };

  const hoverStyles = hoverable
    ? 'hover:shadow-soft-md hover:border-slate-300 transition-all duration-200 cursor-pointer active:scale-[0.995]'
    : '';

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
