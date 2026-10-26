import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, CheckCircle2, ChevronRight, Compass } from 'lucide-react';
import { useActivities, useActivityPlans, usePlanProgress } from '../hooks';
import { Activity } from '../types';
import { cn } from '../lib/utils';
import { DashboardSkeleton } from '../components/ui/Skeletons';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { NotificationBellButton } from '../components/notifications/NotificationPanel';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const { data: activitiesData, isLoading, isError, error, refetch } = useActivities({ limit: 50 });
  const allActivities = activitiesData?.items || [];

  // Filter activities by search & status
  const filteredActivities = allActivities.filter((activity) => {
    const matchesSearch =
      activity.title?.toLowerCase().includes(search.toLowerCase()) ||
      activity.raw_intent?.toLowerCase().includes(search.toLowerCase()) ||
      activity.destination_text?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'active') return activity.status !== 'COMPLETED';
    if (filter === 'completed') return activity.status === 'COMPLETED';
    return true;
  });

  const activeActivities = filteredActivities.filter((a) => a.status !== 'COMPLETED');
  const completedActivities = filteredActivities.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg pt-4 pb-6 max-w-5xl mx-auto w-full px-4">
      {/* Header */}
      <header className="mb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-lifeos-navy tracking-tight">My Plans</h1>
          <p className="text-xs text-lifeos-muted mt-0.5">Track and manage your journeys and daily projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationBellButton />
          <button
            onClick={() => navigate('/create')}
            className="bg-lifeos-blue text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-soft-sm hover:bg-lifeos-accent transition active:scale-95"
          >
            <Plus size={16} />
            <span>New Plan</span>
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="mb-4">
        <div className="relative bg-white rounded-xl shadow-soft-sm border border-gray-100 flex items-center p-3 focus-within:border-lifeos-blue transition">
          <Search size={18} className="text-lifeos-subtle shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans by title or location..."
            className="flex-1 ml-3 bg-transparent outline-none text-sm text-lifeos-dark placeholder:text-lifeos-subtle"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-lifeos-subtle hover:text-lifeos-navy px-2 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        <FilterButton
          label={`All (${allActivities.length})`}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterButton
          label={`Active (${allActivities.filter((a) => a.status !== 'COMPLETED').length})`}
          active={filter === 'active'}
          onClick={() => setFilter('active')}
        />
        <FilterButton
          label={`Completed (${allActivities.filter((a) => a.status === 'COMPLETED').length})`}
          active={filter === 'completed'}
          onClick={() => setFilter('completed')}
        />
      </div>

      {/* Main Content: Loading / Error / Empty / Data */}
      <div className="flex-1 space-y-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <ErrorState
            error={error}
            fallbackMessage="Failed to load your activities."
            onRetry={() => refetch()}
          />
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={search ? 'No Matching Plans' : 'No Plans Yet'}
            description={
              search
                ? `No plans found matching "${search}". Try searching for a different destination or title.`
                : 'Create your first real-world activity to generate AI routes, packing checklists, and verified places.'
            }
            actionLabel="Create a Plan"
            onAction={() => navigate('/create')}
          />
        ) : (
          <>
            {/* Active Plans Section */}
            {(filter === 'all' || filter === 'active') && activeActivities.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-lifeos-navy">
                    Active Plans ({activeActivities.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeActivities.map((activity) => (
                    <DashboardPlanCard key={activity.id} activity={activity} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Plans Section */}
            {(filter === 'all' || filter === 'completed') && completedActivities.length > 0 && (
              <section className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-lifeos-navy">
                    Completed Plans ({completedActivities.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {completedActivities.map((activity) => (
                    <DashboardPlanCard key={activity.id} activity={activity} isCompleted />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DashboardPlanCard({ activity, isCompleted }: { activity: Activity; isCompleted?: boolean }) {
  const navigate = useNavigate();
  const { data: plans } = useActivityPlans(activity.id);
  const plan = plans?.[0];
  const { data: progress } = usePlanProgress(plan?.id);

  const percent = progress?.completion_percent ?? (isCompleted ? 100 : 0);

  const handleClick = () => {
    if (plan) {
      navigate(`/plans/${plan.id}`);
    } else {
      navigate(`/plans/${activity.id}/generating`, { state: { activityId: activity.id } });
    }
  };

  const subtitle = [
    activity.origin_text && activity.destination_text
      ? `${activity.origin_text} → ${activity.destination_text}`
      : activity.activity_type,
    activity.travel_mode ? activity.travel_mode.toLowerCase() : null,
    progress ? `${progress.completed_tasks}/${progress.total_tasks} tasks` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'bg-white rounded-2xl p-4 flex items-center space-x-3.5 shadow-soft-sm border border-gray-100 cursor-pointer transition hover:border-blue-200 hover:shadow-soft active:scale-[0.99] select-none',
        isCompleted && 'opacity-85'
      )}
    >
      <div className="w-12 h-12 bg-blue-50 text-lifeos-blue rounded-xl flex items-center justify-center shrink-0">
        {isCompleted ? (
          <CheckCircle2 size={24} className="text-emerald-500" />
        ) : (
          <MapPin size={22} className="text-lifeos-blue" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={cn('text-sm font-bold text-lifeos-navy truncate', isCompleted && 'line-through text-gray-500')}>
          {activity.title}
        </h4>
        <p className="text-xs text-lifeos-muted truncate mt-0.5">{subtitle}</p>
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className={cn('h-full transition-all duration-500', isCompleted ? 'bg-emerald-500' : 'bg-lifeos-blue')}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="text-xs font-bold text-lifeos-navy flex items-center space-x-1 shrink-0 ml-2">
        <span>{Math.round(percent)}%</span>
        <ChevronRight size={14} className="text-gray-300" />
      </div>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all border',
        active
          ? 'bg-lifeos-navy text-white border-lifeos-navy shadow-soft-sm'
          : 'bg-white text-lifeos-navy border-gray-200 hover:bg-gray-50'
      )}
    >
      {label}
    </button>
  );
}
