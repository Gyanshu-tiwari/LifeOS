import React from 'react';
import { cn } from '../../lib/utils';
import { Compass } from 'lucide-react';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-gray-200/80', className)}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6 pt-4 pb-20 md:pb-6 px-4 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Search */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Filters */}
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Cards list */}
      <div className="space-y-4 pt-2">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-soft-sm border border-gray-100 flex items-center space-x-3.5">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="w-8 h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanOverviewSkeleton() {
  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto w-full">
      {/* Next Action card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-start space-x-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>

      {/* Summary grid */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-soft-sm space-y-2">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Sections & Tasks preview */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3 py-2 border-b border-gray-50 last:border-0">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto w-full">
      {/* Progress card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-3">
        <div className="flex justify-between items-end">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Grouped sections */}
      <div className="space-y-6">
        {[1, 2].map((group) => (
          <div key={group} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-soft-sm space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-10" />
            </div>
            {[1, 2, 3].map((task) => (
              <div key={task} className="flex items-start space-x-3 py-1">
                <Skeleton className="w-5 h-5 rounded mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlacesListSkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto w-full">
      {/* Category tabs */}
      <div className="flex space-x-2 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
        ))}
      </div>

      {/* Place cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-soft-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
            <Skeleton className="w-full sm:w-28 h-36 sm:h-28 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="w-6 h-6 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex space-x-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PackingSkeleton() {
  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto w-full">
      {/* Progress card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-3">
        <div className="flex justify-between items-end">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Sections */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-6">
        {[1, 2].map((sec) => (
          <div key={sec} className="space-y-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-3 py-1.5">
                <Skeleton className="w-5 h-5 rounded shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ItinerarySkeleton() {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4 space-y-6">
      {/* Day tabs */}
      <div className="flex space-x-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-xl" />
        ))}
      </div>

      {/* Day header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>

        {/* Timeline items */}
        <div className="space-y-4 pl-4 border-l-2 border-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 relative pl-4">
              <Skeleton className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col h-full pt-4 pb-20 px-4 max-w-2xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </div>

      <div className="flex flex-col items-center space-y-3 py-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-52" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-4">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-4">
        <Skeleton className="h-4 w-32" />
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MapLoadingSkeleton({ className = 'h-72 md:h-96' }: { className?: string }) {
  return (
    <div className={cn('relative bg-slate-100 w-full overflow-hidden flex flex-col items-center justify-center text-lifeos-muted', className)}>
      <div className="animate-spin text-lifeos-blue mb-2">
        <Compass size={32} />
      </div>
      <p className="text-xs font-semibold text-lifeos-navy">Rendering Map & Route...</p>
      <p className="text-[11px] text-lifeos-subtle mt-0.5">Fetching verified stops and road coordinates</p>
    </div>
  );
}
