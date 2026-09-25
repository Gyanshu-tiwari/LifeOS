import { apiClient } from '../client';
import { GoalPlan } from '../../types';
import { PlanDecisionRequest } from '../../types/api';
import { mockGoalPlan } from '../../data/mockData';

export const planService = {
  async getPlan(goalId: string): Promise<GoalPlan> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      return { ...mockGoalPlan, goalId };
    }
    const res = await apiClient.get<GoalPlan>(`/goals/${goalId}/plan`);
    return res.data;
  },

  async submitDecision(payload: PlanDecisionRequest): Promise<GoalPlan> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(200);
      return {
        ...mockGoalPlan,
        status:
          payload.decision === 'approve'
            ? 'approved'
            : payload.decision === 'modify'
            ? 'modified'
            : 'rejected',
        ...(payload.modifications || {}),
      };
    }
    const res = await apiClient.post<GoalPlan>(
      `/plans/${payload.planId}/decision`,
      payload
    );
    return res.data;
  },
};
