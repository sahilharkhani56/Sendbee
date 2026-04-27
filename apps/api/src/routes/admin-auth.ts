import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@whatsapp-crm/database";
import { env } from "../env";
import { redis } from "../redis";
import {
  signAdminTokens,
  superAdminAuthMiddleware,
  RefreshTokenPayload,
} from "../middleware/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function adminAuthRoutes(app: FastifyInstance) {
  // ─── Super Admin Login ──────────────────────────────────
  app.post("/admin/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
      });
    }

    const { email, password } = parsed.data;

    const admin = await prisma.superAdmin.findUnique({ where: { email } });
    // Use same error for both missing user and wrong password (prevent enumeration)
    if (!admin || !admin.isActive) {
      return reply.status(401).send({
        error: { code: "AUTH_INVALID_CREDENTIALS", message: "Invalid email or password" },
      });
    }

    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({
        error: { code: "AUTH_INVALID_CREDENTIALS", message: "Invalid email or password" },
      });
    }

    await prisma.superAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await prisma.platformAuditLog.create({
      data: {
        actorType: "super_admin",
        actorId: admin.id,
        action: "admin.login",
        targetType: "super_admin",
        targetId: admin.id,
        metadata: {},
      },
    });

    const tokens = signAdminTokens({ adminId: admin.id, role: admin.role });

    return {
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      ...tokens,
    };
  });

  // ─── Admin Token Refresh ────────────────────────────────
  app.post("/admin/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
      });
    }

    const { refreshToken } = parsed.data;

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      return reply.status(401).send({
        error: { code: "AUTH_TOKEN_REVOKED", message: "Token has been revoked" },
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_ADMIN_SECRET) as RefreshTokenPayload;

      if (decoded.type !== "refresh_admin") {
        return reply.status(401).send({
          error: { code: "AUTH_TOKEN_INVALID", message: "Invalid refresh token" },
        });
      }

      const admin = await prisma.superAdmin.findUnique({ where: { id: decoded.sub } });
      if (!admin || !admin.isActive) {
        return reply.status(401).send({
          error: { code: "AUTH_TOKEN_INVALID", message: "Admin not found" },
        });
      }

      // Blacklist old refresh token
      await redis.set(`blacklist:${refreshToken}`, "1", { ex: 86400 });

      const tokens = signAdminTokens({ adminId: admin.id, role: admin.role });
      return tokens;
    } catch {
      return reply.status(401).send({
        error: { code: "AUTH_TOKEN_INVALID", message: "Invalid or expired refresh token" },
      });
    }
  });

  // ─── Admin Logout ───────────────────────────────────────
  app.post("/admin/auth/logout", {
    preHandler: [superAdminAuthMiddleware],
    handler: async (request, reply) => {
      const parsed = refreshSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
        });
      }

      // Blacklist the refresh token
      await redis.set(`blacklist:${parsed.data.refreshToken}`, "1", { ex: 86400 });

      return { message: "Logged out successfully" };
    },
  });

  // ─── Protected: List Tenants ────────────────────────────
  app.get("/admin/tenants", {
    preHandler: [superAdminAuthMiddleware],
    handler: async (request) => {
      const query = request.query as { page?: string; limit?: string; search?: string };
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
      const skip = (page - 1) * limit;

      const where = query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { slug: { contains: query.search, mode: "insensitive" as const } },
              { phone: { contains: query.search } },
            ],
          }
        : {};

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            businessVertical: true,
            status: true,
            plan: true,
            createdAt: true,
            _count: { select: { users: true, contacts: true } },
          },
        }),
        prisma.tenant.count({ where }),
      ]);

      // Audit log for viewing tenants
      await prisma.platformAuditLog.create({
        data: {
          actorType: "super_admin",
          actorId: request.adminId!,
          action: "tenants.list",
          targetType: "tenant",
          targetId: "all",
          metadata: { search: query.search || null, page },
        },
      });

      return { tenants, total, page, limit };
    },
  });

  // ─── Protected: Suspend Tenant ──────────────────────────
  app.post("/admin/tenants/:id/suspend", {
    preHandler: [superAdminAuthMiddleware],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { reason?: string };

      const tenant = await prisma.tenant.findUnique({ where: { id } });
      if (!tenant) {
        return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Tenant not found" } });
      }

      await prisma.tenant.update({
        where: { id },
        data: {
          status: "suspended",
          suspendedBy: request.adminId,
          suspendedReason: body.reason || "Suspended by admin",
        },
      });

      await prisma.platformAuditLog.create({
        data: {
          actorType: "super_admin",
          actorId: request.adminId!,
          action: "tenant.suspend",
          targetType: "tenant",
          targetId: id,
          metadata: { reason: body.reason || "Suspended by admin" },
        },
      });

      return { message: "Tenant suspended", tenantId: id };
    },
  });

  // ─── Protected: Activate Tenant ─────────────────────────
  app.post("/admin/tenants/:id/activate", {
    preHandler: [superAdminAuthMiddleware],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const tenant = await prisma.tenant.findUnique({ where: { id } });
      if (!tenant) {
        return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Tenant not found" } });
      }

      await prisma.tenant.update({
        where: { id },
        data: { status: "active", suspendedBy: null, suspendedReason: null },
      });

      await prisma.platformAuditLog.create({
        data: {
          actorType: "super_admin",
          actorId: request.adminId!,
          action: "tenant.activate",
          targetType: "tenant",
          targetId: id,
          metadata: {},
        },
      });

      return { message: "Tenant activated", tenantId: id };
    },
  });

  // ─── Protected: Platform Stats ──────────────────────────
  app.get("/admin/stats", {
    preHandler: [superAdminAuthMiddleware],
    handler: async () => {
      const [totalTenants, totalUsers, totalContacts] = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.contact.count(),
      ]);

      return { totalTenants, totalUsers, totalContacts };
    },
  });
}
