import { FastifyInstance } from "fastify";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "@whatsapp-crm/database";
import { env } from "../env";
import { redis } from "../redis";
import {
  tenantAuthMiddleware,
  signTenantTokens,
  requirePermission,
  RefreshTokenPayload,
} from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const inviteSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Phone must be E.164 format"),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "manager", "staff"]),
});

export async function tenantProtectedRoutes(app: FastifyInstance) {
  // ─── Token Refresh (no auth required — uses refresh token) ──
  app.post("/v1/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
      });
    }

    const { refreshToken } = parsed.data;

    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      return reply.status(401).send({
        error: { code: "AUTH_TOKEN_REVOKED", message: "Token has been revoked" },
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as RefreshTokenPayload;

      if (decoded.type !== "refresh_tenant") {
        return reply.status(401).send({
          error: { code: "AUTH_TOKEN_INVALID", message: "Invalid refresh token" },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { tenant: true },
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({
          error: { code: "AUTH_TOKEN_INVALID", message: "User not found or inactive" },
        });
      }

      // Blacklist old refresh token (rotation)
      await redis.set(`blacklist:${refreshToken}`, "1", { ex: 7 * 86400 });

      const tokens = signTenantTokens({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      });

      return tokens;
    } catch {
      return reply.status(401).send({
        error: { code: "AUTH_TOKEN_INVALID", message: "Invalid or expired refresh token" },
      });
    }
  });

  // ─── Logout (no auth required — uses refresh token) ─────
  app.post("/v1/auth/logout", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
      });
    }

    await redis.set(`blacklist:${parsed.data.refreshToken}`, "1", { ex: 7 * 86400 });
    return { message: "Logged out successfully" };
  });

  // ── Protected routes below require tenant auth ──────────
  app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", tenantAuthMiddleware);

    // ─── Get Current User ───────────────────────────────────
    protectedApp.get("/v1/auth/me", async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        include: { tenant: true },
      });

      if (!user) {
        return reply.status(404).send({ error: { code: "NOT_FOUND", message: "User not found" } });
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          permissions: request.userPermissions,
        },
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          businessVertical: user.tenant.businessVertical,
          verticalConfig: user.tenant.verticalConfig,
          plan: user.tenant.plan,
          planExpiresAt: user.tenant.planExpiresAt,
          status: user.tenant.status,
        },
      };
    });

    // ─── Team: Invite Member ────────────────────────────────
    protectedApp.post("/v1/team/invite", {
      preHandler: [requirePermission(PERMISSIONS.USERS_MANAGE)],
      handler: async (request, reply) => {
        const parsed = inviteSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const { phone, name, role } = parsed.data;

        const existing = await prisma.user.findUnique({
          where: { tenantId_phone: { tenantId: request.tenantId!, phone } },
        });

        if (existing) {
          return reply.status(409).send({
            error: { code: "ALREADY_EXISTS", message: "User already exists in this tenant" },
          });
        }

        if (role === "admin" && request.userRole !== "owner") {
          return reply.status(403).send({
            error: { code: "FORBIDDEN", message: "Only owners can invite admins" },
          });
        }

        const invited = await prisma.user.create({
          data: {
            tenantId: request.tenantId!,
            phone,
            name,
            role,
            isActive: false,
            invitedBy: request.userId,
          },
        });

        return {
          message: "Invitation sent",
          user: { id: invited.id, phone: invited.phone, name: invited.name, role: invited.role },
        };
      },
    });

    // ─── Team: List Members ─────────────────────────────────
    protectedApp.get("/v1/team", {
      preHandler: [requirePermission(PERMISSIONS.USERS_VIEW)],
      handler: async (request) => {
        const users = await prisma.user.findMany({
          where: { tenantId: request.tenantId! },
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        });

        return { users };
      },
    });

    // ─── Team: Remove Member ────────────────────────────────
    protectedApp.delete("/v1/team/:userId", {
      preHandler: [requirePermission(PERMISSIONS.USERS_MANAGE)],
      handler: async (request, reply) => {
        const { userId } = request.params as { userId: string };

        if (userId === request.userId) {
          return reply.status(400).send({
            error: { code: "CANNOT_REMOVE_SELF", message: "You cannot remove yourself" },
          });
        }

        const target = await prisma.user.findFirst({
          where: { id: userId, tenantId: request.tenantId! },
        });

        if (!target) {
          return reply.status(404).send({ error: { code: "NOT_FOUND", message: "User not found" } });
        }

        if (target.role === "owner") {
          return reply.status(403).send({
            error: { code: "FORBIDDEN", message: "Cannot remove the tenant owner" },
          });
        }

        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
        });

        return { message: "User deactivated", userId };
      },
    });
  });
}
