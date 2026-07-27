// Shape of an entry in the Proxmox `/cluster/resources` response. Node, VM,
// and LXC entries all come back in the same flat list distinguished by
// `type`, so most fields are optional depending on which kind a given
// resource is.
export interface ProxmoxResource {
  type: string;
  node: string;
  vmid?: number;
  name?: string;
  status: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  uptime?: number;
}
