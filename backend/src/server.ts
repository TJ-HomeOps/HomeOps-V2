import Fastify from "fastify";
import cors from "@fastify/cors";
import websocketPlugin from "@fastify/websocket";
import swaggerPlugin from "@fastify/swagger";

import healthRoutes from "./routes/health";
import endpointRoutes from "./routes/endpoints";
import dockerRoutes from "./routes/docker";
import systemRoutes from "./routes/system";
import containerRoutes from "./routes/containers";
import proxmoxRoutes from "./routes/proxmox";
import cameraRoutes from "./routes/camera";
import notificationRoutes from "./routes/notifications";
import metricsRoutes from "./routes/metrics";
import auditRoutes from "./routes/audit";
import updateRoutes from "./routes/updates";
import integrationRoutes from "./routes/integrations";
import wsRoutes from "./routes/ws";
import authRoutes from "./routes/auth";
import settingsAuthRoutes from "./routes/settingsAuth";
import docsRoutes from "./routes/docs";
import { startWatchers } from "./services/watchers";
import { startSystemAlertWatcher } from "./services/alerts";
import { startSensorWatcher } from "./services/sensors";
import { SESSION_COOKIE_NAME, isSessionValid } from "./services/auth";
import {
  SETTINGS_SESSION_COOKIE_NAME,
  isSessionValid as isSettingsSessionValid,
} from "./services/settingsAuth";

// Only these endpoints are reachable before a session exists — the rest,
// including /api/auth/enable and /api/auth/disable (and their settings-lock
// equivalents), are covered by the lockEnabled check inside isSessionValid,
// since enabling requires no prior session only while the lock is currently
// off.
const publicAuthPaths = new Set([
  "/api/auth/status",
  "/api/auth/login",
  "/api/settings-auth/status",
  "/api/settings-auth/login",
]);

function readCookie(
  header: string | undefined,
  name: string
): string | undefined {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim();

    if (key === name) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }

  return undefined;
}

const app = Fastify({
  logger: true,
});

async function start() {
  try {
    await app.register(cors, {
      origin: [
        "http://192.168.0.20:5173",
        "http://localhost:5173",
      ],
      credentials: true,
    });
    await app.register(websocketPlugin);
    await app.register(swaggerPlugin, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "HomeOps API",
          description:
            "Backend API for HomeOps — Proxmox, Docker, notifications, metrics, and audit data.",
          version: "1.0.0",
        },
      },
    });

    app.addHook("onRequest", async (request, reply) => {
      const path = request.url.split("?")[0] ?? request.url;

      if (publicAuthPaths.has(path)) {
        return;
      }

      const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
      const valid = await isSessionValid(token);

      if (!valid) {
        reply.code(401).send({ message: "Authentication required." });
        return;
      }

      // Integrations hold real API credentials, so they get a second,
      // independent lock on top of the app-wide one above.
      if (path.startsWith("/api/integrations")) {
        const settingsToken = readCookie(
          request.headers.cookie,
          SETTINGS_SESSION_COOKIE_NAME
        );
        const settingsValid = await isSettingsSessionValid(settingsToken);

        if (!settingsValid) {
          reply.code(401).send({ message: "Settings unlock required." });
        }
      }
    });

    // Register API routes
    await app.register(authRoutes);
    await app.register(settingsAuthRoutes);
    await app.register(integrationRoutes);
    await app.register(healthRoutes);
    await app.register(endpointRoutes);
    await app.register(dockerRoutes);
    await app.register(systemRoutes);
    await app.register(containerRoutes);
    await app.register(proxmoxRoutes);
    await app.register(cameraRoutes);
    await app.register(notificationRoutes);
    await app.register(metricsRoutes);
    await app.register(auditRoutes);
    await app.register(updateRoutes);
    await app.register(wsRoutes);
    await app.register(docsRoutes);

    startWatchers(app);
    startSystemAlertWatcher(app);
    startSensorWatcher(app);

    await app.listen({
      host: "0.0.0.0",
      port: 3000,
    });

    console.log("🚀 HomeOps API started on port 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// tsx watch (and any other supervisor) kills the process directly with
// SIGTERM on every restart. Fastify's onClose hooks — which is how the
// camera route stops its ffmpeg relay — only run via app.close(), so without
// this handler every restart orphaned the relay process instead of stopping
// it.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    void app.close().finally(() => process.exit(0));
  });
}

start();
