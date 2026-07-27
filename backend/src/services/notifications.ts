import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { broadcast } from "./broadcast";

export type NotificationSource = "proxmox" | "docker" | "camera" | "system";
export type NotificationSeverity = "info" | "warning" | "critical";

export interface Notification {
  id: string;
  source: NotificationSource;
  severity: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface RecordNotificationInput {
  source: NotificationSource;
  severity: NotificationSeverity;
  title: string;
  message: string;
}

const dataDirectory = join(process.cwd(), "data");
const storePath = join(dataDirectory, "notifications.json");

// Keeps the store from growing without bound; old notifications age out once
// a fresh one pushes the list past this size.
const maxStoredNotifications = 500;

let notifications: Notification[] = [];
let loaded = false;

// Persists are serialized on this promise so concurrent writes (a poll tick
// firing multiple notifications at once) can't interleave and corrupt the
// file.
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<void> {
  if (loaded) {
    return;
  }

  loaded = true;

  try {
    const raw = await readFile(storePath, "utf8");
    notifications = JSON.parse(raw) as Notification[];
  } catch {
    notifications = [];
  }
}

function persist(): void {
  writeQueue = writeQueue
    .then(async () => {
      await mkdir(dataDirectory, { recursive: true });
      await writeFile(storePath, JSON.stringify(notifications, null, 2));
    })
    .catch((error: unknown) => {
      console.error("Unable to persist notifications", error);
    });
}

export async function recordNotification(
  input: RecordNotificationInput
): Promise<Notification> {
  await load();

  const notification: Notification = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
    ...input,
  };

  notifications = [notification, ...notifications].slice(
    0,
    maxStoredNotifications
  );

  persist();
  broadcast({ type: "notification.created", data: notification });

  return notification;
}

export async function listNotifications(): Promise<Notification[]> {
  await load();

  return notifications;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  await load();

  const notification = notifications.find((item) => item.id === id);

  if (!notification) {
    return false;
  }

  notification.read = true;
  persist();
  broadcast({ type: "notification.read", id });

  return true;
}

export async function markAllNotificationsRead(): Promise<void> {
  await load();

  notifications = notifications.map((item) =>
    item.read ? item : { ...item, read: true }
  );

  persist();
  broadcast({ type: "notification.read-all" });
}
