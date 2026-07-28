import { api } from "./client";
import type {
  IntegrationsResponse,
  ProxmoxClusterInput,
} from "../types/integrations";

export function getIntegrations(): Promise<IntegrationsResponse> {
  return api.get("/api/integrations");
}

export function updateIntegration(
  key: string,
  values: Record<string, string>
): Promise<{ success: boolean }> {
  return api.put(`/api/integrations/${key}`, values);
}

export function updateProxmoxClusters(
  clusters: ProxmoxClusterInput[]
): Promise<{ success: boolean }> {
  return api.put("/api/integrations/proxmox-clusters", { clusters });
}
