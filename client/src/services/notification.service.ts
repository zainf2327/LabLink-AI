import { api } from './api';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'report' | 'subscription' | 'general';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export const notificationService = {
  async getNotifications(page = 1, limit = 20): Promise<GetNotificationsResponse> {
    const response = await api.get('/notifications', { params: { page, limit } });
    return response.data;
  },

  async markAsRead(id: string): Promise<{ success: boolean; message: string; data: { notification: Notification } }> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
