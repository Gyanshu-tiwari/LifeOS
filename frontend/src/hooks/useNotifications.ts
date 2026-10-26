import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { NotificationListResponse } from '../types';

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: (params?: { limit?: number; offset?: number; unread_only?: boolean }) =>
    ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications(params?: {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}) {
  return useQuery({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => notificationsApi.getNotifications(params),
    staleTime: 1000 * 15, // 15 seconds
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 20, // 20 seconds
    refetchInterval: 1000 * 30, // sensible 30s polling
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (updated) => {
      // Optimistically update lists
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationQueryKeys.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n) => (n.id === updated.id ? { ...n, read_at: updated.read_at } : n)),
            unread_count: Math.max(0, old.unread_count - 1),
          };
        }
      );
      // Invalidate count
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      const now = new Date().toISOString();
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationQueryKeys.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n) => ({ ...n, read_at: n.read_at || now })),
            unread_count: 0,
          };
        }
      );
      queryClient.setQueryData(notificationQueryKeys.unreadCount, 0);
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
