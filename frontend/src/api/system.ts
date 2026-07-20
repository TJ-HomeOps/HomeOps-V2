import { api } from "./client";
import type { SystemInfo } from "../types/system";

export interface CPUInfo {
  cores: number;
  load: number;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface SystemInfo {
  hostname: string;
  uptime: number;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
}

export function getSystemInfo(): Promise<SystemInfo> {
  return api.get("/api/system");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatPercent(
  value: number
): string {
  return `${value.toFixed(1)}%`;
}

export function formatUptime(
  seconds: number
): string {
  const days = Math.floor(seconds / 86400);

  const hours = Math.floor(
    (seconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
