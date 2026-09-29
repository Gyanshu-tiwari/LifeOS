import React from 'react';
import { Compass, Search, Zap, FileUp } from 'lucide-react';

interface QuickActionsProps {
  onActionClick?: (actionId: string) => void;
  className?: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionClick,
  className = '',
}) => {
  const actions: ActionItem[] = [
    {
      id: 'plan',
      title: 'Plan',
      description: 'Create a plan',
      icon: <Compass className="w-5 h-5" />,
      bgClass: 'bg-[#F0F6FF]',
      borderClass: 'border-[#DBEAFE]',
      iconBgClass: 'bg-[#DBEAFE]/80',
      iconColorClass: 'text-[#1E60F2]',
    },
    {
      id: 'research',
      title: 'Research',
      description: 'Find information',
      icon: <Search className="w-5 h-5" />,
      bgClass: 'bg-[#FAF5FF]',
      borderClass: 'border-[#F3E8FF]',
      iconBgClass: 'bg-[#F3E8FF]/80',
      iconColorClass: 'text-[#9333EA]',
    },
    {
      id: 'take-action',
      title: 'Take Action',
      description: 'Get things done',
      icon: <Zap className="w-5 h-5" />,
      bgClass: 'bg-[#F0FDF4]',
      borderClass: 'border-[#DCFCE7]',
      iconBgClass: 'bg-[#DCFCE7]/80',
      iconColorClass: 'text-[#16A34A]',
    },
    {
      id: 'upload',
      title: 'Upload',
      description: 'Add documents',
      icon: <FileUp className="w-5 h-5" />,
      bgClass: 'bg-[#FFFBEB]',
      borderClass: 'border-[#FEF3C7]',
      iconBgClass: 'bg-[#FEF3C7]/80',
      iconColorClass: 'text-[#D97706]',
    },
  ];

  return (
    <section className={`w-full ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onActionClick && onActionClick(item.id)}
            className={`w-full p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all duration-150 hover:shadow-soft active:scale-[0.98] ${item.bgClass} ${item.borderClass}`}
          >
            {/* Action Icon Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${item.iconBgClass} ${item.iconColorClass}`}
            >
              {item.icon}
            </div>

            {/* Label and Subtitle */}
            <div className="flex flex-col min-w-0">
              <span className="text-[13.5px] font-bold text-slate-800 tracking-tight leading-snug">
                {item.title}
              </span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight">
                {item.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
