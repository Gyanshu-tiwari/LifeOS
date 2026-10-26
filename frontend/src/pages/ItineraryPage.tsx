import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Calendar, MapPin } from 'lucide-react';
import { Plan, ItineraryItem } from '../types';
import { useItinerary, useUpdateItineraryItem } from '../hooks/useItinerary';
import { cn } from '../lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { ItinerarySkeleton } from '../components/ui/Skeletons';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

export default function ItineraryPage() {
  const { plan } = useOutletContext<{ plan: Plan }>();
  const [activeDay, setActiveDay] = useState<number>(1);
  const { addToast } = useToast();

  const { data: itineraryItems, isLoading, isError, error, refetch } = useItinerary(plan.id);
  const updateMutation = useUpdateItineraryItem(plan.id);

  const items = itineraryItems || [];

  // Group items by day
  const { dayGroups, availableDays } = useMemo(() => {
    if (items.length === 0) {
      return { dayGroups: new Map<number, ItineraryItem[]>(), availableDays: [1] };
    }

    const itemsWithDates = items.filter((it) => it.start_at && isValid(parseISO(it.start_at)));
    const groups = new Map<number, ItineraryItem[]>();

    if (itemsWithDates.length > 0) {
      const uniqueDates = Array.from(
        new Set(itemsWithDates.map((it) => format(parseISO(it.start_at!), 'yyyy-MM-dd')))
      ).sort();

      const dateToDayIndex = new Map(uniqueDates.map((dateStr, idx) => [dateStr, idx + 1]));

      items.forEach((it) => {
        let dayNum = 1;
        if (it.start_at && isValid(parseISO(it.start_at))) {
          const dStr = format(parseISO(it.start_at), 'yyyy-MM-dd');
          dayNum = dateToDayIndex.get(dStr) || 1;
        } else {
          const match = it.title.match(/Day\s*(\d+)/i);
          if (match) {
            dayNum = parseInt(match[1], 10);
          }
        }

        const existing = groups.get(dayNum) || [];
        existing.push(it);
        groups.set(dayNum, existing);
      });
    } else {
      let foundDayPattern = false;
      items.forEach((it) => {
        const match = it.title.match(/Day\s*(\d+)/i);
        const dayNum = match ? parseInt(match[1], 10) : 1;
        if (match) foundDayPattern = true;
        const existing = groups.get(dayNum) || [];
        existing.push(it);
        groups.set(dayNum, existing);
      });

      if (!foundDayPattern) {
        groups.set(1, items);
      }
    }

    const days = Array.from(groups.keys()).sort((a, b) => a - b);
    return {
      dayGroups: groups,
      availableDays: days.length > 0 ? days : [1],
    };
  }, [items]);

  const currentDay = availableDays.includes(activeDay) ? activeDay : availableDays[0] || 1;
  const currentDayItems = dayGroups.get(currentDay) || [];

  const handleToggleItem = (item: ItineraryItem) => {
    const isCompleted = item.status === 'COMPLETED';
    const newStatus = isCompleted ? 'PENDING' : 'COMPLETED';
    updateMutation.mutate(
      {
        itemId: item.id,
        payload: { status: newStatus },
      },
      {
        onSuccess: () => {
          addToast({
            title: isCompleted ? 'Activity Reopened' : 'Activity Completed',
            message: `"${item.title}" marked as ${isCompleted ? 'pending' : 'completed'}.`,
            type: isCompleted ? 'info' : 'success',
            duration: 2500,
          });
        },
      }
    );
  };

  const formatItemTime = (startAt?: string | null, orderIdx = 0) => {
    if (!startAt) {
      const hour = 9 + orderIdx * 2;
      return `${String(hour).padStart(2, '0')}:00`;
    }
    try {
      const parsed = parseISO(startAt);
      if (isValid(parsed)) {
        return format(parsed, 'HH:mm');
      }
    } catch {
      // ignore
    }
    return '09:00';
  };

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg pb-12">
      {/* Days Filter */}
      {availableDays.length > 1 && (
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-4 py-3 flex space-x-2 overflow-x-auto no-scrollbar border-b border-gray-100 shadow-soft-sm">
          {availableDays.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all border',
                currentDay === day
                  ? 'bg-lifeos-navy text-white border-lifeos-navy shadow-soft-sm'
                  : 'bg-white text-lifeos-navy border-gray-200 hover:bg-gray-50'
              )}
            >
              Day {day}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 p-4 space-y-6 max-w-3xl mx-auto w-full bg-white sm:rounded-2xl sm:mt-4 sm:border sm:border-gray-100 sm:shadow-soft-sm">
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-lifeos-navy">Day {currentDay} Schedule</h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-lifeos-navy rounded-full">
              {currentDayItems.filter((i) => i.status === 'COMPLETED').length} / {currentDayItems.length} completed
            </span>
          </div>
          <p className="text-xs text-lifeos-muted mt-0.5">
            {plan.title || 'Structured Itinerary'}
          </p>
        </header>

        {isLoading ? (
          <ItinerarySkeleton />
        ) : isError ? (
          <ErrorState
            error={error}
            fallbackMessage="We couldn't retrieve the itinerary schedule."
            onRetry={() => refetch()}
          />
        ) : currentDayItems.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Activities Scheduled"
            description={`No activities found for Day ${currentDay}.`}
          />
        ) : (
          /* Timeline */
          <div className="relative border-l-2 border-gray-100 ml-[52px] pb-4">
            {currentDayItems.map((item, i) => {
              const isCompleted = item.status === 'COMPLETED';

              return (
                <div
                  key={item.id || i}
                  onClick={() => handleToggleItem(item)}
                  role="checkbox"
                  aria-checked={isCompleted}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleToggleItem(item);
                    }
                  }}
                  className="relative pl-6 mb-7 last:mb-0 group cursor-pointer select-none"
                  title="Click or press Space to toggle completion"
                >
                  {/* Time label */}
                  <div className="absolute top-0 -left-[64px] w-12 text-right">
                    <span className="text-xs font-bold text-lifeos-navy font-mono">
                      {formatItemTime(item.start_at, i)}
                    </span>
                  </div>

                  {/* Timeline bullet */}
                  <div
                    className={cn(
                      'absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ring-1 transition-all',
                      isCompleted
                        ? 'bg-emerald-500 ring-emerald-500 text-white shadow-sm'
                        : 'bg-white ring-lifeos-blue group-hover:bg-blue-50'
                    )}
                  >
                    {isCompleted && <Check size={8} strokeWidth={4} />}
                  </div>

                  {/* Content card */}
                  <div className="p-3.5 rounded-xl border border-transparent group-hover:border-gray-100 group-hover:bg-gray-50/70 transition-all">
                    <h3
                      className={cn(
                        'text-sm font-bold transition-colors leading-snug',
                        isCompleted ? 'text-gray-400 line-through' : 'text-lifeos-navy'
                      )}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-lifeos-muted mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    {item.place_id && (
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-lifeos-blue font-semibold">
                        <MapPin size={12} />
                        <span>Verified Location</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
