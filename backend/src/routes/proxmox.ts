import type { FastifyInstance, FastifyReply } from "fastify";
import { getProxmoxCluster, getProxmoxClusters } from "../services/proxmox";
import { describeErrorDetail, recordAuditEntry } from "../services/audit";
import { getCachedSensors } from "../services/sensors";
import type { ProxmoxResource } from "../types/proxmox";

function requireCluster(clusterId: string, reply: FastifyReply) {
  const cluster = getProxmoxCluster(clusterId);

  if (!cluster) {
    reply.code(404).send({
      success: false,
      message: `Unknown Proxmox cluster "${clusterId}".`,
    });

    return null;
  }

  return cluster;
}

export default async function proxmoxRoutes(app: FastifyInstance) {
  app.get("/api/proxmox/overview", async (_, reply) => {
    const clusters = getProxmoxClusters();

    const results = await Promise.all(
      clusters.map(async (cluster) => {
        try {
          const { data } = await cluster.client.get("/cluster/resources");
          const resources = (data.data as ProxmoxResource[]).map(
            (resource) => ({ ...resource, cluster: cluster.id })
          );

          return { cluster, resources, ok: true as const };
        } catch (err: any) {
          app.log.warn(
            { err, cluster: cluster.id },
            "Failed to fetch Proxmox cluster resources"
          );

          return { cluster, resources: [] as ProxmoxResource[], ok: false as const };
        }
      })
    );

    const resources = results.flatMap((result) => result.resources);

    return {
      clusters: results.map((result) => ({
        id: result.cluster.id,
        name: result.cluster.name,
        ok: result.ok,
      })),
      nodes: resources.filter((r) => r.type === "node"),
      vms: resources.filter((r) => r.type === "qemu"),
      lxcs: resources.filter((r) => r.type === "lxc"),
      storage: resources.filter((r) => r.type === "storage"),
      networks: resources.filter((r) => r.type === "network"),
    };
  });

  // Extended single-node status (PVE/kernel version, per-core CPU, swap,
  // load average) beyond what /cluster/resources carries, plus the node's
  // storage volumes.
  app.get<{ Params: { cluster: string; node: string } }>(
    "/api/proxmox/nodes/:cluster/:node",
    async (request, reply) => {
      const { cluster: clusterId, node } = request.params;
      const cluster = requireCluster(clusterId, reply);
      if (!cluster) return;

      try {
        const [statusRes, storageRes] = await Promise.all([
          cluster.client.get(`/nodes/${node}/status`),
          cluster.client.get(`/nodes/${node}/storage`),
        ]);

        return {
          cluster: cluster.id,
          node,
          status: statusRes.data.data,
          storage: storageRes.data.data,
        };
      } catch (err: any) {
        reply.code(500).send({
          success: false,
          message: err.response?.data || err.message,
        });
      }
    }
  );

  // Full guest detail (live status + config) for a single VM or LXC —
  // /cluster/resources only carries summary fields, not disks/network/boot
  // config.
  app.get<{ Params: { cluster: string; node: string; vmid: string } }>(
    "/api/proxmox/vms/:cluster/:node/:vmid",
    async (request, reply) => {
      const { cluster: clusterId, node, vmid } = request.params;
      const cluster = requireCluster(clusterId, reply);
      if (!cluster) return;

      try {
        const [statusRes, configRes] = await Promise.all([
          cluster.client.get(`/nodes/${node}/qemu/${vmid}/status/current`),
          cluster.client.get(`/nodes/${node}/qemu/${vmid}/config`),
        ]);

        return {
          cluster: cluster.id,
          node,
          vmid: Number(vmid),
          status: statusRes.data.data,
          config: configRes.data.data,
        };
      } catch (err: any) {
        reply.code(500).send({
          success: false,
          message: err.response?.data || err.message,
        });
      }
    }
  );

  app.get<{ Params: { cluster: string; node: string; vmid: string } }>(
    "/api/proxmox/lxc/:cluster/:node/:vmid",
    async (request, reply) => {
      const { cluster: clusterId, node, vmid } = request.params;
      const cluster = requireCluster(clusterId, reply);
      if (!cluster) return;

      try {
        const [statusRes, configRes] = await Promise.all([
          cluster.client.get(`/nodes/${node}/lxc/${vmid}/status/current`),
          cluster.client.get(`/nodes/${node}/lxc/${vmid}/config`),
        ]);

        return {
          cluster: cluster.id,
          node,
          vmid: Number(vmid),
          status: statusRes.data.data,
          config: configRes.data.data,
        };
      } catch (err: any) {
        reply.code(500).send({
          success: false,
          message: err.response?.data || err.message,
        });
      }
    }
  );

  // Served from the last sensor poll's cache (see services/sensors.ts) —
  // querying live would mean an SSH round-trip on every page load.
  app.get<{ Params: { cluster: string; node: string } }>(
    "/api/proxmox/nodes/:cluster/:node/sensors",
    async (request, reply) => {
      const { cluster: clusterId, node } = request.params;
      const cluster = requireCluster(clusterId, reply);
      if (!cluster) return;

      const snapshot = getCachedSensors(clusterId, node);

      if (!snapshot) {
        return reply.code(404).send({
          success: false,
          message: "No sensor data yet for this node.",
        });
      }

      return snapshot;
    }
  );

  app.post<{
    Params: {
      cluster: string;
      node: string;
      type: "qemu" | "lxc";
      vmid: string;
      action: string;
    };
  }>(
    "/api/proxmox/:cluster/:node/:type/:vmid/:action",
    async (request, reply) => {
      const { cluster: clusterId, node, type, vmid, action } = request.params;
      const cluster = requireCluster(clusterId, reply);
      if (!cluster) return;

      const target = `${type}:${vmid} on ${node} (${cluster.name})`;

      try {
        let proxmoxAction = action;

        // Allow the frontend to always use "restart"
        if (action === "restart") {
          proxmoxAction = "reboot";
        }

        await cluster.client.post(
          `/nodes/${node}/${type}/${vmid}/status/${proxmoxAction}`,
          {}
        );

        await recordAuditEntry({
          action: `${type}.${action}`,
          target,
          result: "success",
        });

        return {
          success: true,
        };
      } catch (err: any) {
        const detail = err.response?.data || err.message;

        await recordAuditEntry({
          action: `${type}.${action}`,
          target,
          result: "failure",
          detail: describeErrorDetail(detail),
        });

        reply.code(500).send({
          success: false,
          message: detail,
        });
      }
    }
  );
}
