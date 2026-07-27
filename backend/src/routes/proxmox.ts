import type { FastifyInstance } from "fastify";
import { proxmox } from "../services/proxmox";
import { describeErrorDetail, recordAuditEntry } from "../services/audit";
import type { ProxmoxResource } from "../types/proxmox";

export default async function proxmoxRoutes(app: FastifyInstance) {
  app.get("/api/proxmox/overview", async (_, reply) => {
    try {
      const { data } = await proxmox.get("/cluster/resources");
      const resources = data.data as ProxmoxResource[];

      return {
        nodes: resources.filter((r) => r.type === "node"),
        vms: resources.filter((r) => r.type === "qemu"),
        lxcs: resources.filter((r) => r.type === "lxc"),
        storage: resources.filter((r) => r.type === "storage"),
        networks: resources.filter((r) => r.type === "network"),
      };
    } catch (err: any) {
      reply.code(500).send({
        success: false,
        message: err.message,
      });
    }
  });

  // Extended single-node status (PVE/kernel version, per-core CPU, swap,
  // load average) beyond what /cluster/resources carries, plus the node's
  // storage volumes.
  app.get<{ Params: { node: string } }>(
    "/api/proxmox/nodes/:node",
    async (request, reply) => {
      const { node } = request.params;

      try {
        const [statusRes, storageRes] = await Promise.all([
          proxmox.get(`/nodes/${node}/status`),
          proxmox.get(`/nodes/${node}/storage`),
        ]);

        return {
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
  app.get<{ Params: { node: string; vmid: string } }>(
    "/api/proxmox/vms/:node/:vmid",
    async (request, reply) => {
      const { node, vmid } = request.params;

      try {
        const [statusRes, configRes] = await Promise.all([
          proxmox.get(`/nodes/${node}/qemu/${vmid}/status/current`),
          proxmox.get(`/nodes/${node}/qemu/${vmid}/config`),
        ]);

        return {
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

  app.get<{ Params: { node: string; vmid: string } }>(
    "/api/proxmox/lxc/:node/:vmid",
    async (request, reply) => {
      const { node, vmid } = request.params;

      try {
        const [statusRes, configRes] = await Promise.all([
          proxmox.get(`/nodes/${node}/lxc/${vmid}/status/current`),
          proxmox.get(`/nodes/${node}/lxc/${vmid}/config`),
        ]);

        return {
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

  app.post(
    "/api/proxmox/:node/:type/:vmid/:action",
    async (request, reply) => {
      const { node, type, vmid, action } =
        request.params as {
          node: string;
          type: "qemu" | "lxc";
          vmid: string;
          action: string;
        };

      const target = `${type}:${vmid} on ${node}`;

      try {
        let proxmoxAction = action;

        // Allow the frontend to always use "restart"
        if (action === "restart") {
          proxmoxAction = "reboot";
        }

        await proxmox.post(
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
