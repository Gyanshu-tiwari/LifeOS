import { apiClient } from '../client';
import { Goal } from '../../types';
import { CreateGoalRequest } from '../../types/api';
import { initialGoals } from '../../data/mockData';

export const goalService = {
  async getGoals(): Promise<Goal[]> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      return initialGoals;
    }
    const res = await apiClient.get<Goal[]>('/goals');
    return res.data;
  },

  async getGoal(id: string): Promise<Goal | null> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      return initialGoals.find((g) => g.id === id) || initialGoals[0] || null;
    }
    const res = await apiClient.get<Goal>(`/goals/${id}`);
    return res.data;
  },

  async createGoal(payload: CreateGoalRequest): Promise<Goal> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(250);
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        status: 'Planned',
        location: payload.location,
        deadline: payload.deadline,
        completedTasks: 0,
        totalTasks: 3,
        constraints: payload.constraints,
        category: payload.category || 'Personal',
        activeAgents: ['orchestrator', 'planning', 'research'],
        nextAction: 'Review AI breakdown & constraints',
      };
      return newGoal;
    }
    const res = await apiClient.post<Goal>('/goals', payload);
    return res.data;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      const current = initialGoals.find((g) => g.id === id) || initialGoals[0];
      return { ...current, ...updates };
    }
    const res = await apiClient.patch<Goal>(`/goals/${id}`, updates);
    return res.data;
  },
};
