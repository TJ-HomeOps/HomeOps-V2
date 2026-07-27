import type { FastifyInstance } from "fastify";

export default async function docsRoutes(app: FastifyInstance) {
  // Plain JSON, not a rendered UI: @fastify/swagger-ui pulls in
  // @fastify/static, which currently has an unpatched high-severity
  // path-traversal/auth-bypass advisory. Point an external tool (Swagger
  // Editor, Postman, Insomnia) at this instead of running that here.
  app.get("/api/docs/openapi.json", async () => {
    return app.swagger();
  });
}
