import { FastifyInstance } from "fastify";
import { portainer } from "../services/portainer";

export default async function containerRoutes(app: FastifyInstance) {
  app.get("/api/containers", async (_, reply) => {
    try {
      // Get the first Portainer endpoint
      const endpoints = await portainer.get("/endpoints");
      const endpointId = endpoints.data[0].Id;

      // Get all containers
      const { data } = await portainer.get(
        `/endpoints/${endpointId}/docker/containers/json?all=true`
      );

      return data.map((container: any) => ({
        id: container.Id,
        name: container.Names?.[0]?.replace("/", "") || "",
        image: container.Image,
        imageId: container.ImageID,
        state: container.State,
        status: container.Status,
        command: container.Command,
        created: container.Created,
        ports: container.Ports,
        labels: container.Labels,
        mounts: container.Mounts,
        networkSettings: container.NetworkSettings,
      }));
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });

  app.get("/api/containers/:id", async (request: any, reply) => {
    try {
      const endpoints = await portainer.get("/endpoints");
      const endpointId = endpoints.data[0].Id;

      const { id } = request.params;

      const { data } = await portainer.get(
        `/endpoints/${endpointId}/docker/containers/${id}/json`
      );

      return data;
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });

  app.post("/api/containers/:id/start", async (request: any, reply) => {
    try {
      const endpoints = await portainer.get("/endpoints");
      const endpointId = endpoints.data[0].Id;

      const { id } = request.params;

      await portainer.post(
        `/endpoints/${endpointId}/docker/containers/${id}/start`
      );

      return {
        success: true,
        message: "Container started.",
      };
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });

  app.post("/api/containers/:id/stop", async (request: any, reply) => {
    try {
      const endpoints = await portainer.get("/endpoints");
      const endpointId = endpoints.data[0].Id;

      const { id } = request.params;

      await portainer.post(
        `/endpoints/${endpointId}/docker/containers/${id}/stop`
      );

      return {
        success: true,
        message: "Container stopped.",
      };
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });

  app.post("/api/containers/:id/restart", async (request: any, reply) => {
    try {
      const endpoints = await portainer.get("/endpoints");
      const endpointId = endpoints.data[0].Id;

      const { id } = request.params;

      await portainer.post(
        `/endpoints/${endpointId}/docker/containers/${id}/restart`
      );

      return {
        success: true,
        message: "Container restarted.",
      };
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });

  app.get("/api/containers/:id/logs", async (request: any, reply) => {
    try {
      const endpoints = await portainer.get("/endpoints");
      const endpointId = endpoints.data[0].Id;

      const { id } = request.params;

      const { data } = await portainer.get(
        `/endpoints/${endpointId}/docker/containers/${id}/logs?stdout=true&stderr=true&tail=200`
      );

      reply.type("text/plain");
      return data;
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });
}
