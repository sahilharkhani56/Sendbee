import { FastifyInstance } from "fastify";
import { prisma, Prisma } from "@whatsapp-crm/database";
import { z } from "zod";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";
import { redis } from "../redis";

const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  optOut: z.coerce.boolean().optional(),
});

const createSchema = z.object({
  phone: z.string().min(7).max(20),
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
  customFields: z.record(z.unknown()).default({}),
  optOut: z.boolean().default(false),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).optional(),
  customFields: z.record(z.unknown()).optional(),
  optOut: z.boolean().optional(),
});

const importSchema = z.object({
  csv: z.string().min(1),
  hasHeader: z.boolean().default(true),
});

export async function contactRoutes(app: FastifyInstance) {
  app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", tenantAuthMiddleware);

    protectedApp.get("/v1/contacts", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_VIEW)],
      handler: async (request, reply) => {
        const parsed = listSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const { cursor, limit, search, tag, optOut } = parsed.data;

        const where = {
          tenantId: request.tenantId!,
          isDeleted: false,
          ...(tag ? { tags: { has: tag } } : {}),
          ...(optOut !== undefined ? { optOut } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { phoneE164: { contains: search } },
                ],
              }
            : {}),
        };

        const contacts = await prisma.contact.findMany({
          where,
          take: limit + 1,
          ...(cursor ? { cursor: { id: decodeCursor(cursor) }, skip: 1 } : {}),
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            phoneE164: true,
            name: true,
            email: true,
            tags: true,
            customFields: true,
            optOut: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        const hasMore = contacts.length > limit;
        const pageItems = hasMore ? contacts.slice(0, limit) : contacts;
        const nextCursor = hasMore ? encodeCursor(pageItems[pageItems.length - 1]!.id) : null;

        return {
          data: pageItems,
          pagination: { limit, nextCursor, hasMore },
        };
      },
    });

    protectedApp.post("/v1/contacts", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_CREATE)],
      handler: async (request, reply) => {
        const parsed = createSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const payload = parsed.data;
        const phoneE164 = normalizeIndianPhone(payload.phone);
        if (!phoneE164) {
          return reply.status(400).send({
            error: { code: "CONTACT_INVALID_PHONE", message: "Invalid phone number format" },
          });
        }

        const existing = await prisma.contact.findUnique({
          where: {
            tenantId_phoneE164: { tenantId: request.tenantId!, phoneE164 },
          },
        });

        if (existing && !existing.isDeleted) {
          return reply.status(409).send({
            error: { code: "CONTACT_DUPLICATE", message: "Contact already exists" },
          });
        }

        const contact = existing
          ? await prisma.contact.update({
              where: { id: existing.id },
              data: {
                isDeleted: false,
                name: payload.name,
                email: payload.email,
                tags: payload.tags,
                customFields: payload.customFields as Prisma.InputJsonValue,
                optOut: payload.optOut,
              },
            })
          : await prisma.contact.create({
              data: {
                tenantId: request.tenantId!,
                phoneE164,
                name: payload.name,
                email: payload.email,
                tags: payload.tags,
                customFields: payload.customFields as Prisma.InputJsonValue,
                optOut: payload.optOut,
              },
            });

        return reply.status(201).send(contact);
      },
    });

    protectedApp.get("/v1/contacts/:id", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };

        const contact = await prisma.contact.findFirst({
          where: { id, tenantId: request.tenantId!, isDeleted: false },
        });

        if (!contact) {
          return reply.status(404).send({
            error: { code: "CONTACT_NOT_FOUND", message: "Contact not found" },
          });
        }

        const conversations = await prisma.conversation.findMany({
          where: { tenantId: request.tenantId!, contactId: id },
          select: { id: true },
        });

        const conversationIds = conversations.map((c) => c.id);

        const [messages, bookings] = await Promise.all([
          conversationIds.length
            ? prisma.message.findMany({
                where: {
                  tenantId: request.tenantId!,
                  conversationId: { in: conversationIds },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
              })
            : Promise.resolve([]),
          prisma.booking.findMany({
            where: {
              tenantId: request.tenantId!,
              contactId: id,
            },
            orderBy: { startsAt: "desc" },
            take: 25,
          }),
        ]);

        return {
          contact,
          timeline: {
            messages,
            bookings,
          },
        };
      },
    });

    protectedApp.patch("/v1/contacts/:id", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_EDIT)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = updateSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const target = await prisma.contact.findFirst({
          where: { id, tenantId: request.tenantId!, isDeleted: false },
          select: { id: true },
        });

        if (!target) {
          return reply.status(404).send({
            error: { code: "CONTACT_NOT_FOUND", message: "Contact not found" },
          });
        }

        const { customFields, ...rest } = parsed.data;
        const updated = await prisma.contact.update({
          where: { id },
          data: {
            ...rest,
            ...(customFields !== undefined
              ? { customFields: customFields as Prisma.InputJsonValue }
              : {}),
          },
        });

        return updated;
      },
    });

    protectedApp.patch("/v1/contacts/:id/opt-out", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_EDIT)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = z.object({ optOut: z.boolean() }).safeParse(request.body);
        if (!body.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: body.error.flatten().fieldErrors },
          });
        }

        const updated = await prisma.contact.updateMany({
          where: { id, tenantId: request.tenantId!, isDeleted: false },
          data: { optOut: body.data.optOut },
        });

        if (updated.count === 0) {
          return reply.status(404).send({
            error: { code: "CONTACT_NOT_FOUND", message: "Contact not found" },
          });
        }

        return { id, optOut: body.data.optOut };
      },
    });

    protectedApp.delete("/v1/contacts/:id", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_DELETE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };

        const deleted = await prisma.contact.updateMany({
          where: { id, tenantId: request.tenantId!, isDeleted: false },
          data: { isDeleted: true },
        });

        if (deleted.count === 0) {
          return reply.status(404).send({
            error: { code: "CONTACT_NOT_FOUND", message: "Contact not found" },
          });
        }

        return { message: "Contact deleted", id };
      },
    });

    protectedApp.post("/v1/contacts/import", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_IMPORT)],
      handler: async (request, reply) => {
        const parsed = importSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const jobId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const progressKey = `import:${jobId}:progress`;

        await redis.set(progressKey, JSON.stringify({ status: "queued", processed: 0, total: 0 }), {
          ex: 3600,
        });

        void processCsvImport(request.tenantId!, parsed.data.csv, parsed.data.hasHeader, progressKey);

        return reply.status(202).send({
          jobId,
          status: "queued",
        });
      },
    });

    protectedApp.get("/v1/contacts/import/:jobId", {
      preHandler: [requirePermission(PERMISSIONS.CONTACTS_IMPORT)],
      handler: async (request, reply) => {
        const { jobId } = request.params as { jobId: string };
        const value = await redis.get(`import:${jobId}:progress`);

        if (!value) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Import job not found or expired" },
          });
        }

        return typeof value === "string" ? JSON.parse(value) : value;
      },
    });
  });
}

