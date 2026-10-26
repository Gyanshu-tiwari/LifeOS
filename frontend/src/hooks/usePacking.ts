import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans';
import { queryKeys } from './queryKeys';
import { PackingItem } from '../types';

export function usePacking(planId?: string) {
  return useQuery<PackingItem[]>({
    queryKey: queryKeys.plans.packing(planId || ''),
    queryFn: () => plansApi.getPacking(planId!),
    enabled: Boolean(planId),
  });
}

export function useTogglePackingItem(planId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
      plansApi.togglePackingItem(planId!, itemId, checked),
    onMutate: async ({ itemId, checked }) => {
      if (!planId) return;
      await queryClient.cancelQueries({ queryKey: queryKeys.plans.packing(planId) });
      const previous = queryClient.getQueryData<PackingItem[]>(queryKeys.plans.packing(planId));
      if (previous) {
        queryClient.setQueryData<PackingItem[]>(
          queryKeys.plans.packing(planId),
          previous.map((item) =>
            item.id === itemId
              ? { ...item, checked_at: checked ? new Date().toISOString() : null }
              : item
          )
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (planId && context?.previous) {
        queryClient.setQueryData(queryKeys.plans.packing(planId), context.previous);
      }
    },
    onSettled: () => {
      if (planId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.packing(planId) });
      }
    },
  });
}
