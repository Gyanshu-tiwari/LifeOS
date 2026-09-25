import React from 'react';
import { Check } from 'lucide-react';
import { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  const isCompleted = task.isCompleted;

  const getDueBadgeStyle = (label: string) => {
    switch (label.toLowerCase()) {
      case 'today':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'tomorrow':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200/80';
    }
  };

  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`group w-full p-3.5 rounded-2xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer select-none ${
        isCompleted
          ? 'bg-slate-50/70 border-slate-200/60 opacity-75'
          : 'bg-white border-slate-200/90 shadow-soft-sm hover:shadow-soft active:scale-[0.99]'
      }`}
    >
      {/* Interactive Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={`Mark "${task.title}" as ${isCompleted ? 'incomplete' : 'completed'}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
          isCompleted
            ? 'bg-[#1E60F2] border-[#1E60F2] text-white shadow-sm'
            : 'border-slate-300 hover:border-[#1E60F2] bg-white group-hover:bg-blue-50/40'
        }`}
      >
        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`text-[14px] font-semibold tracking-tight transition-all ${
              isCompleted
                ? 'line-through text-slate-400'
                : 'text-slate-800'
            }`}
          >
            {task.title}
          </h4>

          {/* Date / Status Badge */}
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex-shrink-0 ${getDueBadgeStyle(
              task.dueLabel
            )}`}
          >
            {task.dueLabel}
          </span>
        </div>

        {/* Supporting text */}
        <p
          className={`text-[12.5px] mt-0.5 leading-snug transition-all ${
            isCompleted ? 'text-slate-400 line-through' : 'text-slate-500'
          }`}
        >
          {task.description}
        </p>
      </div>
    </div>
  );
};
