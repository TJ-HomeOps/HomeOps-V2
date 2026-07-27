import type { FastifyInstance } from "fastify";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";

export default async function notificationRoutes(app: FastifyInstance) {
  app.get("/api/notifications", async () => {
    return listNotifications();
  });

  app.post<{ Params: { id: string } }>(
    "/api/notifications/:id/read",
    async (request, reply) => {
      const updated = await markNotificationRead(request.params.id);

      if (!updated) {
        return reply.code(404).send({
          message: "Notification not found.",
        });
      }

      return { success: true };
    }
  );

  app.post("/api/notifications/read-all", async () => {
    await markAllNotificationsRead();

    return { success: true };
  });
}
