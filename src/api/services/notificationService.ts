import { apiClient } from '../client';
import { NotificationItem } from '../../types';
import { initialNotifications } from '../../data/mockData';

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(100);
      return initialNotifications;
    }
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  async markAsRead(id: string): Promise<boolean> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(50);
      return true;
    }
    await apiClient.patch(`/notifications/${id}/read`, {});
    return true;
  },
};
