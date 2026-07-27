import { api } from "./client";

export interface ProxmoxClusterSummary {
  id: string;
  name: string;
  ok: boolean;
}

export interface ProxmoxResource {
  id: string;
  node: string;
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
  cluster: string;
}

export interface ProxmoxNode {
  id: string;
  node: string;
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  maxcpu: number;
  uptime: number;
  cluster: string;
}

export interface ProxmoxOverview {
  clusters: ProxmoxClusterSummary[];
  nodes: ProxmoxNode[];
  vms: ProxmoxResource[];
  lxcs: ProxmoxResource[];
  storage: any[];
  networks: any[];
}

export async function getOverview() {
  return api.get<ProxmoxOverview>("/api/proxmox/overview");
}

export interface ProxmoxNodeDetail {
  cluster: string;
  node: string;
  status: Record<string, any>;
  storage: Array<Record<string, any>>;
}

export interface ProxmoxGuestDetail {
  cluster: string;
  node: string;
  vmid: number;
  status: Record<string, any>;
  config: Record<string, any>;
}

export function getNodeDetail(
  cluster: string,
  node: string
): Promise<ProxmoxNodeDetail> {
  return api.get<ProxmoxNodeDetail>(`/api/proxmox/nodes/${cluster}/${node}`);
}

export function getVmDetail(
  cluster: string,
  node: string,
  vmid: number | string
): Promise<ProxmoxGuestDetail> {
  return api.get<ProxmoxGuestDetail>(
    `/api/proxmox/vms/${cluster}/${node}/${vmid}`
  );
}

export function getLxcDetail(
  cluster: string,
  node: string,
  vmid: number | string
): Promise<ProxmoxGuestDetail> {
  return api.get<ProxmoxGuestDetail>(
    `/api/proxmox/lxc/${cluster}/${node}/${vmid}`
  );
}

async function powerAction(
  cluster: string,
  node: string,
  type: "qemu" | "lxc",
  vmid: number,
  action: "start" | "stop" | "restart"
) {
  return api.post(
    `/api/proxmox/${cluster}/${node}/${type}/${vmid}/${action}`,
    {}
  );
}

export function startVM(cluster: string, node: string, vmid: number) {
  return powerAction(cluster, node, "qemu", vmid, "start");
}

export function stopVM(cluster: string, node: string, vmid: number) {
  return powerAction(cluster, node, "qemu", vmid, "stop");
}

export function restartVM(cluster: string, node: string, vmid: number) {
  return powerAction(cluster, node, "qemu", vmid, "restart");
}

export function startLXC(cluster: string, node: string, vmid: number) {
  return powerAction(cluster, node, "lxc", vmid, "start");
}

export function stopLXC(cluster: string, node: string, vmid: number) {
  return powerAction(cluster, node, "lxc", vmid, "stop");
}

export function restartLXC(cluster: string, node: string, vmid: number) {
  return powerAction(cluster, node, "lxc", vmid, "restart");
}
