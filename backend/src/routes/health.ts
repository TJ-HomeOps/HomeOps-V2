import { FastifyInstance } from "fastify";

export default async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => {
    return {
      status: "ok",
      service: "HomeOps",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    };
  });
}
