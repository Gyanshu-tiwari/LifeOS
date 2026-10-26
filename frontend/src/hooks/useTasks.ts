import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, CreateTaskPayload } from '../api/tasks';
import { plansApi } from '../api/plans';
import { queryKeys } from './queryKeys';
import { Task } from '../types';

export function usePlanTasks(planId?: string) {
  return useQuery<Task[]>({
    queryKey: queryKeys.plans.tasks(planId || ''),
    queryFn: () => plansApi.getPlanTasks(planId!),
    enabled: Boolean(planId),
  });
}

export function useCompleteTask(planId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.completeTask(taskId),
    onSuccess: () => {
      if (planId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.tasks(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.progress(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.nextAction(planId) });
      }
    },
  });
}

export function useReopenTask(planId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.reopenTask(taskId),
    onSuccess: () => {
      if (planId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.tasks(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.progress(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.nextAction(planId) });
      }
    },
  });
}

export function useCreateTask(planId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.createTask(payload),
    onSuccess: () => {
      if (planId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.tasks(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.progress(planId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.nextAction(planId) });
      }
    },
  });
}
