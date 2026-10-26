import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../api/activities';
import { queryKeys } from './queryKeys';
import { PlanRun } from '../types';

export function usePlanRun(activityId?: string, runId?: string, enabled = true) {
  return useQuery<PlanRun>({
    queryKey: queryKeys.activities.run(activityId || '', runId || ''),
    queryFn: () => activitiesApi.getPlanRunStatus(activityId!, runId!),
    enabled: Boolean(activityId && runId && enabled),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(data.status)) {
        return false;
      }
      return 2000;
    },
  });
}

export function useStartPlanRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, idempotencyKey }: { activityId: string; idempotencyKey?: string }) =>
      activitiesApi.generatePlan(activityId, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.runs(variables.activityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.detail(variables.activityId) });
    },
  });
}
