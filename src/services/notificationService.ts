import api from './api';
import type { Notification, ApiResponse } from '@/types';

interface GetNotificationsParams {
  limit?: number;
  unread?: boolean;
}

export const notificationService = {
  async getNotifications(params?: GetNotificationsParams): Promise<ApiResponse<Notification[]> & { unreadCount?: number }> {
    const { data } = await api.get<ApiResponse<Notification[]> & { unreadCount?: number }>('/notifications', { params });
    return data;
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const { data } = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return data;
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    const { data } = await api.patch<ApiResponse<void>>('/notifications/read-all');
    return data;
  },
};
