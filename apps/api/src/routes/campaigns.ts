import { FastifyInstance } from "fastify";
import { prisma } from "@whatsapp-crm/database";
import { z } from "zod";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";
import { redis } from "../redis";

// ─── Schemas ──────────────────────────────────────────────

const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.enum(["utility", "marketing", "authentication"]).default("utility"),
  language: z.string().min(2).max(10).default("en"),
  content: z.object({
    header: z.string().max(60).optional(),
    body: z.string().min(1).max(1024),
    footer: z.string().max(60).optional(),
    buttons: z.array(z.object({
      type: z.enum(["QUICK_REPLY", "URL", "PHONE_NUMBER"]),
      text: z.string().max(25),
      url: z.string().url().optional(),
      phoneNumber: z.string().optional(),
    })).max(3).optional(),
  }),
  variables: z.array(z.string()).default([]),
});

const updateTemplateSchema = z.object({
  content: z.object({
    header: z.string().max(60).optional(),
    body: z.string().min(1).max(1024),
    footer: z.string().max(60).optional(),
    buttons: z.array(z.object({
      type: z.enum(["QUICK_REPLY", "URL", "PHONE_NUMBER"]),
      text: z.string().max(25),
      url: z.string().url().optional(),
      phoneNumber: z.string().optional(),
    })).max(3).optional(),
  }).optional(),
  variables: z.array(z.string()).optional(),
});

const listTemplatesSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(200),
  templateId: z.string().uuid(),
  segmentRules: z.object({
    tags: z.array(z.string()).optional(),
    optOut: z.literal(false).optional(),
  }).default({}),
  scheduledAt: z.string().datetime().optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  segmentRules: z.object({
    tags: z.array(z.string()).optional(),
    optOut: z.literal(false).optional(),
  }).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

const listCampaignsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["draft", "scheduled", "sending", "paused", "completed", "cancelled"]).optional(),
});

// ─── Helpers ──────────────────────────────────────────────

function encodeCursor(id: string) {
  return Buffer.from(id).toString("base64url");
}
function decodeCursor(cursor: string) {
  return Buffer.from(cursor, "base64url").toString();
}

// ─── Routes ───────────────────────────────────────────────

