import { apiClient } from '../client';
import { ActionItem } from '../../types';
import { ActionDecisionRequest } from '../../types/api';
import { initialActions } from '../../data/mockData';

export const actionService = {
  async getActions(): Promise<ActionItem[]> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      return initialActions;
    }
    const res = await apiClient.get<ActionItem[]>('/actions');
    return res.data;
  },

  async executeDecision(payload: ActionDecisionRequest): Promise<ActionItem> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(200);
      const action = initialActions.find((a) => a.id === payload.actionId) || initialActions[0];
      return {
        ...action,
        status: payload.decision === 'approve' ? 'executed' : 'rejected',
      };
    }
    const res = await apiClient.post<ActionItem>(
      `/actions/${payload.actionId}/decision`,
      payload
    );
    return res.data;
  },
};
