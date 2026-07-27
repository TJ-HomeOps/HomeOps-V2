import { api } from "./client";

export type NotificationSource = "proxmox" | "docker" | "camera" | "system";
export type NotificationSeverity = "info" | "warning" | "critical";

export interface AppNotification {
  id: string;
  source: NotificationSource;
  severity: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function getNotifications(): Promise<AppNotification[]> {
  return api.get<AppNotification[]>("/api/notifications");
}

export function markNotificationRead(
  id: string
): Promise<{ success: boolean }> {
  return api.post(`/api/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ success: boolean }> {
  return api.post("/api/notifications/read-all");
}
