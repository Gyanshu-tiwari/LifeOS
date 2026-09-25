import React, { useState } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  ListTodo,
} from 'lucide-react';
import { TaskItem } from '../components/dashboard/TaskItem';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSModal } from '../components/ui/LifeOSModal';
import { LifeOSEmptyState } from '../components/ui/LifeOSEmptyState';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const TasksPage: React.FC = () => {
  const { tasks, toggleTask, addTask, deleteTask, activeGoal } = useLifeOS();

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueLabel, setNewDueLabel] = useState('Today');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('Housing');

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    if (activeFilter === 'completed') return t.isCompleted;
    if (activeFilter === 'today') return !t.isCompleted && t.dueLabel.toLowerCase() === 'today';
    if (activeFilter === 'upcoming') return !t.isCompleted && t.dueLabel.toLowerCase() !== 'today';
    return true;
  });

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const pendingCount = tasks.length - completedCount;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: '2026-08-15',
      dueLabel: newDueLabel,
      priority: newPriority,
      category: newCategory,
      relatedAgent: 'planning',
    });

    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Task Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Execution Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Actionable items coordinated across your active goals and specialized agents.
          </p>
        </div>

        <LifeOSButton
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Custom Task
        </LifeOSButton>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Tasks</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{tasks.length}</p>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft">
          <span className="text-[11px] font-bold text-blue-500 uppercase">Pending</span>
          <p className="text-2xl font-extrabold text-[#1E60F2] mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Completed</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</p>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Due Today</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {tasks.filter((t) => !t.isCompleted && t.dueLabel.toLowerCase() === 'today').length}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-soft">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                activeFilter === tab
                  ? 'bg-blue-50 text-[#1E60F2] border border-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20"
            />
          </div>
        </div>
      </div>

      {/* Task List or Empty State */}
      {filteredTasks.length === 0 ? (
        <LifeOSEmptyState
          icon={ListTodo}
          title="All caught up!"
          description="No tasks match the active filters. Keep progressing toward your goals."
          actionLabel="Add a Task"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 group bg-white rounded-2xl p-1 border border-transparent hover:border-slate-200"
            >
              <div className="flex-1">
                <TaskItem task={task} onToggle={toggleTask} />
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mr-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <LifeOSModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Actionable Task"
        subtitle="Planning Agent will index this task into the active goal critical path."
        footer={
          <>
            <LifeOSButton
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </LifeOSButton>
            <LifeOSButton
              variant="primary"
              size="sm"
              onClick={handleCreateTask}
            >
              Add Task
            </LifeOSButton>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="E.g. Reserve train ticket to Lucknow"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Supporting Note
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="E.g. Charbagh station arrival by 10 AM"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Due Timeline
              </label>
              <select
                value={newDueLabel}
                onChange={(e) => setNewDueLabel(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              >
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="This Week">This Week</option>
                <option value="Aug 20">Aug 20</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </form>
      </LifeOSModal>
    </div>
  );
};
