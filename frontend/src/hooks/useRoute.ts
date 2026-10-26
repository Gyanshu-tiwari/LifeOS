import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans';
import { queryKeys } from './queryKeys';
import { Route } from '../types';

export function useRoute(planId?: string) {
  return useQuery<Route | null>({
    queryKey: queryKeys.plans.route(planId || ''),
    queryFn: () => plansApi.getRoute(planId!),
    enabled: Boolean(planId),
  });
}

export function useRecalculateRoute(planId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { origin?: string; destination?: string; travel_mode?: string }) =>
      plansApi.recalculateRoute(planId!, payload),
    onSuccess: (newRoute) => {
      if (planId) {
        queryClient.setQueryData(queryKeys.plans.route(planId), newRoute);
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.route(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.detail(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.places(planId) });
      }
    },
  });
}