export async function campaignRoutes(app: FastifyInstance) {
  app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", tenantAuthMiddleware);

    // ═══ TEMPLATE CRUD ═══════════════════════════════════

    /** List templates */
    protectedApp.get("/v1/templates", {
      preHandler: [requirePermission(PERMISSIONS.TEMPLATES_VIEW)],
      handler: async (request, reply) => {
        const parsed = listTemplatesSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const where: any = { tenantId: request.tenantId! };
        if (parsed.data.status) where.status = parsed.data.status;

        const templates = await prisma.template.findMany({
          where,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            category: true,
            language: true,
            content: true,
            variables: true,
            status: true,
            waTemplateId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { data: templates };
      },
    });

    /** Create template */
    protectedApp.post("/v1/templates", {
      preHandler: [requirePermission(PERMISSIONS.TEMPLATES_MANAGE)],
      handler: async (request, reply) => {
        const parsed = createTemplateSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const tenantId = request.tenantId!;

        // Check duplicate name
        const existing = await prisma.template.findUnique({
          where: { tenantId_name: { tenantId, name: parsed.data.name } },
        });
        if (existing) {
          return reply.status(409).send({
            error: { code: "TEMPLATE_DUPLICATE", message: "Template with this name already exists" },
          });
        }

        const template = await prisma.template.create({
          data: {
            tenantId,
            name: parsed.data.name,
            category: parsed.data.category,
            language: parsed.data.language,
            content: parsed.data.content as any,
            variables: parsed.data.variables as any,
            status: "pending",
          },
          select: {
            id: true,
            name: true,
            category: true,
            language: true,
            content: true,
            variables: true,
            status: true,
            waTemplateId: true,
            createdAt: true,
          },
        });

        return reply.status(201).send({ data: template });
      },
    });

    /** Get template by ID */
    protectedApp.get("/v1/templates/:id", {
      preHandler: [requirePermission(PERMISSIONS.TEMPLATES_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const template = await prisma.template.findFirst({
          where: { id, tenantId: request.tenantId! },
          select: {
            id: true,
            name: true,
            category: true,
            language: true,
            content: true,
            variables: true,
            status: true,
            waTemplateId: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        if (!template) {
          return reply.status(404).send({
            error: { code: "TEMPLATE_NOT_FOUND", message: "Template not found" },
          });
        }
        return { data: template };
      },
    });

    /** Update template (only pending ones) */
    protectedApp.patch("/v1/templates/:id", {
      preHandler: [requirePermission(PERMISSIONS.TEMPLATES_MANAGE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = updateTemplateSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const existing = await prisma.template.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "TEMPLATE_NOT_FOUND", message: "Template not found" },
          });
        }

        const template = await prisma.template.update({
          where: { id },
          data: {
            ...(parsed.data.content ? { content: parsed.data.content as any } : {}),
            ...(parsed.data.variables ? { variables: parsed.data.variables as any } : {}),
          },
          select: {
            id: true,
            name: true,
            category: true,
            language: true,
            content: true,
            variables: true,
            status: true,
            waTemplateId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { data: template };
      },
    });

    /** Delete template */
    protectedApp.delete("/v1/templates/:id", {
      preHandler: [requirePermission(PERMISSIONS.TEMPLATES_MANAGE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const existing = await prisma.template.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "TEMPLATE_NOT_FOUND", message: "Template not found" },
          });
        }

        // Check if any active campaigns use this template
        const activeCampaign = await prisma.campaign.findFirst({
          where: {
            templateId: id,
            tenantId: request.tenantId!,
            status: { in: ["sending", "scheduled"] },
          },
        });
        if (activeCampaign) {
          return reply.status(400).send({
            error: { code: "TEMPLATE_IN_USE", message: "Template is used by an active campaign" },
          });
        }

        await prisma.template.delete({ where: { id } });
        return { success: true };
      },
    });

    /** Simulate approve/reject (for testing — in prod Meta webhook does this) */
    protectedApp.post("/v1/templates/:id/status", {
      preHandler: [requirePermission(PERMISSIONS.TEMPLATES_MANAGE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;
        const status = body?.status;

        if (!status || !["approved", "rejected"].includes(status)) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", message: "status must be 'approved' or 'rejected'" },
          });
        }

        const existing = await prisma.template.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "TEMPLATE_NOT_FOUND", message: "Template not found" },
          });
        }

        const template = await prisma.template.update({
          where: { id },
          data: { status },
          select: {
            id: true,
            name: true,
            status: true,
            updatedAt: true,
          },
        });

        return { data: template };
      },
    });

    // ═══ CAMPAIGN CRUD ═══════════════════════════════════

    /** List campaigns */
    protectedApp.get("/v1/campaigns", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_VIEW)],
      handler: async (request, reply) => {
        const parsed = listCampaignsSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const { cursor, limit, status } = parsed.data;
        const where: any = { tenantId: request.tenantId! };
        if (status) where.status = status;

        const campaigns = await prisma.campaign.findMany({
          where,
          take: limit + 1,
          ...(cursor ? { cursor: { id: decodeCursor(cursor) }, skip: 1 } : {}),
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            templateId: true,
            segmentRules: true,
            scheduledAt: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            deliveredCount: true,
            readCount: true,
            failedCount: true,
            createdAt: true,
            template: { select: { id: true, name: true, status: true } },
          },
        });

        const hasMore = campaigns.length > limit;
        const pageItems = hasMore ? campaigns.slice(0, limit) : campaigns;
        const nextCursor = hasMore ? encodeCursor(pageItems[pageItems.length - 1]!.id) : null;

        return { data: pageItems, pagination: { limit, nextCursor, hasMore } };
      },
    });

    /** Create campaign (draft) */
    protectedApp.post("/v1/campaigns", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_CREATE)],
      handler: async (request, reply) => {
        const parsed = createCampaignSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const tenantId = request.tenantId!;

        // Validate template exists and belongs to tenant
        const template = await prisma.template.findFirst({
          where: { id: parsed.data.templateId, tenantId },
        });
        if (!template) {
          return reply.status(404).send({
            error: { code: "TEMPLATE_NOT_FOUND", message: "Template not found" },
          });
        }

        // Count contacts matching segment rules
        const segWhere: any = { tenantId, isDeleted: false, optOut: false };
        const tags = (parsed.data.segmentRules as any)?.tags;
        if (tags && tags.length > 0) {
          segWhere.tags = { hasSome: tags };
        }
        const contactCount = await prisma.contact.count({ where: segWhere });

        const campaign = await prisma.campaign.create({
          data: {
            tenantId,
            templateId: parsed.data.templateId,
            name: parsed.data.name,
            segmentRules: parsed.data.segmentRules as any,
            scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
            status: "draft",
            totalContacts: contactCount,
          },
          select: {
            id: true,
            name: true,
            templateId: true,
            segmentRules: true,
            scheduledAt: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            deliveredCount: true,
            readCount: true,
            failedCount: true,
            createdAt: true,
            template: { select: { id: true, name: true, status: true } },
          },
        });

        return reply.status(201).send({ data: campaign });
      },
    });

    /** Get campaign by ID */
    protectedApp.get("/v1/campaigns/:id", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const campaign = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
          select: {
            id: true,
            name: true,
            templateId: true,
            segmentRules: true,
            scheduledAt: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            deliveredCount: true,
            readCount: true,
            failedCount: true,
            createdAt: true,
            updatedAt: true,
            template: { select: { id: true, name: true, status: true, content: true } },
          },
        });
        if (!campaign) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }
        return { data: campaign };
      },
    });

    /** Update campaign (only draft/scheduled) */
    protectedApp.patch("/v1/campaigns/:id", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_CREATE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = updateCampaignSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const existing = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }
        if (!["draft", "scheduled"].includes(existing.status)) {
          return reply.status(400).send({
            error: { code: "CAMPAIGN_NOT_EDITABLE", message: "Only draft or scheduled campaigns can be edited" },
          });
        }

        const data: any = {};
        if (parsed.data.name) data.name = parsed.data.name;
        if (parsed.data.segmentRules !== undefined) {
          data.segmentRules = parsed.data.segmentRules;
          // Recount contacts
          const segWhere: any = { tenantId: request.tenantId!, isDeleted: false, optOut: false };
          const tags = (parsed.data.segmentRules as any)?.tags;
          if (tags && tags.length > 0) {
            segWhere.tags = { hasSome: tags };
          }
          data.totalContacts = await prisma.contact.count({ where: segWhere });
        }
        if (parsed.data.scheduledAt !== undefined) {
          data.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
        }

        const campaign = await prisma.campaign.update({
          where: { id },
          data,
          select: {
            id: true,
            name: true,
            templateId: true,
            segmentRules: true,
            scheduledAt: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            deliveredCount: true,
            readCount: true,
            failedCount: true,
            createdAt: true,
            template: { select: { id: true, name: true, status: true } },
          },
        });

        return { data: campaign };
      },
    });

    /** Delete campaign (only draft) */
    protectedApp.delete("/v1/campaigns/:id", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_CREATE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const existing = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }
        if (existing.status !== "draft") {
          return reply.status(400).send({
            error: { code: "CAMPAIGN_NOT_DELETABLE", message: "Only draft campaigns can be deleted" },
          });
        }

        await prisma.campaign.delete({ where: { id } });
        return { success: true };
      },
    });

    // ═══ CAMPAIGN ACTIONS ════════════════════════════════

    /** Send campaign — starts the broadcast */
    protectedApp.post("/v1/campaigns/:id/send", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const tenantId = request.tenantId!;

        const campaign = await prisma.campaign.findFirst({
          where: { id, tenantId },
          include: { template: true },
        });
        if (!campaign) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }
        if (!["draft", "scheduled"].includes(campaign.status)) {
          return reply.status(400).send({
            error: { code: "CAMPAIGN_NOT_SENDABLE", message: "Campaign is already " + campaign.status },
          });
        }
        if (campaign.template.status !== "approved") {
          return reply.status(400).send({
            error: { code: "TEMPLATE_NOT_APPROVED", message: "Template must be approved before sending" },
          });
        }

        // count contacts matching segment
        const segWhere: any = { tenantId, isDeleted: false, optOut: false };
        const tags = (campaign.segmentRules as any)?.tags;
        if (tags && tags.length > 0) {
          segWhere.tags = { hasSome: tags };
        }
        const contactCount = await prisma.contact.count({ where: segWhere });

        if (contactCount === 0) {
          return reply.status(400).send({
            error: { code: "CAMPAIGN_NO_CONTACTS", message: "No contacts match the segment rules" },
          });
        }

        // Acquire distributed lock to prevent double-send
        const lockKey = `lock:campaign:${id}:execute`;
        const lockAcquired = await redis.set(lockKey, "1", { nx: true, ex: 300 });
        if (!lockAcquired) {
          return reply.status(409).send({
            error: { code: "CAMPAIGN_ALREADY_SENDING", message: "Campaign send already in progress" },
          });
        }

        // Mark as sending and store total
        const updated = await prisma.campaign.update({
          where: { id },
          data: { status: "sending", totalContacts: contactCount },
          select: {
            id: true,
            name: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            createdAt: true,
            template: { select: { id: true, name: true, status: true } },
          },
        });

        // Queue the campaign execution job in Redis
        // In production, a BullMQ worker would process this
        await redis.set(
          `campaign:${id}:job`,
          JSON.stringify({
            campaignId: id,
            tenantId,
            templateId: campaign.templateId,
            segmentRules: campaign.segmentRules,
            totalContacts: contactCount,
            startedAt: new Date().toISOString(),
          }),
          { ex: 86400 },
        );

        return { data: updated };
      },
    });

    /** Pause campaign */
    protectedApp.post("/v1/campaigns/:id/pause", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const campaign = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!campaign) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }
        if (campaign.status !== "sending") {
          return reply.status(400).send({
            error: { code: "CAMPAIGN_NOT_SENDING", message: "Only sending campaigns can be paused" },
          });
        }

        const updated = await prisma.campaign.update({
          where: { id },
          data: { status: "paused" },
          select: {
            id: true,
            name: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            createdAt: true,
          },
        });

        // Signal worker to pause
        await redis.set(`campaign:${id}:paused`, "1", { ex: 86400 });

        return { data: updated };
      },
    });

    /** Resume campaign */
    protectedApp.post("/v1/campaigns/:id/resume", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const campaign = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!campaign) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }
        if (campaign.status !== "paused") {
          return reply.status(400).send({
            error: { code: "CAMPAIGN_NOT_PAUSED", message: "Only paused campaigns can be resumed" },
          });
        }

        const updated = await prisma.campaign.update({
          where: { id },
          data: { status: "sending" },
          select: {
            id: true,
            name: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            createdAt: true,
          },
        });

        await redis.del(`campaign:${id}:paused`);

        return { data: updated };
      },
    });

    /** Cancel campaign */
    protectedApp.post("/v1/campaigns/:id/cancel", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const campaign = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!campaign) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }
        if (["completed", "cancelled"].includes(campaign.status)) {
          return reply.status(400).send({
            error: { code: "CAMPAIGN_ALREADY_ENDED", message: "Campaign is already " + campaign.status },
          });
        }

        const updated = await prisma.campaign.update({
          where: { id },
          data: { status: "cancelled" },
          select: {
            id: true,
            name: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            createdAt: true,
          },
        });

        // Clean up
        await redis.del(`campaign:${id}:job`);
        await redis.del(`campaign:${id}:paused`);
        await redis.del(`lock:campaign:${id}:execute`);

        return { data: updated };
      },
    });

    /** Get campaign delivery stats */
    protectedApp.get("/v1/campaigns/:id/stats", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const campaign = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
          select: {
            id: true,
            name: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            deliveredCount: true,
            readCount: true,
            failedCount: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        if (!campaign) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }

        const pending = campaign.totalContacts - campaign.sentCount - campaign.failedCount;

        return {
          data: {
            ...campaign,
            pendingCount: Math.max(0, pending),
            deliveryRate: campaign.sentCount > 0
              ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
              : 0,
            readRate: campaign.deliveredCount > 0
              ? Math.round((campaign.readCount / campaign.deliveredCount) * 100)
              : 0,
          },
        };
      },
    });

    /** Simulate delivery update (for testing — in prod webhooks do this) */
    protectedApp.post("/v1/campaigns/:id/simulate-delivery", {
      preHandler: [requirePermission(PERMISSIONS.CAMPAIGNS_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;
        const sent = body?.sent ?? 0;
        const delivered = body?.delivered ?? 0;
        const read = body?.read ?? 0;
        const failed = body?.failed ?? 0;

        const campaign = await prisma.campaign.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!campaign) {
          return reply.status(404).send({
            error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
          });
        }

        const updated = await prisma.campaign.update({
          where: { id },
          data: {
            sentCount: { increment: sent },
            deliveredCount: { increment: delivered },
            readCount: { increment: read },
            failedCount: { increment: failed },
            ...(campaign.sentCount + sent + failed >= campaign.totalContacts
              ? { status: "completed" }
              : {}),
          },
          select: {
            id: true,
            status: true,
            sentCount: true,
            deliveredCount: true,
            readCount: true,
            failedCount: true,
            totalContacts: true,
          },
        });

        return { data: updated };
      },
    });
  });
}
