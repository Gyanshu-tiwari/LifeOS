import React, { useEffect } from 'react';
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePlan, useActivity, useActivityPlans } from '../../hooks';
import { PlanOverviewSkeleton } from '../ui/Skeletons';
import { ErrorState } from '../ui/ErrorState';

export default function PlanLayout() {
  const { id: planId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: plan,
    isLoading: planLoading,
    error: planError,
    refetch,
  } = usePlan(planId);

  // If planId was accidentally an activity ID, check if activity plans exist and auto-redirect
  const { data: activityPlans } = useActivityPlans(planError ? planId : undefined);

  useEffect(() => {
    if (planError && activityPlans && activityPlans.length > 0) {
      navigate(`/plans/${activityPlans[0].id}`, { replace: true });
    }
  }, [planError, activityPlans, navigate]);

  // Load parent activity context
  const { data: activity } = useActivity(plan?.activity_id);

  if (planLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-lifeos-bg">
        <div className="h-44 md:h-52 bg-gray-200 animate-pulse" />
        <div className="bg-white border-b border-gray-100 h-12" />
        <div className="p-4 max-w-3xl mx-auto w-full">
          <PlanOverviewSkeleton />
        </div>
      </div>
    );
  }

  if (planError && (!activityPlans || activityPlans.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-lifeos-bg p-4">
        <div className="w-full max-w-md">
          <ErrorState
            error={planError}
            fallbackMessage="We couldn't find this plan or it may have been deleted."
            onRetry={() => refetch()}
          />
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-semibold text-lifeos-blue hover:underline"
            >
              ← Back to all plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  // Build subtitle from activity context
  const subtitle = [
    activity?.origin_text && activity?.destination_text
      ? `${activity.origin_text} → ${activity.destination_text}`
      : null,
    activity?.travel_mode
      ? activity.travel_mode.charAt(0) + activity.travel_mode.slice(1).toLowerCase()
      : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg overflow-x-hidden">
      {/* Cover Image Header */}
      <div className="relative h-40 sm:h-48 md:h-52 bg-gray-900 shrink-0">
        <img
          src="https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80"
          alt=""
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

        {/* Top bar with back button */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between z-10 text-white">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-xs font-semibold transition active:scale-95 border border-white/10"
            title="Back to my plans"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">All Plans</span>
          </button>
        </div>

        {/* Title & subtitle inside cover */}
        <div className="absolute bottom-3 left-4 right-4 z-10">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md line-clamp-2">
            {plan.title}
          </h1>
          {subtitle && (
            <p className="text-white/80 text-xs mt-0.5 drop-shadow-sm font-medium">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Sticky Navigation Tabs (Sticks cleanly below viewport top on scroll) */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-soft-sm">
        <nav
          className="flex space-x-6 px-4 min-w-max max-w-4xl mx-auto overflow-x-auto no-scrollbar"
          aria-label="Plan sub-navigation"
        >
          <TabLink to={`/plans/${planId}`} label="Overview" end />
          <TabLink to={`/plans/${planId}/tasks`} label="Tasks" />
          <TabLink to={`/plans/${planId}/journey`} label="Journey" />
          <TabLink to={`/plans/${planId}/places`} label="Places" />
          <TabLink to={`/plans/${planId}/packing`} label="Packing" />
          <TabLink to={`/plans/${planId}/itinerary`} label="Itinerary" />
        </nav>
      </div>

      {/* Main Content Area (Natural document scroll, no nested scroll trapping) */}
      <div className="flex-1 w-full max-w-4xl mx-auto pb-16">
        <Outlet context={{ plan, activity }} />
      </div>
    </div>
  );
}

function TabLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'whitespace-nowrap py-3 text-xs md:text-sm font-semibold border-b-2 transition-all select-none',
          isActive
            ? 'border-lifeos-blue text-lifeos-blue font-bold'
            : 'border-transparent text-lifeos-subtle hover:text-lifeos-navy'
        )
      }
    >
      {label}
    </NavLink>
  );
}
