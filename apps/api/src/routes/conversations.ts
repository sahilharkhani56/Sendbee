import { FastifyInstance } from "fastify";
import { prisma, Prisma } from "@whatsapp-crm/database";
import { z } from "zod";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";
import { redis } from "../redis";
import { WhatsAppClient } from "@whatsapp-crm/whatsapp-sdk";

// ─── Schemas ──────────────────────────────────────────────

const listConversationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["open", "resolved"]).optional(),
  assignedTo: z.string().uuid().optional(),
  unassigned: z.coerce.boolean().optional(),
});

const messageThreadSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const sendReplySchema = z.object({
  text: z.string().trim().min(1).max(4096),
});

const assignSchema = z.object({
  assignedTo: z.string().uuid().nullable(),
});

const statusSchema = z.object({
  status: z.enum(["open", "resolved"]),
});

const internalNoteSchema = z.object({
  text: z.string().trim().min(1).max(4096),
});

const quickReplySchema = z.object({
  name: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(4096),
});

// ─── Routes ───────────────────────────────────────────────

export async function conversationRoutes(app: FastifyInstance) {
  app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", tenantAuthMiddleware);

    // ─── List conversations ─────────────────────────────

    protectedApp.get("/v1/conversations", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_VIEW)],
      handler: async (request, reply) => {
        const parsed = listConversationsSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const { cursor, limit, status, assignedTo, unassigned } = parsed.data;

        const where: Prisma.ConversationWhereInput = {
          tenantId: request.tenantId!,
          ...(status ? { status } : {}),
          ...(assignedTo ? { assignedTo } : {}),
          ...(unassigned ? { assignedTo: null } : {}),
        };

        const conversations = await prisma.conversation.findMany({
          where,
          take: limit + 1,
          ...(cursor
            ? { cursor: { id: decodeCursor(cursor) }, skip: 1 }
            : {}),
          orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
          include: {
            contact: {
              select: {
                id: true,
                phoneE164: true,
                name: true,
                tags: true,
                optOut: true,
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                direction: true,
                type: true,
                content: true,
                status: true,
                createdAt: true,
              },
            },
          },
        });

        const hasMore = conversations.length > limit;
        const pageItems = hasMore ? conversations.slice(0, limit) : conversations;
        const nextCursor = hasMore
          ? encodeCursor(pageItems[pageItems.length - 1]!.id)
          : null;

        return {
          data: pageItems.map((conv) => ({
            id: conv.id,
            status: conv.status,
            assignedTo: conv.assignedTo,
            unreadCount: conv.unreadCount,
            lastMessageAt: conv.lastMessageAt,
            createdAt: conv.createdAt,
            contact: conv.contact,
            lastMessage: conv.messages[0] ?? null,
          })),
          pagination: { limit, nextCursor, hasMore },
        };
      },
    });

    // ─── Get single conversation ────────────────────────

    protectedApp.get("/v1/conversations/:id", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };

        const conversation = await prisma.conversation.findFirst({
          where: { id, tenantId: request.tenantId! },
          include: {
            contact: {
              select: {
                id: true,
                phoneE164: true,
                name: true,
                email: true,
                tags: true,
                customFields: true,
                optOut: true,
                createdAt: true,
              },
            },
          },
        });

        if (!conversation) {
          return reply.status(404).send({
            error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" },
          });
        }

        return conversation;
      },
    });

    // ─── Message thread ─────────────────────────────────

    protectedApp.get("/v1/conversations/:id/messages", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = messageThreadSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const conversation = await prisma.conversation.findFirst({
          where: { id, tenantId: request.tenantId! },
          select: { id: true },
        });

        if (!conversation) {
          return reply.status(404).send({
            error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" },
          });
        }

        const { cursor, limit } = parsed.data;

        const messages = await prisma.message.findMany({
          where: { conversationId: id, tenantId: request.tenantId! },
          take: limit + 1,
          ...(cursor
            ? { cursor: { id: decodeCursor(cursor) }, skip: 1 }
            : {}),
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });

        const hasMore = messages.length > limit;
        const pageItems = hasMore ? messages.slice(0, limit) : messages;
        const nextCursor = hasMore
          ? encodeCursor(pageItems[pageItems.length - 1]!.id)
          : null;

        return {
          data: pageItems,
          pagination: { limit, nextCursor, hasMore },
        };
      },
    });

    // ─── Reply from inbox ───────────────────────────────

    protectedApp.post("/v1/conversations/:id/reply", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = sendReplySchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const conversation = await prisma.conversation.findFirst({
          where: { id, tenantId: request.tenantId! },
          include: {
            contact: { select: { phoneE164: true, optOut: true } },
          },
        });

        if (!conversation) {
          return reply.status(404).send({
            error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" },
          });
        }

        if (conversation.contact.optOut) {
          return reply.status(403).send({
            error: { code: "CONTACT_OPTED_OUT", message: "Contact has opted out of messages" },
          });
        }

        // Check 24h session window
        const sessionKey = `wa_session:${request.tenantId}:${conversation.contact.phoneE164}`;
        const hasSession = await redis.exists(sessionKey);

        if (!hasSession) {
          return reply.status(400).send({
            error: {
              code: "MESSAGE_SESSION_EXPIRED",
              message: "24h session expired. Use a template message instead.",
            },
          });
        }

        // Store message in DB first
        const message = await prisma.message.create({
          data: {
            tenantId: request.tenantId!,
            conversationId: id,
            direction: "outbound",
            type: "text",
            content: { text: parsed.data.text } as Prisma.InputJsonValue,
            status: "queued",
            sentBy: request.userId,
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id },
          data: { lastMessageAt: new Date(), status: "open" },
        });

        // Try to send via WhatsApp (non-blocking for MVP — tenant may not have WA credentials)
        const tenant = await prisma.tenant.findUnique({
          where: { id: request.tenantId! },
          select: { waPhoneId: true, waAccessToken: true },
        });

        if (tenant?.waPhoneId && tenant?.waAccessToken) {
          try {
            const wa = new WhatsAppClient({
              phoneNumberId: tenant.waPhoneId,
              accessToken: tenant.waAccessToken,
            });
            const result = await wa.sendText({
              to: conversation.contact.phoneE164,
              body: parsed.data.text,
            });
            await prisma.message.update({
              where: { id: message.id },
              data: { waMessageId: result.messageId, status: "sent" },
            });
          } catch {
            await prisma.message.update({
              where: { id: message.id },
              data: { status: "failed", errorCode: "WA_SEND_FAILED" },
            });
          }
        }

        const updated = await prisma.message.findUnique({ where: { id: message.id } });
        return reply.status(201).send(updated);
      },
    });

    // ─── Assign conversation ────────────────────────────

    protectedApp.patch("/v1/conversations/:id/assign", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_ASSIGN)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = assignSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        // Verify assignee exists in same tenant (if not null)
        if (parsed.data.assignedTo) {
          const user = await prisma.user.findFirst({
            where: {
              id: parsed.data.assignedTo,
              tenantId: request.tenantId!,
              isActive: true,
            },
            select: { id: true },
          });

          if (!user) {
            return reply.status(404).send({
              error: { code: "USER_NOT_FOUND", message: "Assignee not found in this tenant" },
            });
          }
        }

        const updated = await prisma.conversation.updateMany({
          where: { id, tenantId: request.tenantId! },
          data: { assignedTo: parsed.data.assignedTo },
        });

        if (updated.count === 0) {
          return reply.status(404).send({
            error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" },
          });
        }

        return { id, assignedTo: parsed.data.assignedTo };
      },
    });

    // ─── Update conversation status ─────────────────────

    protectedApp.patch("/v1/conversations/:id/status", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_CLOSE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = statusSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const updated = await prisma.conversation.updateMany({
          where: { id, tenantId: request.tenantId! },
          data: { status: parsed.data.status },
        });

        if (updated.count === 0) {
          return reply.status(404).send({
            error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" },
          });
        }

        return { id, status: parsed.data.status };
      },
    });

    // ─── Mark as read ───────────────────────────────────

    protectedApp.post("/v1/conversations/:id/read", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };

        const updated = await prisma.conversation.updateMany({
          where: { id, tenantId: request.tenantId! },
          data: { unreadCount: 0 },
        });

        if (updated.count === 0) {
          return reply.status(404).send({
            error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" },
          });
        }

        return { id, unreadCount: 0 };
      },
    });

    // ─── Internal note ──────────────────────────────────

    protectedApp.post("/v1/conversations/:id/notes", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = internalNoteSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const conversation = await prisma.conversation.findFirst({
          where: { id, tenantId: request.tenantId! },
          select: { id: true },
        });

        if (!conversation) {
          return reply.status(404).send({
            error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" },
          });
        }

        // Store as a special outbound message with _note flag in content
        const note = await prisma.message.create({
          data: {
            tenantId: request.tenantId!,
            conversationId: id,
            direction: "outbound",
            type: "text",
            content: { text: parsed.data.text, _note: true } as Prisma.InputJsonValue,
            status: "delivered",
            sentBy: request.userId,
          },
        });

        return reply.status(201).send(note);
      },
    });

    // ─── Quick reply templates (per-tenant) ─────────────

    protectedApp.get("/v1/quick-replies", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_VIEW)],
      handler: async (request) => {
        const key = `tenant:${request.tenantId}:quick_replies`;
        const stored = await redis.get(key);
        if (stored) {
          return { data: typeof stored === "string" ? JSON.parse(stored) : stored };
        }
        return { data: [] };
      },
    });

    protectedApp.post("/v1/quick-replies", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_SEND)],
      handler: async (request, reply) => {
        const parsed = quickReplySchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const key = `tenant:${request.tenantId}:quick_replies`;
        const stored = await redis.get(key);
        const existing: Array<{ id: string; name: string; text: string }> =
          stored ? (typeof stored === "string" ? JSON.parse(stored) : stored) : [];

        const newReply = {
          id: `qr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: parsed.data.name,
          text: parsed.data.text,
        };

        existing.push(newReply);
        await redis.set(key, JSON.stringify(existing));

        return reply.status(201).send(newReply);
      },
    });

    protectedApp.delete("/v1/quick-replies/:id", {
      preHandler: [requirePermission(PERMISSIONS.CHAT_SEND)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const key = `tenant:${request.tenantId}:quick_replies`;
        const stored = await redis.get(key);
        const existing: Array<{ id: string; name: string; text: string }> =
          stored ? (typeof stored === "string" ? JSON.parse(stored) : stored) : [];

        const filtered = existing.filter((qr) => qr.id !== id);

        if (filtered.length === existing.length) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Quick reply not found" },
          });
        }

        await redis.set(key, JSON.stringify(filtered));
        return { message: "Quick reply deleted", id };
      },
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────

function encodeCursor(id: string): string {
  return Buffer.from(id, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, "base64url").toString("utf8");
  } catch {
    return "";
  }
}
