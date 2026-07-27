import { api } from "./client";

export interface AuthStatus {
  enabled: boolean;
}

export function getAuthStatus(): Promise<AuthStatus> {
  return api.get<AuthStatus>("/api/auth/status");
}

export function getAuthSession(): Promise<{ ok: true }> {
  return api.get<{ ok: true }>("/api/auth/session");
}

export function login(password: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>("/api/auth/login", { password });
}

export function enableLock(password: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>("/api/auth/enable", { password });
}

export function disableLock(): Promise<{ ok: true }> {
  return api.post<{ ok: true }>("/api/auth/disable");
}
