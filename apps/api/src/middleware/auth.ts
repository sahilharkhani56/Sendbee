import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { ROLE_PERMISSIONS, Permission } from "@whatsapp-crm/shared";

// ─── Fastify type augmentation ────────────────────────────
declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
    userId?: string;
    userRole?: string;
    userPermissions?: Permission[];
    adminId?: string;
    adminRole?: string;
  }
}

// ─── JWT payload types ────────────────────────────────────

export interface TenantTokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  type: "tenant";
}

export interface AdminTokenPayload {
  adminId: string;
  role: string;
  type: "super_admin";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh_tenant" | "refresh_admin";
}

// ─── Token helpers ────────────────────────────────────────

export function signTenantTokens(payload: Omit<TenantTokenPayload, "type">) {
  const accessToken = jwt.sign({ ...payload, type: "tenant" }, env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(
    { sub: payload.userId, type: "refresh_tenant" },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}

export function signAdminTokens(payload: Omit<AdminTokenPayload, "type">) {
  const accessToken = jwt.sign(
    { ...payload, type: "super_admin" },
    env.JWT_ADMIN_SECRET,
    { expiresIn: "30m" }
  );
  const refreshToken = jwt.sign(
    { sub: payload.adminId, type: "refresh_admin" },
    env.JWT_ADMIN_SECRET,
    { expiresIn: "24h" }
  );
  return { accessToken, refreshToken };
}

// ─── Tenant auth middleware ───────────────────────────────

export async function tenantAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return reply
      .status(401)
      .send({ error: { code: "AUTH_TOKEN_MISSING", message: "No token provided" } });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TenantTokenPayload;

    if (decoded.type !== "tenant") {
      return reply.status(403).send({
        error: {
          code: "AUTH_WRONG_CONTEXT",
          message: "Use admin panel for super admin access",
        },
      });
    }

    request.tenantId = decoded.tenantId;
    request.userId = decoded.userId;
    request.userRole = decoded.role;
    request.userPermissions = (ROLE_PERMISSIONS[decoded.role] ?? []) as Permission[];
  } catch {
    return reply
      .status(401)
      .send({ error: { code: "AUTH_TOKEN_INVALID", message: "Invalid or expired token" } });
  }
}

// ─── Super Admin auth middleware ──────────────────────────

export async function superAdminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return reply
      .status(401)
      .send({ error: { code: "AUTH_TOKEN_MISSING", message: "No token provided" } });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ADMIN_SECRET) as AdminTokenPayload;

    if (decoded.type !== "super_admin") {
      return reply
        .status(403)
        .send({ error: { code: "AUTH_NOT_ADMIN", message: "Not a super admin token" } });
    }

    request.adminId = decoded.adminId;
    request.adminRole = decoded.role;
  } catch {
    return reply
      .status(401)
      .send({ error: { code: "AUTH_TOKEN_INVALID", message: "Invalid or expired token" } });
  }
}

// ─── Permission middleware ────────────────────────────────

export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userPermissions?.includes(permission)) {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
    }
  };
}
