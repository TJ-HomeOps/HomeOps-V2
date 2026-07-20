import { FastifyInstance } from "fastify";
import { proxmox } from "../services/proxmox";

export default async function proxmoxRoutes(app: FastifyInstance) {
  app.get("/api/proxmox/overview", async (_, reply) => {
    try {
      const { data } = await proxmox.get("/cluster/resources");

      const resources = data.data;

      return {
        nodes: resources.filter((r: any) => r.type === "node"),
        vms: resources.filter((r: any) => r.type === "qemu"),
        lxcs: resources.filter((r: any) => r.type === "lxc"),
        storage: resources.filter((r: any) => r.type === "storage"),
        networks: resources.filter((r: any) => r.type === "network"),
      };
    } catch (err: any) {
      reply.code(500).send({
        success: false,
        message: err.message,
      });
    }
  });

  app.post(
    "/api/proxmox/:node/:type/:vmid/:action",
    async (request, reply) => {
      try {
        const { node, type, vmid, action } =
          request.params as {
            node: string;
            type: "qemu" | "lxc";
            vmid: string;
            action: string;
          };

        let proxmoxAction = action;

        // Allow the frontend to always use "restart"
        if (action === "restart") {
          proxmoxAction = "reboot";
        }

        await proxmox.post(
          `/nodes/${node}/${type}/${vmid}/status/${proxmoxAction}`,
          {}
        );

        return {
          success: true,
        };
      } catch (err: any) {
        reply.code(500).send({
          success: false,
          message: err.response?.data || err.message,
        });
      }
    }
  );
}
