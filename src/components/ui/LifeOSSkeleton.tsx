import React from 'react';

export interface LifeOSSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const LifeOSSkeleton: React.FC<LifeOSSkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-slate-200/80 rounded-2xl';

  const variantStyles = {
    text: 'h-4 rounded-md',
    rectangular: 'rounded-2xl',
    circular: 'rounded-full',
    card: 'h-36 rounded-3xl',
  };

  const inlineStyle: React.CSSProperties = {
    width: width,
    height: height,
    ...style,
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={inlineStyle}
      {...props}
    />
  );
};

export const LifeOSCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-4"
        >
          <div className="flex items-center justify-between">
            <LifeOSSkeleton variant="circular" width={40} height={40} />
            <LifeOSSkeleton variant="rectangular" width={70} height={24} className="rounded-full" />
          </div>
          <LifeOSSkeleton variant="text" width="65%" height={20} />
          <LifeOSSkeleton variant="text" width="90%" height={14} />
          <LifeOSSkeleton variant="text" width="80%" height={14} />
          <div className="pt-3 border-t border-slate-100 flex justify-between">
            <LifeOSSkeleton variant="text" width="40%" height={16} />
            <LifeOSSkeleton variant="text" width="25%" height={16} />
          </div>
        </div>
      ))}
    </div>
  );
};
