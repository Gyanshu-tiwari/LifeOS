import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText = 'View All →',
  onActionClick,
  className = '',
}) => {
  return (
    <div className={`w-full flex items-center justify-between mb-3 px-0.5 ${className}`}>
      <h2 className="text-[17px] font-bold text-[#0B192C] tracking-tight">
        {title}
      </h2>
      {actionText && (
        <button
          type="button"
          onClick={onActionClick}
          className="text-[13px] font-semibold text-[#1E60F2] hover:text-blue-700 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>{actionText.replace('→', '').trim()}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
