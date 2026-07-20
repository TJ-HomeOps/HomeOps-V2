import { FastifyInstance } from "fastify";
import { portainer } from "../services/portainer";

export default async function endpointRoutes(app: FastifyInstance) {
  app.get("/api/endpoints", async (_, reply) => {
    try {
      const { data } = await portainer.get("/endpoints");

      return data.map((endpoint: any) => ({
        id: endpoint.Id,
        name: endpoint.Name,
        type: endpoint.Type,
        status: endpoint.Status,
        url: endpoint.URL,
      }));
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });
}
