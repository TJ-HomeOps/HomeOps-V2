import type { FastifyInstance } from "fastify";
import { listMetrics } from "../services/metrics";

export default async function metricsRoutes(app: FastifyInstance) {
  app.get("/api/metrics", async () => {
    return listMetrics();
  });
}
