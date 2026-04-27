import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env";
import { healthRoutes } from "./routes/health";
import { tenantAuthRoutes } from "./routes/tenant-auth";
import { tenantProtectedRoutes } from "./routes/tenant-protected";
import { adminAuthRoutes } from "./routes/admin-auth";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  // ─── Plugins ────────────────────────────
  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(","),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // ─── Routes ─────────────────────────────
  await app.register(healthRoutes);
  await app.register(tenantAuthRoutes);       // /v1/auth/otp/*
  await app.register(tenantProtectedRoutes);  // /v1/auth/refresh, /v1/team/*
  await app.register(adminAuthRoutes);        // /admin/auth/*, /admin/tenants/*

  return app;
}
