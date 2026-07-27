import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Bell, Box, Camera, Check, Server } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import type {
  AppNotification,
  NotificationSeverity,
  NotificationSource,
} from "../api/notifications";
import { subscribeToLiveUpdates } from "../api/ws";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import colors from "../theme/colors";

const pollIntervalMs = 15000;

const severityColors: Record<NotificationSeverity, string> = {
  info: colors.primary,
  warning: colors.warning,
  critical: colors.danger,
};

const sourceIcons: Record<NotificationSource, ReactNode> = {
  proxmox: <Server size={16} />,
  docker: <Box size={16} />,
  camera: <Camera size={16} />,
  system: <Bell size={16} />,
};

const sourceLabels: Record<NotificationSource, string> = {
  proxmox: "Proxmox",
  docker: "Docker",
  camera: "Camera",
  system: "System",
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setError(null);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    const timer = setInterval(() => {
      void loadNotifications();
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    return subscribeToLiveUpdates((message) => {
      if (message.type === "notification.created") {
        const notification = message.data as AppNotification;

        setNotifications((current) =>
          current.some((item) => item.id === notification.id)
            ? current
            : [notification, ...current]
        );

        return;
      }

      if (message.type === "notification.read") {
        setNotifications((current) =>
          current.map((item) =>
            item.id === message.id ? { ...item, read: true } : item
          )
        );

        return;
      }

      if (message.type === "notification.read-all") {
        setNotifications((current) =>
          current.map((item) => ({ ...item, read: true }))
        );
      }
    });
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleMarkRead = async (id: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );

    try {
      await markNotificationRead(id);
    } catch {
      void loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    );

    try {
      await markAllNotificationsRead();
    } catch {
      void loadNotifications();
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread`
            : "Operational alerts and system activity"
        }
      >
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Check size={16} />}
            onClick={() => {
              void handleMarkAllRead();
            }}
          >
            Mark all as read
          </Button>
        )}
      </PageHeader>

      {error && (
        <Alert
          title="Notifications unavailable"
          variant="danger"
          style={{ marginBottom: 20 }}
        >
          {error}
        </Alert>
      )}

      <Card
        title="Recent activity"
        subtitle="Updates from Proxmox, Docker, and the security camera"
        actions={<Bell size={20} color={colors.primary} />}
        padding={20}
      >
        {loading && (
          <div style={{ padding: "48px 0" }}>
            <Spinner label="Loading notifications" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              color: colors.textSecondary,
            }}
          >
            There are no notifications yet.
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    void handleMarkRead(notification.id);
                  }
                }}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: 14,
                  borderRadius: 10,
                  background: notification.read
                    ? colors.surface
                    : colors.surfaceAlt,
                  borderLeft: `4px solid ${severityColors[notification.severity]}`,
                  cursor: notification.read ? "default" : "pointer",
                }}
              >
                <div
                  style={{
                    color: severityColors[notification.severity],
                    marginTop: 2,
                  }}
                >
                  {sourceIcons[notification.source]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ color: colors.text, fontWeight: 700 }}>
                      {notification.title}
                    </div>

                    <div style={{ color: colors.textMuted, fontSize: 12 }}>
                      {formatTimestamp(notification.createdAt)}
                    </div>
                  </div>

                  <div
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {notification.message}
                  </div>

                  <div
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      marginTop: 6,
                    }}
                  >
                    {sourceLabels[notification.source]}
                  </div>
                </div>

                {!notification.read && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: colors.primary,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
