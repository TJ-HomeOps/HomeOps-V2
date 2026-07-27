import { api } from "./client";

export type AuditResult = "success" | "failure";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  result: AuditResult;
  detail?: string;
}

export function getAuditLog(): Promise<AuditEntry[]> {
  return api.get<AuditEntry[]>("/api/audit");
}
