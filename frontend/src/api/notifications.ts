import { apiClient } from './client';
import { Notification, NotificationListResponse } from '../types';

export const notificationsApi = {
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
  }): Promise<NotificationListResponse> {
    const response = await apiClient.get<NotificationListResponse>('/notifications', {
      params: {
        limit: params?.limit ?? 30,
        offset: params?.offset ?? 0,
        unread_only: params?.unread_only,
      },
    });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unread_count: number }>('/notifications/unread-count');
    return response.data.unread_count;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ updated_count: number }> {
    const response = await apiClient.post<{ updated_count: number }>('/notifications/read-all');
    return response.data;
  },
};
