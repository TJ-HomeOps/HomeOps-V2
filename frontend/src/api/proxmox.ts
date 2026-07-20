import { api } from "./client";

export interface ProxmoxNode {
  id: string;
  node: string;
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  maxcpu: number;
}

export interface ProxmoxGuest {
  id: string;
  vmid: number;
  name: string;
  node: string;
  type: "qemu" | "lxc";
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
}

export interface ProxmoxStorage {
  id: string;
  storage: string;
  node: string;
  status: string;
  disk: number;
  maxdisk: number;
  shared: number;
  plugintype: string;
}

export interface ProxmoxOverview {
  nodes: ProxmoxNode[];
  vms: ProxmoxGuest[];
  lxcs: ProxmoxGuest[];
  storage: ProxmoxStorage[];
  networks: any[];
}

export function getOverview(): Promise<ProxmoxOverview> {
  return api.get<ProxmoxOverview>("/api/proxmox/overview");
}
