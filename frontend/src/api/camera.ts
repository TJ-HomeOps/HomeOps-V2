import { api, apiBaseUrl } from "./client";

export interface TapoC100Camera {
  name: string;
  configured: boolean;
  streamPath: string | null;
}

export function getTapoC100Camera(): Promise<TapoC100Camera> {
  return api.get<TapoC100Camera>("/api/cameras/tapo-c100");
}

export function getCameraStreamUrl(streamPath: string): string {
  return `${apiBaseUrl}${streamPath}`;
}
