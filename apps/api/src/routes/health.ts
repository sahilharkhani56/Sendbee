import { FastifyInstance } from "fastify";
import { prisma } from "@whatsapp-crm/database";

export async function healthRoutes(app: FastifyInstance) {
  // Basic liveness check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Readiness check — verifies DB connectivity
  app.get("/health/ready", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready", db: "connected" };
    } catch (err) {
      reply.status(503);
      return { status: "not_ready", db: "disconnected" };
    }
  });
}
