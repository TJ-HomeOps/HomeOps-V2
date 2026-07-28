import { api } from "./client";
import type { UpdatesResponse } from "../types/updates";

export function getUpdates(): Promise<UpdatesResponse> {
  return api.get("/api/updates");
}

export function applyUpdate(
  id: string
): Promise<{ success: boolean; affected: string[]; output: string }> {
  return api.post(`/api/updates/${id}/apply`);
}
