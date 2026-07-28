import type { FastifyInstance } from "fastify";
import {
  getIntegrations,
  getProxmoxClusters,
  setProxmoxClusters,
  updateIntegration,
  type ProxmoxClusterEntry,
} from "../services/integrations";
import { describeErrorDetail, recordAuditEntry } from "../services/audit";

export default async function integrationRoutes(app: FastifyInstance) {
  app.get("/api/integrations", async (_, reply) => {
    try {
      const [integrations, proxmoxClusters] = await Promise.all([
        getIntegrations(),
        getProxmoxClusters(),
      ]);

      return { integrations, proxmoxClusters };
    } catch (err: any) {
      console.error(err.message);
      reply.code(500).send({ message: err.message });
    }
  });

  app.put<{ Params: { key: string }; Body: Record<string, string> }>(
    "/api/integrations/:key",
    async (request, reply) => {
      const { key } = request.params;

      try {
        await updateIntegration(key, request.body ?? {});

        await recordAuditEntry({
          action: "integration.update",
          target: key,
          result: "success",
        });

        return { success: true };
      } catch (err: any) {
        const detail = describeErrorDetail(err.message || err);

        await recordAuditEntry({
          action: "integration.update",
          target: key,
          result: "failure",
          detail,
        });

        console.error(detail);
        reply.code(400).send({ message: detail });
      }
    }
  );

  app.put<{ Body: { clusters: ProxmoxClusterEntry[] } }>(
    "/api/integrations/proxmox-clusters",
    async (request, reply) => {
      try {
        await setProxmoxClusters(request.body?.clusters ?? []);

        await recordAuditEntry({
          action: "integration.update",
          target: "proxmoxClusters",
          result: "success",
        });

        return { success: true };
      } catch (err: any) {
        const detail = describeErrorDetail(err.message || err);

        await recordAuditEntry({
          action: "integration.update",
          target: "proxmoxClusters",
          result: "failure",
          detail,
        });

        console.error(detail);
        reply.code(400).send({ message: detail });
      }
    }
  );
}
