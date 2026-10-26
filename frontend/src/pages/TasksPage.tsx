import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Plus, Loader2, ListTodo } from 'lucide-react';
import { Plan, Task, PlanSection } from '../types';
import { usePlanTasks, usePlanSections, useCompleteTask, useReopenTask, useCreateTask } from '../hooks';
import { cn } from '../lib/utils';
import { TaskListSkeleton } from '../components/ui/Skeletons';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

export default function TasksPage() {
  const { plan } = useOutletContext<{ plan: Plan }>();
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  const { addToast } = useToast();

  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch } = usePlanTasks(plan.id);
  const { data: sections = [] } = usePlanSections(plan.id);

  const completeMutation = useCompleteTask(plan.id);
  const reopenMutation = useReopenTask(plan.id);

  const toggleTask = (task: Task) => {
    if (task.status === 'COMPLETED') {
      reopenMutation.mutate(task.id, {
        onSuccess: () => {
          addToast({
            title: 'Task Reopened',
            message: `"${task.title}" marked as to-do.`,
            type: 'info',
            duration: 2500,
          });
        },
        onError: () => {
          addToast({
            title: 'Action Failed',
            message: 'Could not update task status.',
            type: 'error',
          });
        },
      });
    } else {
      completeMutation.mutate(task.id, {
        onSuccess: () => {
          addToast({
            title: 'Task Completed',
            message: `"${task.title}" marked as done.`,
            type: 'success',
            duration: 2500,
          });
        },
        onError: () => {
          addToast({
            title: 'Action Failed',
            message: 'Could not update task status.',
            type: 'error',
          });
        },
      });
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by section
  const sectionMap = new Map<string, PlanSection>();
  sections.forEach((s) => sectionMap.set(s.id, s));

  // Determine section buckets
  const groupedTasks: { sectionTitle: string; sectionId: string; tasks: Task[] }[] = [];

  if (sections.length > 0) {
    sections.forEach((sec) => {
      const secTasks = tasks.filter((t) => t.plan_section_id === sec.id);
      groupedTasks.push({
        sectionTitle: sec.title,
        sectionId: sec.id,
        tasks: secTasks,
      });
    });
    // Any tasks with unknown section
    const orphanTasks = tasks.filter((t) => !sectionMap.has(t.plan_section_id));
    if (orphanTasks.length > 0) {
      groupedTasks.push({
        sectionTitle: 'Additional Tasks',
        sectionId: orphanTasks[0].plan_section_id || 'general',
        tasks: orphanTasks,
      });
    }
  } else {
    // If no sections in DB yet, group all into one
    groupedTasks.push({
      sectionTitle: 'All Tasks',
      sectionId: 'default',
      tasks,
    });
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      {/* Progress Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="font-bold text-lifeos-navy text-base">Checklist & Tasks</h2>
            <p className="text-xs text-lifeos-muted mt-0.5">
              {completedTasks} of {totalTasks} completed
            </p>
          </div>
          <span className="text-xl font-bold text-lifeos-navy">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
          <div
            className="bg-lifeos-blue h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
        <FilterButton
          label={`All (${totalTasks})`}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterButton
          label={`To Do (${totalTasks - completedTasks})`}
          active={filter === 'todo'}
          onClick={() => setFilter('todo')}
        />
        <FilterButton
          label={`Done (${completedTasks})`}
          active={filter === 'done'}
          onClick={() => setFilter('done')}
        />
      </div>

      {/* Loading & Error States */}
      {tasksLoading ? (
        <TaskListSkeleton />
      ) : tasksError ? (
        <ErrorState
          error={tasksError}
          fallbackMessage="We couldn't retrieve tasks for this plan."
          onRetry={() => refetch()}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No Tasks Yet"
          description="Tasks generated for this plan will appear here. You can also add your own tasks below."
        />
      ) : (
        /* Task Sections */
        <div className="space-y-6">
          {groupedTasks.map((group) => {
            const sectionTasks = group.tasks.filter((t) => {
              if (filter === 'todo') return t.status !== 'COMPLETED';
              if (filter === 'done') return t.status === 'COMPLETED';
              return true;
            });

            if (sectionTasks.length === 0 && filter !== 'all') return null;

            return (
              <div
                key={group.sectionId}
                className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-soft-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-lifeos-navy">{group.sectionTitle}</h3>
                  <span className="text-xs text-lifeos-muted font-semibold bg-gray-50 px-2 py-0.5 rounded-md">
                    {sectionTasks.filter((t) => t.status === 'COMPLETED').length}/{sectionTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {sectionTasks.map((task) => {
                    const isCompleted = task.status === 'COMPLETED';
                    const isPending =
                      (completeMutation.isPending && completeMutation.variables === task.id) ||
                      (reopenMutation.isPending && reopenMutation.variables === task.id);

                    return (
                      <div
                        key={task.id}
                        role="checkbox"
                        aria-checked={isCompleted}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            if (!isPending) toggleTask(task);
                          }
                        }}
                        className="flex items-start space-x-3 cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-gray-50/80 transition select-none"
                        onClick={() => {
                          if (!isPending) toggleTask(task);
                        }}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md mt-0.5 shrink-0 flex items-center justify-center transition-all border shadow-sm',
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 bg-white group-hover:border-lifeos-blue',
                            isPending && 'opacity-50 animate-pulse'
                          )}
                        >
                          {isCompleted && <Check size={13} strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium transition-colors leading-snug',
                              isCompleted ? 'text-gray-400 line-through' : 'text-lifeos-navy'
                            )}
                          >
                            {task.title}
                          </p>
                          {task.description && !isCompleted && (
                            <p className="text-xs text-lifeos-muted mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          {task.priority === 'HIGH' && !isCompleted && (
                            <span className="inline-block mt-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                              Essential
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Task inside section */}
                <CreateTaskForm sectionId={group.sectionId} planId={plan.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateTaskForm({ sectionId, planId }: { sectionId: string; planId: string }) {
  const [title, setTitle] = useState('');
  const createMutation = useCreateTask(planId);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      createMutation.mutate(
        { plan_section_id: sectionId, title: title.trim() },
        {
          onSuccess: () => {
            setTitle('');
            addToast({
              title: 'Task Added',
              message: 'Your new task has been recorded.',
              type: 'success',
              duration: 2500,
            });
          },
          onError: () => {
            addToast({
              title: 'Could Not Add Task',
              message: 'Please try again.',
              type: 'error',
            });
          },
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2 border-t border-gray-100 pt-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
        className="flex-1 bg-gray-50 px-3.5 py-2 rounded-xl text-xs font-medium border border-gray-200 outline-none focus:border-lifeos-blue transition text-lifeos-navy"
        disabled={createMutation.isPending}
      />
      <button
        type="submit"
        disabled={!title.trim() || createMutation.isPending}
        className="bg-lifeos-navy text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-lifeos-blue transition disabled:opacity-50 flex items-center space-x-1 active:scale-95 shadow-soft-sm"
      >
        {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
        <span>Add</span>
      </button>
    </form>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all border',
        active
          ? 'bg-lifeos-navy text-white border-lifeos-navy shadow-soft-sm'
          : 'bg-white text-lifeos-navy border-gray-200 hover:bg-gray-50'
      )}
    >
      {label}
    </button>
  );
}
