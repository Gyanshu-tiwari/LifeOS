import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans';
import { queryKeys } from './queryKeys';
import { ItineraryItem } from '../types';

export function useItinerary(planId?: string) {
  return useQuery<ItineraryItem[]>({
    queryKey: queryKeys.plans.itinerary(planId || ''),
    queryFn: () => plansApi.getItinerary(planId!),
    enabled: Boolean(planId),
  });
}

export function useUpdateItineraryItem(planId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: { status?: string; start_at?: string; end_at?: string; title?: string; description?: string };
    }) => plansApi.updateItineraryItem(planId!, itemId, payload),
    onSuccess: () => {
      if (planId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.itinerary(planId) });
      }
    },
  });
}
