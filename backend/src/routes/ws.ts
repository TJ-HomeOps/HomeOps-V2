import type { FastifyInstance } from "fastify";
import { addClient, removeClient } from "../services/broadcast";

export default async function wsRoutes(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket) => {
    addClient(socket);

    socket.on("close", () => {
      removeClient(socket);
    });
  });
}
