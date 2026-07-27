import type { FastifyInstance } from "fastify";
import { portainer } from "./portainer";
import { getProxmoxClusters, type ProxmoxCluster } from "./proxmox";
import { recordNotification } from "./notifications";
import { evaluateThreshold } from "./alerts";
import { recordMetric } from "./metrics";
import type { ProxmoxResource } from "../types/proxmox";

const pollIntervalMs = 15000;

const nodeStatus = new Map<string, string>();
const guestStatus = new Map<string, string>();
const containerStatus = new Map<string, string>();

// The first poll only seeds the maps above with current state — otherwise
// every node and guest would fire a "changed" notification on every backend
// restart, since there is no prior state to compare against.
let proxmoxSeeded = false;
let dockerSeeded = false;

async function pollProxmox(): Promise<void> {
  const clusters = getProxmoxClusters();
  const showClusterLabel = clusters.length > 1;

  await Promise.all(
    clusters.map((cluster) => pollProxmoxCluster(cluster, showClusterLabel))
  );

  proxmoxSeeded = true;
}

async function pollProxmoxCluster(
  cluster: ProxmoxCluster,
  showClusterLabel: boolean
): Promise<void> {
  const clusterId = cluster.id;
  const { data } = await cluster.client.get("/cluster/resources");
  const resources = data.data as ProxmoxResource[];

  // Node/guest names are only unique within a cluster, so every state map
  // and metric/alert key below is namespaced by cluster id to avoid two
  // clusters' same-named nodes colliding.
  for (const resource of resources) {
    if (resource.type === "node") {
      const key = `${clusterId}:${resource.node}`;
      const status = resource.status;
      const previous = nodeStatus.get(key);
      nodeStatus.set(key, status);

      const label = showClusterLabel
        ? `${resource.node} (${cluster.name})`
        : resource.node;

      if (proxmoxSeeded && previous && previous !== status) {
        await recordNotification({
          source: "proxmox",
          severity: status === "online" ? "info" : "critical",
          title: `Node ${label} is ${status}`,
          message:
            status === "online"
              ? `Node ${label} came back online.`
              : `Node ${label} went offline.`,
        });
      }

      // A node that just went offline reports 0 for everything below, which
      // would otherwise register as usage dropping back to normal.
      if (status === "online") {
        if (resource.cpu !== undefined) {
          const cpuPercent = resource.cpu * 100;

          await evaluateThreshold(
            `proxmox:${clusterId}:node:${resource.node}:cpu`,
            "proxmox",
            `Node ${label} CPU usage`,
            cpuPercent
          );

          await recordMetric(
            `proxmox:${clusterId}:node:${resource.node}:cpu`,
            `Node ${label} CPU`,
            cpuPercent
          );
        }

        if (resource.maxmem) {
          const memoryPercent = ((resource.mem ?? 0) / resource.maxmem) * 100;

          await evaluateThreshold(
            `proxmox:${clusterId}:node:${resource.node}:memory`,
            "proxmox",
            `Node ${label} memory usage`,
            memoryPercent
          );

          await recordMetric(
            `proxmox:${clusterId}:node:${resource.node}:memory`,
            `Node ${label} memory`,
            memoryPercent
          );
        }

        if (resource.maxdisk) {
          const diskPercent = ((resource.disk ?? 0) / resource.maxdisk) * 100;

          await evaluateThreshold(
            `proxmox:${clusterId}:node:${resource.node}:disk`,
            "proxmox",
            `Node ${label} disk usage`,
            diskPercent
          );

          await recordMetric(
            `proxmox:${clusterId}:node:${resource.node}:disk`,
            `Node ${label} disk`,
            diskPercent
          );
        }
      }

      continue;
    }

    if (resource.type === "qemu" || resource.type === "lxc") {
      const key = `${clusterId}:${resource.type}:${resource.vmid}`;
      const status = resource.status;
      const previous = guestStatus.get(key);
      guestStatus.set(key, status);

      const kind = resource.type === "qemu" ? "VM" : "LXC";
      const name = resource.name ?? `#${resource.vmid}`;
      const nodeLabel = showClusterLabel
        ? `${resource.node} (${cluster.name})`
        : resource.node;

      if (proxmoxSeeded && previous && previous !== status) {
        await recordNotification({
          source: "proxmox",
          severity: status === "running" ? "info" : "warning",
          title: `${kind} ${name} is ${status}`,
          message: `${kind} ${name} on ${nodeLabel} is now ${status}.`,
        });
      }

      // A stopped guest reports 0 for both fields, which would otherwise
      // show as a flatline to zero on every stop rather than a gap.
      if (status === "running") {
        const metricKey = `proxmox:${clusterId}:${resource.type}:${resource.vmid}`;

        if (resource.cpu !== undefined) {
          await recordMetric(
            `${metricKey}:cpu`,
            `${kind} ${name} CPU`,
            resource.cpu * 100
          );
        }

        if (resource.maxmem) {
          await recordMetric(
            `${metricKey}:memory`,
            `${kind} ${name} memory`,
            ((resource.mem ?? 0) / resource.maxmem) * 100
          );
        }
      }
    }
  }
}

interface PortainerContainer {
  Id: string;
  Names?: string[];
  State: string;
}

async function pollDocker(): Promise<void> {
  const endpoints = await portainer.get("/endpoints");
  const endpointId = endpoints.data[0]?.Id;

  if (endpointId === undefined) {
    return;
  }

  const { data } = await portainer.get(
    `/endpoints/${endpointId}/docker/containers/json?all=true`
  );

  for (const container of data as PortainerContainer[]) {
    const key = container.Id;
    const status = container.State;
    const name = container.Names?.[0]?.replace("/", "") ?? key.slice(0, 12);
    const previous = containerStatus.get(key);
    containerStatus.set(key, status);

    if (dockerSeeded && previous && previous !== status) {
      await recordNotification({
        source: "docker",
        severity: status === "running" ? "info" : "warning",
        title: `Container ${name} is ${status}`,
        message: `Container ${name} is now ${status}.`,
      });
    }
  }

  dockerSeeded = true;
}

export function startWatchers(app: FastifyInstance): void {
  const tick = async () => {
    try {
      await pollProxmox();
    } catch (error) {
      app.log.warn({ err: error }, "Proxmox watcher poll failed");
    }

    try {
      await pollDocker();
    } catch (error) {
      app.log.warn({ err: error }, "Docker watcher poll failed");
    }
  };

  void tick();
  const timer = setInterval(() => void tick(), pollIntervalMs);

  app.addHook("onClose", () => {
    clearInterval(timer);
  });
}
