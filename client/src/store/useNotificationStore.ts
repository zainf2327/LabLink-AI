import { create } from 'zustand';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearStore: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (page = 1, limit = 20) => {
    set({ loading: true });
    try {
      const response = await notificationService.getNotifications(page, limit);
      set({
        notifications: response.data.notifications,
        unreadCount: response.data.unreadCount,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    const prevNotifications = get().notifications;
    const updated = prevNotifications.map((n) =>
      n._id === id ? { ...n, isRead: true } : n
    );
    const wasUnread = prevNotifications.find((n) => n._id === id && !n.isRead);
    const unreadCountAdjust = wasUnread ? 1 : 0;
    
    set({
      notifications: updated,
      unreadCount: Math.max(0, get().unreadCount - unreadCountAdjust),
    });

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
      // Revert if API failed
      set({
        notifications: prevNotifications,
        unreadCount: get().unreadCount + unreadCountAdjust,
      });
    }
  },

  markAllAsRead: async () => {
    const prevNotifications = get().notifications;
    const prevUnreadCount = get().unreadCount;

    // Optimistic update
    set({
      notifications: prevNotifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert if API failed
      set({
        notifications: prevNotifications,
        unreadCount: prevUnreadCount,
      });
    }
  },

  deleteNotification: async (id: string) => {
    const prevNotifications = get().notifications;
    const prevUnreadCount = get().unreadCount;
    const target = prevNotifications.find((n) => n._id === id);
    const unreadCountAdjust = target && !target.isRead ? 1 : 0;

    // Optimistic update
    set({
      notifications: prevNotifications.filter((n) => n._id !== id),
      unreadCount: Math.max(0, prevUnreadCount - unreadCountAdjust),
    });

    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err);
      // Revert if API failed
      set({
        notifications: prevNotifications,
        unreadCount: prevUnreadCount,
      });
    }
  },

  clearStore: () => {
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
    });
  },
}));

export default useNotificationStore;
