import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeOS } from '../context/LifeOSContext';
import {
  Target,
  Plus,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { ProgressBar } from '../components/dashboard/ProgressBar';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSEmptyState } from '../components/ui/LifeOSEmptyState';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const GoalsPage: React.FC = () => {
  const { goals, setActiveGoalId } = useLifeOS();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'In Progress' | 'Planned' | 'Completed'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'title'>('deadline');

  const filteredGoals = goals
    .filter((g) => {
      const matchesFilter = filter === 'all' || g.status === filter;
      const matchesSearch =
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase()) ||
        g.location.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'progress') {
        return (b.completedTasks / b.totalTasks) - (a.completedTasks / a.totalTasks);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return a.deadline.localeCompare(b.deadline);
    });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Goal Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            My Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-world objectives coordinated by LIFEOS specialized multi-agent workflows.
          </p>
        </div>

        <LifeOSButton
          onClick={() => navigate('/goals/new')}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Goal
        </LifeOSButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-soft">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'In Progress', 'Planned', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === tab
                  ? 'bg-blue-50 text-[#1E60F2] border border-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab === 'all' ? 'All Goals' : tab}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="progress">Sort by Progress</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search goals or cities..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20"
            />
          </div>
        </div>
      </div>

      {/* Goals Content */}
      {filteredGoals.length === 0 ? (
        <LifeOSEmptyState
          icon={Target}
          title="No goals found"
          description={
            search
              ? `No goals matched your search query "${search}". Try adjusting filters.`
              : 'You have no goals under this category. Start something you want to accomplish!'
          }
          actionLabel="Create a Goal"
          onAction={() => navigate('/goals/new')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const percent = Math.round((goal.completedTasks / goal.totalTasks) * 100);

            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Card Banner */}
                  <div className="relative h-32 bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-bold border border-white/50 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {goal.status}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium border border-white/20">
                        {goal.category}
                      </span>
                    </div>
                    <h3 className="text-white text-lg font-bold tracking-tight drop-shadow-sm">
                      {goal.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {goal.description}
                    </p>

                    {/* Constraint Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E60F2] text-[11px] font-semibold border border-blue-100">
                        {goal.constraints.budget}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100">
                        {goal.constraints.maxCommute}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        {goal.constraints.vehicle}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <ProgressBar
                      completed={goal.completedTasks}
                      total={goal.totalTasks}
                      label={`${goal.completedTasks} of ${goal.totalTasks} tasks complete (${percent}%)`}
                    />

                    {/* Next Action Box */}
                    {goal.nextAction && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-50/50 border border-amber-200/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                            Next Recommended Step
                          </span>
                          <span className="font-semibold text-slate-800">
                            {goal.nextAction}
                          </span>
                        </div>
                        <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 ml-2" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {goal.location}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {goal.deadline}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveGoalId(goal.id);
                        navigate(`/goals/${goal.id}/plan`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white transition-colors"
                    >
                      Plan
                    </button>
                    <LifeOSButton
                      onClick={() => {
                        setActiveGoalId(goal.id);
                        navigate(`/goals/${goal.id}`);
                      }}
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Open Goal
                    </LifeOSButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
