import { apiClient } from './client';
import { Task } from '../types';

export interface CreateTaskPayload {
  plan_section_id: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  due_at?: string;
  estimated_minutes?: number;
}

export const tasksApi = {
  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', payload);
    return response.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async updateTask(id: string, payload: Partial<CreateTaskPayload> & { status?: string }): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, payload);
    return response.data;
  },

  async completeTask(id: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/complete`);
    return response.data;
  },

  async reopenTask(id: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/reopen`);
    return response.data;
  },
};