async function processCsvImport(
  tenantId: string,
  csv: string,
  hasHeader: boolean,
  progressKey: string
): Promise<void> {
  const rows = parseCsv(csv);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  let processed = 0;
  let inserted = 0;
  let skipped = 0;

  await redis.set(progressKey, JSON.stringify({ status: "processing", processed, total: dataRows.length }), {
    ex: 3600,
  });

  for (const row of dataRows) {
    processed += 1;

    const phoneRaw = (row[0] ?? "").trim();
    const name = (row[1] ?? "").trim() || undefined;
    const email = (row[2] ?? "").trim() || undefined;
    const tags = (row[3] ?? "")
      .split("|")
      .map((t) => t.trim())
      .filter(Boolean);

    const phoneE164 = normalizeIndianPhone(phoneRaw);

    if (!phoneE164) {
      skipped += 1;
      await redis.set(
        progressKey,
        JSON.stringify({ status: "processing", processed, total: dataRows.length, inserted, skipped }),
        { ex: 3600 }
      );
      continue;
    }

    const existing = await prisma.contact.findUnique({
      where: { tenantId_phoneE164: { tenantId, phoneE164 } },
      select: { id: true, isDeleted: true },
    });

    if (existing && !existing.isDeleted) {
      skipped += 1;
    } else if (existing && existing.isDeleted) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: {
          isDeleted: false,
          name,
          email,
          tags,
        },
      });
      inserted += 1;
    } else {
      await prisma.contact.create({
        data: {
          tenantId,
          phoneE164,
          name,
          email,
          tags,
        },
      });
      inserted += 1;
    }

    await redis.set(
      progressKey,
      JSON.stringify({ status: "processing", processed, total: dataRows.length, inserted, skipped }),
      { ex: 3600 }
    );
  }

  await redis.set(
    progressKey,
    JSON.stringify({ status: "completed", processed, total: dataRows.length, inserted, skipped }),
    { ex: 3600 }
  );
}

function parseCsv(input: string): string[][] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => line.split(",").map((part) => part.trim()));
}

function normalizeIndianPhone(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return null;

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return null;
    return `+${digits}`;
  }

  let digits = cleaned.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return null;
}

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
