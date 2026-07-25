import { api, apiBaseUrl } from "./client";
import type {
  Container,
  DockerInfo,
} from "../types/docker";

export type {
  Container,
  DockerInfo,
};

export function getDockerInfo(): Promise<DockerInfo> {
  return api.get("/api/docker");
}

export function getContainers(): Promise<Container[]> {
  return api.get("/api/containers");
}

export function getContainer(id: string) {
  return api.get(`/api/containers/${id}`);
}

export function startContainer(id: string) {
  return api.post(`/api/containers/${id}/start`);
}

export function stopContainer(id: string) {
  return api.post(`/api/containers/${id}/stop`);
}

export function restartContainer(id: string) {
  return api.post(`/api/containers/${id}/restart`);
}

export async function getContainerLogs(
  id: string
): Promise<string> {
  // Logs are plain text rather than JSON, so this bypasses the api helper but
  // must still resolve against the same base URL.
  const response = await fetch(
    `${apiBaseUrl}/api/containers/${id}/logs`
  );

  if (!response.ok) {
    throw new Error("Unable to load logs.");
  }

  return response.text();
}
