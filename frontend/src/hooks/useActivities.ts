import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi, CreateActivityPayload } from '../api/activities';
import { queryKeys } from './queryKeys';
import { Activity, ActivityListResponse, Plan } from '../types';

export function useActivities(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery<ActivityListResponse>({
    queryKey: queryKeys.activities.list(params),
    queryFn: () => activitiesApi.getActivities(params),
  });
}

export function useActivity(id?: string) {
  return useQuery<Activity>({
    queryKey: queryKeys.activities.detail(id || ''),
    queryFn: () => activitiesApi.getActivity(id!),
    enabled: Boolean(id),
  });
}

export function useActivityPlans(activityId?: string) {
  return useQuery<Plan[]>({
    queryKey: queryKeys.activities.plans(activityId || ''),
    queryFn: () => activitiesApi.getActivityPlans(activityId!),
    enabled: Boolean(activityId),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateActivityPayload) => activitiesApi.createActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}
