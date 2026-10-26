import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Package } from 'lucide-react';
import { Plan, PackingItem } from '../types';
import { usePacking, useTogglePackingItem } from '../hooks';
import { cn } from '../lib/utils';
import { PackingSkeleton } from '../components/ui/Skeletons';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

export default function PackingPage() {
  const { plan } = useOutletContext<{ plan: Plan }>();
  const { addToast } = useToast();

  const { data: items = [], isLoading, error, refetch } = usePacking(plan.id);
  const toggleMutation = useTogglePackingItem(plan.id);

  const total = items.length;
  const packedCount = items.filter((i) => Boolean(i.checked_at)).length;
  const progressPercent = total > 0 ? Math.round((packedCount / total) * 100) : 0;

  const essential = items.filter((i) => i.priority === 'ESSENTIAL');
  const recommended = items.filter((i) => i.priority === 'RECOMMENDED');
  const optional = items.filter((i) => i.priority === 'OPTIONAL');

  const handleToggle = (item: PackingItem) => {
    const isCurrentlyPacked = Boolean(item.checked_at);
    toggleMutation.mutate(
      {
        itemId: item.id,
        checked: !isCurrentlyPacked,
      },
      {
        onSuccess: () => {
          addToast({
            title: isCurrentlyPacked ? 'Item Unchecked' : 'Item Packed',
            message: `${item.item} marked as ${isCurrentlyPacked ? 'unpacked' : 'packed'}.`,
            type: isCurrentlyPacked ? 'info' : 'success',
            duration: 2000,
          });
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-12">
      {/* Progress Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="font-bold text-lifeos-navy text-base">Packing Checklist</h2>
            <p className="text-xs text-lifeos-muted mt-0.5">
              {packedCount} of {total} items packed
            </p>
          </div>
          <span className="text-xl font-bold text-lifeos-navy">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <PackingSkeleton />
      ) : error ? (
        <ErrorState
          error={error}
          fallbackMessage="We couldn't retrieve the packing list for this plan."
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Packing Items"
          description="Essential and recommended gear for this plan will appear here automatically."
        />
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft-sm space-y-6">
          <PackingSection
            title="Essential Items"
            priorityBadge="Required"
            items={essential}
            onToggle={handleToggle}
            isPendingId={toggleMutation.variables?.itemId}
          />
          {essential.length > 0 && recommended.length > 0 && (
            <div className="h-px bg-gray-100" />
          )}
          <PackingSection
            title="Recommended"
            priorityBadge="Helpful"
            items={recommended}
            onToggle={handleToggle}
            isPendingId={toggleMutation.variables?.itemId}
          />
          {(essential.length > 0 || recommended.length > 0) && optional.length > 0 && (
            <div className="h-px bg-gray-100" />
          )}
          <PackingSection
            title="Optional"
            priorityBadge="Optional"
            items={optional}
            onToggle={handleToggle}
            isPendingId={toggleMutation.variables?.itemId}
          />
        </div>
      )}
    </div>
  );
}

function PackingSection({
  title,
  priorityBadge,
  items,
  onToggle,
  isPendingId,
}: {
  title: string;
  priorityBadge: string;
  items: PackingItem[];
  onToggle: (item: PackingItem) => void;
  isPendingId?: string;
}) {
  if (items.length === 0) return null;
  const packedCount = items.filter((i) => Boolean(i.checked_at)).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lifeos-navy text-sm">
          {title} ({packedCount}/{items.length})
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-lifeos-muted bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
          {priorityBadge}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isPacked = Boolean(item.checked_at);
          const isPending = isPendingId === item.id;

          return (
            <div
              key={item.id}
              role="checkbox"
              aria-checked={isPacked}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  if (!isPending) onToggle(item);
                }
              }}
              className="flex items-start space-x-3 cursor-pointer group p-1.5 -mx-1.5 rounded-xl hover:bg-gray-50/80 transition select-none"
              onClick={() => {
                if (!isPending) onToggle(item);
              }}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-md mt-0.5 shrink-0 flex items-center justify-center transition-all border shadow-sm',
                  isPacked
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-gray-300 bg-white group-hover:border-lifeos-blue',
                  isPending && 'opacity-60 animate-pulse'
                )}
              >
                {isPacked && <Check size={13} strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'text-sm font-medium transition-colors block leading-snug',
                    isPacked ? 'text-gray-400 line-through' : 'text-lifeos-navy'
                  )}
                >
                  {item.item}
                </span>
                {item.reason && !isPacked && (
                  <p className="text-xs text-lifeos-muted mt-0.5 leading-relaxed">{item.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
