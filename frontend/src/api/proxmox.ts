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
