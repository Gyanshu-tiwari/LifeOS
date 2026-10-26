import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../api/plans';
import { queryKeys } from './queryKeys';
import { Place } from '../types';

export function usePlaces(planId?: string) {
  return useQuery<Place[]>({
    queryKey: queryKeys.plans.places(planId || ''),
    queryFn: () => plansApi.getPlaces(planId!),
    enabled: Boolean(planId),
  });
}
