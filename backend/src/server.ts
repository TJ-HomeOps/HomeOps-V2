import Fastify from "fastify";
import cors from "@fastify/cors";

import healthRoutes from "./routes/health";
import endpointRoutes from "./routes/endpoints";
import dockerRoutes from "./routes/docker";
import systemRoutes from "./routes/system";
import containerRoutes from "./routes/containers";
import proxmoxRoutes from "./routes/proxmox";

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
    });

    // Register API routes
    await app.register(healthRoutes);
    await app.register(endpointRoutes);
    await app.register(dockerRoutes);
    await app.register(systemRoutes);
    await app.register(containerRoutes);
    await app.register(proxmoxRoutes);

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

start();
