import type { FastifyInstance } from "fastify";
import { getSystemStats } from "../services/system";

export default async function systemRoutes(app: FastifyInstance) {
  app.get("/api/system", async (_, reply) => {
    try {
      return getSystemStats();
    } catch (err: any) {
      console.error(err);
      reply.code(500).send(err.message);
    }
  });
}
