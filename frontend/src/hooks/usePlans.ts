import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../api/plans';
import { queryKeys } from './queryKeys';
import { Plan, PlanProgressResponse, NextActionResponse, PlanSection } from '../types';

export function usePlan(planId?: string) {
  return useQuery<Plan>({
    queryKey: queryKeys.plans.detail(planId || ''),
    queryFn: () => plansApi.getPlan(planId!),
    enabled: Boolean(planId),
  });
}

export function usePlanSections(planId?: string) {
  return useQuery<PlanSection[]>({
    queryKey: queryKeys.plans.sections(planId || ''),
    queryFn: () => plansApi.getPlanSections(planId!),
    enabled: Boolean(planId),
  });
}

export function usePlanProgress(planId?: string) {
  return useQuery<PlanProgressResponse>({
    queryKey: queryKeys.plans.progress(planId || ''),
    queryFn: () => plansApi.getProgress(planId!),
    enabled: Boolean(planId),
  });
}

export function useNextAction(planId?: string) {
  return useQuery<NextActionResponse | null>({
    queryKey: queryKeys.plans.nextAction(planId || ''),
    queryFn: () => plansApi.getNextAction(planId!),
    enabled: Boolean(planId),
  });
}
