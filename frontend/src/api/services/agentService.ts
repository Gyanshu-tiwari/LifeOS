import { apiClient } from '../client';
import { AgentInfo } from '../../types';
import { aiAgentsList } from '../../data/mockData';

export const agentService = {
  async getAgents(): Promise<AgentInfo[]> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      return aiAgentsList;
    }
    const res = await apiClient.get<AgentInfo[]>('/agents');
    return res.data;
  },

  async getAgent(id: string): Promise<AgentInfo | null> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(100);
      return aiAgentsList.find((a) => a.id === id) || null;
    }
    const res = await apiClient.get<AgentInfo>(`/agents/${id}`);
    return res.data;
  },
};
