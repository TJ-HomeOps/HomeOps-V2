import { api } from "./client";
import type {
  Container,
  DockerInfo,
} from "../types/docker";

export interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

export interface DockerInfo {
  serverVersion: string;
  operatingSystem: string;
  containers: number;
  running: number;
  stopped: number;
  paused: number;
  images: number;
  cpu: number;
  memory: number;
}

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
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/containers/${id}/logs`
  );

  if (!response.ok) {
    throw new Error("Unable to load logs.");
  }

  return response.text();
}
