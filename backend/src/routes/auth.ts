import type { FastifyInstance } from "fastify";
import {
  SESSION_COOKIE_NAME,
  disable,
  enable,
  getStatus,
  login,
} from "../services/auth";

const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function sessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; HttpOnly; SameSite=Lax; Max-Age=${sessionMaxAgeSeconds}; Path=/`;
}

function clearedSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}

function isValidPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 4;
}

export default async function authRoutes(app: FastifyInstance) {
  app.get("/api/auth/status", async () => {
    return getStatus();
  });

  // Not in the guard's public-path list, so this 401s unless the caller
  // already has a valid session — used purely as an "am I logged in" probe.
  app.get("/api/auth/session", async () => {
    return { ok: true };
  });

  app.post<{ Body: { password?: string } }>(
    "/api/auth/login",
    async (request, reply) => {
      const { password } = request.body ?? {};

      if (!isValidPassword(password)) {
        return reply.code(400).send({ message: "Password is required." });
      }

      try {
        const token = await login(password);
        reply.header("Set-Cookie", sessionCookie(token));

        return { ok: true };
      } catch (err: any) {
        reply.code(401).send({ message: err.message });
      }
    }
  );

  app.post<{ Body: { password?: string } }>(
    "/api/auth/enable",
    async (request, reply) => {
      const { password } = request.body ?? {};

      if (!isValidPassword(password)) {
        return reply
          .code(400)
          .send({ message: "Password must be at least 4 characters." });
      }

      const token = await enable(password);
      reply.header("Set-Cookie", sessionCookie(token));

      return { ok: true };
    }
  );

  app.post("/api/auth/disable", async (_request, reply) => {
    await disable();
    reply.header("Set-Cookie", clearedSessionCookie());

    return { ok: true };
  });
}
