import { apiClient } from '../client';
import { Task } from '../../types';
import { CreateTaskRequest } from '../../types/api';
import { initialTasks } from '../../data/mockData';

export const taskService = {
  async getTasks(goalId?: string): Promise<Task[]> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      if (goalId) {
        return initialTasks.filter((t) => t.goalId === goalId);
      }
      return initialTasks;
    }
    const query = goalId ? `?goalId=${goalId}` : '';
    const res = await apiClient.get<Task[]>(`/tasks${query}`);
    return res.data;
  },

  async createTask(payload: CreateTaskRequest): Promise<Task> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(200);
      const newTask: Task = {
        id: `task-${Date.now()}`,
        goalId: payload.goalId,
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate,
        dueLabel: payload.dueLabel,
        isCompleted: false,
        priority: payload.priority,
        category: payload.category,
        relatedAgent: payload.relatedAgent,
      };
      return newTask;
    }
    const res = await apiClient.post<Task>('/tasks', payload);
    return res.data;
  },

  async toggleTask(id: string, isCompleted: boolean): Promise<Task> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(100);
      const current = initialTasks.find((t) => t.id === id) || initialTasks[0];
      return { ...current, isCompleted };
    }
    const res = await apiClient.patch<Task>(`/tasks/${id}`, { isCompleted });
    return res.data;
  },

  async deleteTask(id: string): Promise<boolean> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      return true;
    }
    await apiClient.delete(`/tasks/${id}`);
    return true;
  },
};
