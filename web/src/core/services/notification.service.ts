import api from "@/lib/api";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationService = {
  async list(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationList> {
    const res = await api.get<{ success: boolean; data: NotificationList }>(
      "/notifications",
      { params },
    );
    return res.data.data;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  },

  async registerPushToken(
    token: string,
    platform: "ios" | "android",
  ): Promise<void> {
    await api.post("/notifications/push-token", { token, platform });
  },

  async removePushToken(token: string): Promise<void> {
    await api.delete("/notifications/push-token", { data: { token } });
  },
};
