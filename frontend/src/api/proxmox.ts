import { api } from "./client";

export interface ProxmoxResource {
  id: string;
  node: string;
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
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
}

export interface ProxmoxOverview {
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
  node: string;
  status: Record<string, any>;
  storage: Array<Record<string, any>>;
}

export interface ProxmoxGuestDetail {
  node: string;
  vmid: number;
  status: Record<string, any>;
  config: Record<string, any>;
}

export function getNodeDetail(node: string): Promise<ProxmoxNodeDetail> {
  return api.get<ProxmoxNodeDetail>(`/api/proxmox/nodes/${node}`);
}

export function getVmDetail(
  node: string,
  vmid: number | string
): Promise<ProxmoxGuestDetail> {
  return api.get<ProxmoxGuestDetail>(`/api/proxmox/vms/${node}/${vmid}`);
}

export function getLxcDetail(
  node: string,
  vmid: number | string
): Promise<ProxmoxGuestDetail> {
  return api.get<ProxmoxGuestDetail>(`/api/proxmox/lxc/${node}/${vmid}`);
}

async function powerAction(
  node: string,
  type: "qemu" | "lxc",
  vmid: number,
  action: "start" | "stop" | "restart"
) {
  return api.post(
    `/api/proxmox/${node}/${type}/${vmid}/${action}`,
    {}
  );
}

export function startVM(node: string, vmid: number) {
  return powerAction(node, "qemu", vmid, "start");
}

export function stopVM(node: string, vmid: number) {
  return powerAction(node, "qemu", vmid, "stop");
}

export function restartVM(node: string, vmid: number) {
  return powerAction(node, "qemu", vmid, "restart");
}

export function startLXC(node: string, vmid: number) {
  return powerAction(node, "lxc", vmid, "start");
}

export function stopLXC(node: string, vmid: number) {
  return powerAction(node, "lxc", vmid, "stop");
}

export function restartLXC(node: string, vmid: number) {
  return powerAction(node, "lxc", vmid, "restart");
}
