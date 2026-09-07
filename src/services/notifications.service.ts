import { api } from "../lib/api";

export interface AppNotification {
  id: string;
  ticketId: string | null;
  ticket?: { id: string; code: string } | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
}

export const notificationsService = {
  async getPage(page: number, limit = 10): Promise<NotificationsPage> {
    const response = await api.get<NotificationsPage>("/notifications", {
      params: { page, limit },
    });
    return response.data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },
};
