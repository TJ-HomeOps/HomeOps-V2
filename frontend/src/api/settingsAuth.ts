import { api } from "./client";

export interface SettingsAuthStatus {
  enabled: boolean;
}

export function getSettingsAuthStatus(): Promise<SettingsAuthStatus> {
  return api.get<SettingsAuthStatus>("/api/settings-auth/status");
}

export function getSettingsAuthSession(): Promise<{ ok: true }> {
  return api.get<{ ok: true }>("/api/settings-auth/session");
}

export function settingsLogin(password: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>("/api/settings-auth/login", { password });
}

export function enableSettingsLock(password: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>("/api/settings-auth/enable", { password });
}

export function disableSettingsLock(): Promise<{ ok: true }> {
  return api.post<{ ok: true }>("/api/settings-auth/disable");
}
