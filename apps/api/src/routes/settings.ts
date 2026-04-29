import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@whatsapp-crm/database";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";
import { env } from "../env";

// ═══════════════════════════════════════════════════════════
// Encryption helpers for WhatsApp access token
// ═══════════════════════════════════════════════════════════

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  // Derive a 32-byte key from JWT_SECRET (stable, always available)
  return crypto.createHash("sha256").update(env.JWT_SECRET).digest();
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(parts[0], "base64");
  const tag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return token.slice(0, 4) + "****" + token.slice(-4);
}

// ═══════════════════════════════════════════════════════════
// Validation Schemas
// ═══════════════════════════════════════════════════════════

const whatsappSettingsSchema = z.object({
  waPhoneId: z.string().min(1, "WhatsApp Phone ID is required"),
  waBusinessId: z.string().min(1, "WhatsApp Business ID is required"),
  waAccessToken: z.string().min(1, "WhatsApp Access Token is required"),
});

const businessProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
});

const dayHoursSchema = z.object({
  enabled: z.boolean(),
  open: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM").optional(),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM").optional(),
});

const businessHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

const awayMessageSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(1024).optional(),
  outsideHoursOnly: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════

export async function settingsRoutes(app: FastifyInstance) {
  // All settings routes require tenant auth
  app.addHook("onRequest", tenantAuthMiddleware);

  // ─────────────────────────────────────────────────────────
  // GET /v1/settings/whatsapp — Fetch WhatsApp account info
  // ─────────────────────────────────────────────────────────
  app.get(
    "/v1/settings/whatsapp",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: { waPhoneId: true, waBusinessId: true, waAccessToken: true },
      });

      if (!tenant) {
        return reply.status(404).send({
          error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
        });
      }

      return {
        waPhoneId: tenant.waPhoneId || null,
        waBusinessId: tenant.waBusinessId || null,
        waAccessToken: tenant.waAccessToken ? maskToken(tenant.waAccessToken.startsWith("EAA") ? tenant.waAccessToken : "****encrypted****") : null,
        isLinked: !!(tenant.waPhoneId && tenant.waBusinessId && tenant.waAccessToken),
      };
    }
  );

  // ─────────────────────────────────────────────────────────
  // PUT /v1/settings/whatsapp — Link WhatsApp account
  // ─────────────────────────────────────────────────────────
  app.put(
    "/v1/settings/whatsapp",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = whatsappSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
        });
      }

      const { waPhoneId, waBusinessId, waAccessToken } = parsed.data;

      // Encrypt the access token before storing
      const encryptedToken = encrypt(waAccessToken);

      await prisma.tenant.update({
        where: { id: request.tenantId! },
        data: {
          waPhoneId,
          waBusinessId,
          waAccessToken: encryptedToken,
        },
      });

      return {
        message: "WhatsApp account linked successfully",
        waPhoneId,
        waBusinessId,
        waAccessToken: maskToken(waAccessToken),
        isLinked: true,
      };
    }
  );

  // ─────────────────────────────────────────────────────────
  // DELETE /v1/settings/whatsapp — Unlink WhatsApp account
  // ─────────────────────────────────────────────────────────
  app.delete(
    "/v1/settings/whatsapp",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await prisma.tenant.update({
        where: { id: request.tenantId! },
        data: {
          waPhoneId: null,
          waBusinessId: null,
          waAccessToken: null,
        },
      });

      return { message: "WhatsApp account unlinked successfully" };
    }
  );

  // ─────────────────────────────────────────────────────────
  // GET /v1/settings/business — Fetch business profile
  // ─────────────────────────────────────────────────────────
  app.get(
    "/v1/settings/business",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: {
          name: true,
          email: true,
          businessVertical: true,
          verticalConfig: true,
          settings: true,
        },
      });

      if (!tenant) {
        return reply.status(404).send({
          error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
        });
      }

      const settings = (tenant.settings as Record<string, unknown>) || {};

      return {
        name: tenant.name,
        email: tenant.email,
        businessVertical: tenant.businessVertical,
        verticalConfig: tenant.verticalConfig,
        address: settings.address || null,
        city: settings.city || null,
        state: settings.state || null,
        pincode: settings.pincode || null,
        timezone: settings.timezone || "Asia/Kolkata",
        logoUrl: settings.logoUrl || null,
        website: settings.website || null,
      };
    }
  );

  // ─────────────────────────────────────────────────────────
  // PUT /v1/settings/business — Update business profile
  // ─────────────────────────────────────────────────────────
  app.put(
    "/v1/settings/business",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = businessProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
        });
      }

      const { name, email, address, city, state, pincode, timezone, logoUrl, website } = parsed.data;

      // Fetch existing settings to merge
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: { settings: true },
      });

      const existingSettings = (tenant?.settings as Record<string, unknown>) || {};

      // Merge new profile fields into settings JSONB
      const updatedSettings = {
        ...existingSettings,
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(timezone !== undefined && { timezone }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(website !== undefined && { website }),
      };

      // Update tenant — name/email are top-level columns, rest in settings JSONB
      const updateData: Record<string, unknown> = { settings: updatedSettings };
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      await prisma.tenant.update({
        where: { id: request.tenantId! },
        data: updateData,
      });

      return { message: "Business profile updated successfully" };
    }
  );

  // ─────────────────────────────────────────────────────────
  // GET /v1/settings/business-hours — Fetch business hours
  // ─────────────────────────────────────────────────────────
  app.get(
    "/v1/settings/business-hours",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: { settings: true },
      });

      if (!tenant) {
        return reply.status(404).send({
          error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
        });
      }

      const settings = (tenant.settings as Record<string, unknown>) || {};
      const defaultHours = {
        monday: { enabled: true, open: "09:00", close: "18:00" },
        tuesday: { enabled: true, open: "09:00", close: "18:00" },
        wednesday: { enabled: true, open: "09:00", close: "18:00" },
        thursday: { enabled: true, open: "09:00", close: "18:00" },
        friday: { enabled: true, open: "09:00", close: "18:00" },
        saturday: { enabled: true, open: "09:00", close: "14:00" },
        sunday: { enabled: false },
      };

      return {
        businessHours: settings.businessHours || defaultHours,
      };
    }
  );

  // ─────────────────────────────────────────────────────────
  // PUT /v1/settings/business-hours — Update business hours
  // ─────────────────────────────────────────────────────────
  app.put(
    "/v1/settings/business-hours",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = businessHoursSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
        });
      }

      // Validate: open < close for enabled days
      for (const [day, hours] of Object.entries(parsed.data)) {
        if (hours.enabled) {
          if (!hours.open || !hours.close) {
            return reply.status(400).send({
              error: {
                code: "VALIDATION_ERROR",
                message: `${day}: open and close times required when enabled`,
              },
            });
          }
          if (hours.open >= hours.close) {
            return reply.status(400).send({
              error: {
                code: "VALIDATION_ERROR",
                message: `${day}: open time must be before close time`,
              },
            });
          }
        }
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: { settings: true },
      });

      const existingSettings = (tenant?.settings as Record<string, unknown>) || {};

      await prisma.tenant.update({
        where: { id: request.tenantId! },
        data: {
          settings: { ...existingSettings, businessHours: parsed.data },
        },
      });

      return { message: "Business hours updated successfully", businessHours: parsed.data };
    }
  );

  // ─────────────────────────────────────────────────────────
  // GET /v1/settings/away-message — Fetch away message config
  // ─────────────────────────────────────────────────────────
  app.get(
    "/v1/settings/away-message",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: { settings: true },
      });

      if (!tenant) {
        return reply.status(404).send({
          error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
        });
      }

      const settings = (tenant.settings as Record<string, unknown>) || {};
      const defaultAway = {
        enabled: false,
        message: "Thank you for reaching out! We are currently away and will get back to you during business hours.",
        outsideHoursOnly: true,
      };

      return {
        awayMessage: settings.awayMessage || defaultAway,
      };
    }
  );

  // ─────────────────────────────────────────────────────────
  // PUT /v1/settings/away-message — Update away message
  // ─────────────────────────────────────────────────────────
  app.put(
    "/v1/settings/away-message",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = awayMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
        });
      }

      // If enabling, message must be provided
      if (parsed.data.enabled && !parsed.data.message) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Away message text is required when enabled",
          },
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: { settings: true },
      });

      const existingSettings = (tenant?.settings as Record<string, unknown>) || {};

      await prisma.tenant.update({
        where: { id: request.tenantId! },
        data: {
          settings: { ...existingSettings, awayMessage: parsed.data },
        },
      });

      return { message: "Away message updated successfully", awayMessage: parsed.data };
    }
  );

  // ─────────────────────────────────────────────────────────
  // GET /v1/settings/all — Fetch all settings at once
  // ─────────────────────────────────────────────────────────
  app.get(
    "/v1/settings/all",
    { preHandler: [requirePermission(PERMISSIONS.SETTINGS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: {
          name: true,
          email: true,
          businessVertical: true,
          verticalConfig: true,
          settings: true,
          waPhoneId: true,
          waBusinessId: true,
          waAccessToken: true,
          plan: true,
          planExpiresAt: true,
          status: true,
        },
      });

      if (!tenant) {
        return reply.status(404).send({
          error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
        });
      }

      const settings = (tenant.settings as Record<string, unknown>) || {};
      const defaultHours = {
        monday: { enabled: true, open: "09:00", close: "18:00" },
        tuesday: { enabled: true, open: "09:00", close: "18:00" },
        wednesday: { enabled: true, open: "09:00", close: "18:00" },
        thursday: { enabled: true, open: "09:00", close: "18:00" },
        friday: { enabled: true, open: "09:00", close: "18:00" },
        saturday: { enabled: true, open: "09:00", close: "14:00" },
        sunday: { enabled: false },
      };
      const defaultAway = {
        enabled: false,
        message: "Thank you for reaching out! We are currently away and will get back to you during business hours.",
        outsideHoursOnly: true,
      };

      return {
        business: {
          name: tenant.name,
          email: tenant.email,
          businessVertical: tenant.businessVertical,
          verticalConfig: tenant.verticalConfig,
          address: settings.address || null,
          city: settings.city || null,
          state: settings.state || null,
          pincode: settings.pincode || null,
          timezone: settings.timezone || "Asia/Kolkata",
          logoUrl: settings.logoUrl || null,
          website: settings.website || null,
        },
        whatsapp: {
          waPhoneId: tenant.waPhoneId || null,
          waBusinessId: tenant.waBusinessId || null,
          isLinked: !!(tenant.waPhoneId && tenant.waBusinessId && tenant.waAccessToken),
        },
        businessHours: settings.businessHours || defaultHours,
        awayMessage: settings.awayMessage || defaultAway,
        plan: tenant.plan,
        planExpiresAt: tenant.planExpiresAt,
        status: tenant.status,
      };
    }
  );
}
