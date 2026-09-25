import React from 'react';

interface ProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  total,
  label,
  showPercent = true,
  className = '',
}) => {
  const percent = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Top Text Row */}
      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
        <span className="text-slate-600 font-semibold tracking-tight">
          {label || `${completed} of ${total} tasks`}
        </span>
        {showPercent && (
          <span className="text-[#1E60F2] font-bold text-[13px]">
            {percent}%
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Goal Progress"
        className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-[1px] border border-slate-200/50"
      >
        <div
          className="h-full bg-gradient-to-r from-[#1E60F2] to-[#38BDF8] rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
