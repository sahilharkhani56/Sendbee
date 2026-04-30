import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@whatsapp-crm/database";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";

// ═══════════════════════════════════════════════════════════
// Automation Rule Schemas
// ═══════════════════════════════════════════════════════════

const triggerSchema = z.object({
  type: z.enum(["keyword", "first_message", "opt_in", "off_hours"]),
  keywords: z.array(z.string().min(1)).optional(), // for type=keyword
  matchType: z.enum(["exact", "contains", "starts_with"]).optional(),
});

const actionSchema = z.object({
  type: z.enum(["reply_text", "reply_template", "assign_to", "add_tag", "remove_tag"]),
  text: z.string().optional(),           // for reply_text
  templateName: z.string().optional(),   // for reply_template
  userId: z.string().uuid().optional(),  // for assign_to
  tag: z.string().optional(),            // for add_tag / remove_tag
});

const createRuleSchema = z.object({
  name: z.string().min(1).max(200),
  trigger: triggerSchema,
  actions: z.array(actionSchema).min(1).max(5),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  trigger: triggerSchema.optional(),
  actions: z.array(actionSchema).min(1).max(5).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

// ═══════════════════════════════════════════════════════════
// Automation Routes
// ═══════════════════════════════════════════════════════════

export async function automationRoutes(app: FastifyInstance) {
  app.register(async (protectedApp) => {
    protectedApp.addHook("onRequest", tenantAuthMiddleware);

    // ─── POST /v1/automations — Create rule ───────────────

    protectedApp.post("/v1/automations", {
      preHandler: [requirePermission(PERMISSIONS.AUTOMATION_MANAGE)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const parsed = createRuleSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
          });
        }

        const { name, trigger, actions, isActive, priority } = parsed.data;

        // Check duplicate name
        const existing = await prisma.automationRule.findFirst({
          where: { tenantId, name },
        });
        if (existing) {
          return reply.status(409).send({
            error: { code: "AUTOMATION_DUPLICATE", message: "Rule with this name already exists" },
          });
        }

        const rule = await prisma.automationRule.create({
          data: {
            tenantId,
            name,
            trigger: trigger as unknown as Record<string, unknown>,
            actions: actions as unknown as Record<string, unknown>[],
            isActive: isActive ?? true,
            priority: priority ?? 0,
          },
        });

        return reply.status(201).send({ data: rule });
      },
    });

    // ─── GET /v1/automations — List rules ─────────────────

    protectedApp.get("/v1/automations", {
      preHandler: [requirePermission(PERMISSIONS.AUTOMATION_VIEW)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const query = request.query as Record<string, string | undefined>;
        const isActive = query.active !== undefined
          ? query.active === "true"
          : undefined;

        const rules = await prisma.automationRule.findMany({
          where: {
            tenantId,
            ...(isActive !== undefined && { isActive }),
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });

        return { data: rules, total: rules.length };
      },
    });

    // ─── GET /v1/automations/:id — Rule detail ────────────

    protectedApp.get("/v1/automations/:id", {
      preHandler: [requirePermission(PERMISSIONS.AUTOMATION_VIEW)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const { id } = request.params as { id: string };

        const rule = await prisma.automationRule.findFirst({
          where: { id, tenantId },
        });

        if (!rule) {
          return reply.status(404).send({
            error: { code: "AUTOMATION_NOT_FOUND", message: "Automation rule not found" },
          });
        }

        return { data: rule };
      },
    });

    // ─── PATCH /v1/automations/:id — Update rule ──────────

    protectedApp.patch("/v1/automations/:id", {
      preHandler: [requirePermission(PERMISSIONS.AUTOMATION_MANAGE)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const { id } = request.params as { id: string };
        const parsed = updateRuleSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
          });
        }

        const existing = await prisma.automationRule.findFirst({
          where: { id, tenantId },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "AUTOMATION_NOT_FOUND", message: "Automation rule not found" },
          });
        }

        // Check name uniqueness if changed
        if (parsed.data.name && parsed.data.name !== existing.name) {
          const nameConflict = await prisma.automationRule.findFirst({
            where: { tenantId, name: parsed.data.name, id: { not: id } },
          });
          if (nameConflict) {
            return reply.status(409).send({
              error: { code: "AUTOMATION_DUPLICATE", message: "Rule with this name already exists" },
            });
          }
        }

        const updated = await prisma.automationRule.update({
          where: { id },
          data: {
            ...(parsed.data.name && { name: parsed.data.name }),
            ...(parsed.data.trigger && { trigger: parsed.data.trigger as unknown as Record<string, unknown> }),
            ...(parsed.data.actions && { actions: parsed.data.actions as unknown as Record<string, unknown>[] }),
            ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
            ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
          },
        });

        return { data: updated };
      },
    });

    // ─── DELETE /v1/automations/:id — Delete rule ─────────

    protectedApp.delete("/v1/automations/:id", {
      preHandler: [requirePermission(PERMISSIONS.AUTOMATION_MANAGE)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const { id } = request.params as { id: string };

        const existing = await prisma.automationRule.findFirst({
          where: { id, tenantId },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "AUTOMATION_NOT_FOUND", message: "Automation rule not found" },
          });
        }

        await prisma.automationRule.delete({ where: { id } });
        return { ok: true };
      },
    });

    // ─── POST /v1/automations/:id/toggle — Enable/disable ─

    protectedApp.post("/v1/automations/:id/toggle", {
      preHandler: [requirePermission(PERMISSIONS.AUTOMATION_MANAGE)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const { id } = request.params as { id: string };

        const existing = await prisma.automationRule.findFirst({
          where: { id, tenantId },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "AUTOMATION_NOT_FOUND", message: "Automation rule not found" },
          });
        }

        const updated = await prisma.automationRule.update({
          where: { id },
          data: { isActive: !existing.isActive },
        });

        return { data: updated };
      },
    });
  });
}
