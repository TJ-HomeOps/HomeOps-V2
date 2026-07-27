import type { FastifyInstance } from "fastify";
import { listAuditEntries } from "../services/audit";

export default async function auditRoutes(app: FastifyInstance) {
  app.get("/api/audit", async () => {
    return listAuditEntries();
  });
}
