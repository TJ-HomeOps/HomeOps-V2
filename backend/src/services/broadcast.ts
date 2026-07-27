import type { WebSocket } from "@fastify/websocket";

const clients = new Set<WebSocket>();

export function addClient(socket: WebSocket): void {
  clients.add(socket);
}

export function removeClient(socket: WebSocket): void {
  clients.delete(socket);
}

export function broadcast(message: unknown): void {
  const payload = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}
