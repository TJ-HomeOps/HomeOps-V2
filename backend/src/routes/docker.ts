import { FastifyInstance } from "fastify";
import { portainer } from "../services/portainer";

export default async function dockerRoutes(app: FastifyInstance) {
  app.get("/api/docker", async (_, reply) => {
    try {
      const endpoints = await portainer.get("/endpoints");
      const endpointId = endpoints.data[0].Id;

      const info = await portainer.get(
        `/endpoints/${endpointId}/docker/info`
      );

      return {
        serverVersion: info.data.ServerVersion,
        operatingSystem: info.data.OperatingSystem,
        containers: info.data.Containers,
        running: info.data.ContainersRunning,
        stopped: info.data.ContainersStopped,
        paused: info.data.ContainersPaused,
        images: info.data.Images,
        cpu: info.data.NCPU,
        memory: info.data.MemTotal,
      };
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });
}
