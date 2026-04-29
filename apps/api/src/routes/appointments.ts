import { FastifyInstance } from "fastify";
import { prisma } from "@whatsapp-crm/database";
import { z } from "zod";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";
import { redis } from "../redis";

// ─── Schemas ──────────────────────────────────────────────

/** Working hours: { "monday": { "start": "09:00", "end": "17:00" }, ... } */
const dayScheduleSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const workingHoursSchema = z.record(
  z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  dayScheduleSchema,
).default({});

/** Break hours: [{ "start": "13:00", "end": "14:00" }] */
const breakHoursSchema = z.array(
  z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
).default([]);

const createProviderSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  specialization: z.string().trim().max(100).optional(),
  workingHours: workingHoursSchema,
  breakHours: breakHoursSchema,
  slotDuration: z.number().int().min(5).max(240).default(30),
});

const updateProviderSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  specialization: z.string().trim().max(100).nullable().optional(),
  workingHours: workingHoursSchema.optional(),
  breakHours: breakHoursSchema.optional(),
  slotDuration: z.number().int().min(5).max(240).optional(),
  isActive: z.boolean().optional(),
});

const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createBookingSchema = z.object({
  providerId: z.string().uuid(),
  contactId: z.string().uuid(),
  startsAt: z.string().datetime(),
  notes: z.string().trim().max(500).optional(),
});

const rescheduleSchema = z.object({
  startsAt: z.string().datetime(),
});

const listBookingsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  providerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  status: z.enum(["confirmed", "completed", "cancelled", "no_show"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ─── Helpers ──────────────────────────────────────────────

function encodeCursor(id: string) {
  return Buffer.from(id).toString("base64url");
}
function decodeCursor(cursor: string) {
  return Buffer.from(cursor, "base64url").toString();
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h! * 60 + m!;
}

function minutesToTime(mins: number): string {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Generate all available slot start-times for a provider on a given date. */
function generateSlots(
  workingHours: Record<string, { start: string; end: string }>,
  breakHours: { start: string; end: string }[],
  slotDuration: number,
  dayOfWeek: string,
): string[] {
  const daySchedule = workingHours[dayOfWeek];
  if (!daySchedule) return [];

  const dayStart = timeToMinutes(daySchedule.start);
  const dayEnd = timeToMinutes(daySchedule.end);
  const breaks = breakHours.map((b) => ({
    start: timeToMinutes(b.start),
    end: timeToMinutes(b.end),
  }));

  const slots: string[] = [];
  for (let t = dayStart; t + slotDuration <= dayEnd; t += slotDuration) {
    const slotEnd = t + slotDuration;
    const overlapsBreak = breaks.some((b) => t < b.end && slotEnd > b.start);
    if (!overlapsBreak) {
      slots.push(minutesToTime(t));
    }
  }
  return slots;
}

// ─── Routes ───────────────────────────────────────────────

export async function appointmentRoutes(app: FastifyInstance) {
  app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", tenantAuthMiddleware);

    // ═══ PROVIDER CRUD ═══════════════════════════════════

    /** List providers */
    protectedApp.get("/v1/providers", {
      preHandler: [requirePermission(PERMISSIONS.PROVIDERS_VIEW)],
      handler: async (request, reply) => {
        const providers = await prisma.provider.findMany({
          where: { tenantId: request.tenantId!, isActive: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            specialization: true,
            workingHours: true,
            breakHours: true,
            slotDuration: true,
            isActive: true,
            createdAt: true,
          },
        });
        return { data: providers };
      },
    });

    /** Create provider */
    protectedApp.post("/v1/providers", {
      preHandler: [requirePermission(PERMISSIONS.PROVIDERS_MANAGE)],
      handler: async (request, reply) => {
        const parsed = createProviderSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const provider = await prisma.provider.create({
          data: {
            tenantId: request.tenantId!,
            ...parsed.data,
            workingHours: parsed.data.workingHours as any,
            breakHours: parsed.data.breakHours as any,
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            specialization: true,
            workingHours: true,
            breakHours: true,
            slotDuration: true,
            isActive: true,
            createdAt: true,
          },
        });

        return reply.status(201).send({ data: provider });
      },
    });

    /** Get provider by ID */
    protectedApp.get("/v1/providers/:id", {
      preHandler: [requirePermission(PERMISSIONS.PROVIDERS_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const provider = await prisma.provider.findFirst({
          where: { id, tenantId: request.tenantId! },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            specialization: true,
            workingHours: true,
            breakHours: true,
            slotDuration: true,
            isActive: true,
            createdAt: true,
          },
        });
        if (!provider) {
          return reply.status(404).send({
            error: { code: "PROVIDER_NOT_FOUND", message: "Provider not found" },
          });
        }
        return { data: provider };
      },
    });

    /** Update provider */
    protectedApp.patch("/v1/providers/:id", {
      preHandler: [requirePermission(PERMISSIONS.PROVIDERS_MANAGE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = updateProviderSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const existing = await prisma.provider.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "PROVIDER_NOT_FOUND", message: "Provider not found" },
          });
        }

        const provider = await prisma.provider.update({
          where: { id },
          data: {
            ...parsed.data,
            workingHours: parsed.data.workingHours as any,
            breakHours: parsed.data.breakHours as any,
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            specialization: true,
            workingHours: true,
            breakHours: true,
            slotDuration: true,
            isActive: true,
            createdAt: true,
          },
        });

        return { data: provider };
      },
    });

    /** Delete (deactivate) provider */
    protectedApp.delete("/v1/providers/:id", {
      preHandler: [requirePermission(PERMISSIONS.PROVIDERS_MANAGE)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const existing = await prisma.provider.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!existing) {
          return reply.status(404).send({
            error: { code: "PROVIDER_NOT_FOUND", message: "Provider not found" },
          });
        }

        await prisma.provider.update({ where: { id }, data: { isActive: false } });
        return { success: true };
      },
    });

    // ═══ SLOT AVAILABILITY ═══════════════════════════════

    /** Get available slots for a provider on a date */
    protectedApp.get("/v1/providers/:id/slots", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = slotsQuerySchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const provider = await prisma.provider.findFirst({
          where: { id, tenantId: request.tenantId!, isActive: true },
        });
        if (!provider) {
          return reply.status(404).send({
            error: { code: "PROVIDER_NOT_FOUND", message: "Provider not found" },
          });
        }

        const { date } = parsed.data;
        const dateObj = new Date(date + "T00:00:00Z");
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayOfWeek = days[dateObj.getUTCDay()]!;

        const workingHours = (provider.workingHours ?? {}) as Record<string, { start: string; end: string }>;
        const breakHours = (provider.breakHours ?? []) as { start: string; end: string }[];

        const allSlots = generateSlots(workingHours, breakHours, provider.slotDuration, dayOfWeek);

        // Fetch existing bookings for this provider on this date
        const dayStart = new Date(date + "T00:00:00Z");
        const dayEnd = new Date(date + "T23:59:59.999Z");

        const existingBookings = await prisma.booking.findMany({
          where: {
            providerId: id,
            tenantId: request.tenantId!,
            status: { in: ["confirmed", "completed"] },
            startsAt: { gte: dayStart, lte: dayEnd },
          },
          select: { startsAt: true, endsAt: true },
        });

        // Filter out booked slots
        const bookedMinutes = existingBookings.map((b) => ({
          start: b.startsAt.getUTCHours() * 60 + b.startsAt.getUTCMinutes(),
          end: b.endsAt.getUTCHours() * 60 + b.endsAt.getUTCMinutes(),
        }));

        const available = allSlots.filter((slotTime) => {
          const slotStart = timeToMinutes(slotTime);
          const slotEnd = slotStart + provider.slotDuration;
          return !bookedMinutes.some((b) => slotStart < b.end && slotEnd > b.start);
        });

        return {
          data: {
            providerId: id,
            date,
            dayOfWeek,
            slotDuration: provider.slotDuration,
            slots: available.map((t) => ({
              time: t,
              startsAt: `${date}T${t}:00Z`,
              endsAt: `${date}T${minutesToTime(timeToMinutes(t) + provider.slotDuration)}:00Z`,
            })),
            totalSlots: allSlots.length,
            availableSlots: available.length,
            bookedSlots: allSlots.length - available.length,
          },
        };
      },
    });

    // ═══ BOOKINGS ════════════════════════════════════════

    /** List bookings (with filters) */
    protectedApp.get("/v1/appointments", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_VIEW)],
      handler: async (request, reply) => {
        const parsed = listBookingsSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const { cursor, limit, providerId, contactId, status, date } = parsed.data;

        const where: any = { tenantId: request.tenantId! };
        if (providerId) where.providerId = providerId;
        if (contactId) where.contactId = contactId;
        if (status) where.status = status;
        if (date) {
          where.startsAt = {
            gte: new Date(date + "T00:00:00Z"),
            lte: new Date(date + "T23:59:59.999Z"),
          };
        }

        const bookings = await prisma.booking.findMany({
          where,
          take: limit + 1,
          ...(cursor ? { cursor: { id: decodeCursor(cursor) }, skip: 1 } : {}),
          orderBy: { startsAt: "desc" },
          select: {
            id: true,
            providerId: true,
            contactId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            notes: true,
            createdAt: true,
            provider: { select: { id: true, name: true, specialization: true } },
            contact: { select: { id: true, name: true, phoneE164: true } },
          },
        });

        const hasMore = bookings.length > limit;
        const pageItems = hasMore ? bookings.slice(0, limit) : bookings;
        const nextCursor = hasMore ? encodeCursor(pageItems[pageItems.length - 1]!.id) : null;

        return { data: pageItems, pagination: { limit, nextCursor, hasMore } };
      },
    });

    /** Get single booking */
    protectedApp.get("/v1/appointments/:id", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_VIEW)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const booking = await prisma.booking.findFirst({
          where: { id, tenantId: request.tenantId! },
          select: {
            id: true,
            providerId: true,
            contactId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            notes: true,
            createdAt: true,
            provider: { select: { id: true, name: true, specialization: true } },
            contact: { select: { id: true, name: true, phoneE164: true } },
          },
        });
        if (!booking) {
          return reply.status(404).send({
            error: { code: "APPOINTMENT_NOT_FOUND", message: "Appointment not found" },
          });
        }
        return { data: booking };
      },
    });

    /** Create booking (manual from dashboard) */
    protectedApp.post("/v1/appointments", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_CREATE)],
      handler: async (request, reply) => {
        const parsed = createBookingSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const { providerId, contactId, startsAt: startsAtStr, notes } = parsed.data;
        const tenantId = request.tenantId!;

        // Validate provider exists and belongs to tenant
        const provider = await prisma.provider.findFirst({
          where: { id: providerId, tenantId, isActive: true },
        });
        if (!provider) {
          return reply.status(404).send({
            error: { code: "PROVIDER_NOT_FOUND", message: "Provider not found" },
          });
        }

        // Validate contact exists and belongs to tenant
        const contact = await prisma.contact.findFirst({
          where: { id: contactId, tenantId, isDeleted: false },
        });
        if (!contact) {
          return reply.status(404).send({
            error: { code: "CONTACT_NOT_FOUND", message: "Contact not found" },
          });
        }

        const startsAt = new Date(startsAtStr);
        const endsAt = new Date(startsAt.getTime() + provider.slotDuration * 60_000);

        // Double-booking prevention: Redis distributed lock + DB check
        const lockKey = `lock:appointment:${providerId}:${startsAt.toISOString()}`;
        const lockAcquired = await redis.set(lockKey, "1", { nx: true, ex: 5 });
        if (!lockAcquired) {
          return reply.status(409).send({
            error: { code: "APPOINTMENT_SLOT_UNAVAILABLE", message: "Slot is being booked by another user" },
          });
        }

        try {
          // Check for overlapping bookings
          const overlap = await prisma.booking.findFirst({
            where: {
              providerId,
              tenantId,
              status: { in: ["confirmed", "completed"] },
              startsAt: { lt: endsAt },
              endsAt: { gt: startsAt },
            },
          });

          if (overlap) {
            return reply.status(409).send({
              error: { code: "APPOINTMENT_DOUBLE_BOOKING", message: "This slot is already booked" },
            });
          }

          const booking = await prisma.booking.create({
            data: { tenantId, providerId, contactId, startsAt, endsAt, notes, status: "confirmed" },
            select: {
              id: true,
              providerId: true,
              contactId: true,
              startsAt: true,
              endsAt: true,
              status: true,
              notes: true,
              createdAt: true,
              provider: { select: { id: true, name: true, specialization: true } },
              contact: { select: { id: true, name: true, phoneE164: true } },
            },
          });

          // Queue reminders in Redis (24h and 2h before)
          const now = Date.now();
          const msUntilStart = startsAt.getTime() - now;
          const reminder24h = msUntilStart - 24 * 60 * 60_000;
          const reminder2h = msUntilStart - 2 * 60 * 60_000;

          if (reminder24h > 0) {
            await redis.set(
              `reminder:24h:${booking.id}`,
              JSON.stringify({ bookingId: booking.id, tenantId, type: "24h" }),
              { ex: Math.ceil(reminder24h / 1000) + 3600 },
            );
          }
          if (reminder2h > 0) {
            await redis.set(
              `reminder:2h:${booking.id}`,
              JSON.stringify({ bookingId: booking.id, tenantId, type: "2h" }),
              { ex: Math.ceil(reminder2h / 1000) + 3600 },
            );
          }

          return reply.status(201).send({ data: booking });
        } finally {
          await redis.del(lockKey);
        }
      },
    });

    /** Cancel booking */
    protectedApp.post("/v1/appointments/:id/cancel", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_CANCEL)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const booking = await prisma.booking.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!booking) {
          return reply.status(404).send({
            error: { code: "APPOINTMENT_NOT_FOUND", message: "Appointment not found" },
          });
        }
        if (booking.status === "cancelled") {
          return reply.status(400).send({
            error: { code: "APPOINTMENT_ALREADY_CANCELLED", message: "Already cancelled" },
          });
        }
        if (booking.status === "completed") {
          return reply.status(400).send({
            error: { code: "APPOINTMENT_COMPLETED", message: "Cannot cancel completed appointment" },
          });
        }

        const updated = await prisma.booking.update({
          where: { id },
          data: { status: "cancelled" },
          select: {
            id: true,
            providerId: true,
            contactId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            notes: true,
            createdAt: true,
            provider: { select: { id: true, name: true, specialization: true } },
            contact: { select: { id: true, name: true, phoneE164: true } },
          },
        });

        // Clean up reminders
        await redis.del(`reminder:24h:${id}`);
        await redis.del(`reminder:2h:${id}`);

        return { data: updated };
      },
    });

    /** Complete booking */
    protectedApp.post("/v1/appointments/:id/complete", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_EDIT)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const booking = await prisma.booking.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!booking) {
          return reply.status(404).send({
            error: { code: "APPOINTMENT_NOT_FOUND", message: "Appointment not found" },
          });
        }
        if (booking.status !== "confirmed") {
          return reply.status(400).send({
            error: { code: "APPOINTMENT_NOT_CONFIRMED", message: "Only confirmed appointments can be completed" },
          });
        }

        const updated = await prisma.booking.update({
          where: { id },
          data: { status: "completed" },
          select: {
            id: true,
            providerId: true,
            contactId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            notes: true,
            createdAt: true,
          },
        });

        await redis.del(`reminder:24h:${id}`);
        await redis.del(`reminder:2h:${id}`);

        return { data: updated };
      },
    });

    /** Mark no-show */
    protectedApp.post("/v1/appointments/:id/no-show", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_EDIT)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const booking = await prisma.booking.findFirst({
          where: { id, tenantId: request.tenantId! },
        });
        if (!booking) {
          return reply.status(404).send({
            error: { code: "APPOINTMENT_NOT_FOUND", message: "Appointment not found" },
          });
        }
        if (booking.status !== "confirmed") {
          return reply.status(400).send({
            error: { code: "APPOINTMENT_NOT_CONFIRMED", message: "Only confirmed appointments can be marked no-show" },
          });
        }

        const updated = await prisma.booking.update({
          where: { id },
          data: { status: "no_show" },
          select: {
            id: true,
            providerId: true,
            contactId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            notes: true,
            createdAt: true,
          },
        });

        return { data: updated };
      },
    });

    /** Reschedule booking (atomic: cancel old + book new) */
    protectedApp.post("/v1/appointments/:id/reschedule", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_EDIT)],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = rescheduleSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
          });
        }

        const tenantId = request.tenantId!;
        const oldBooking = await prisma.booking.findFirst({
          where: { id, tenantId },
          include: { provider: true },
        });
        if (!oldBooking) {
          return reply.status(404).send({
            error: { code: "APPOINTMENT_NOT_FOUND", message: "Appointment not found" },
          });
        }
        if (oldBooking.status !== "confirmed") {
          return reply.status(400).send({
            error: { code: "APPOINTMENT_NOT_CONFIRMED", message: "Only confirmed appointments can be rescheduled" },
          });
        }

        const newStartsAt = new Date(parsed.data.startsAt);
        const newEndsAt = new Date(newStartsAt.getTime() + oldBooking.provider.slotDuration * 60_000);

        // Lock the new slot
        const lockKey = `lock:appointment:${oldBooking.providerId}:${newStartsAt.toISOString()}`;
        const lockAcquired = await redis.set(lockKey, "1", { nx: true, ex: 5 });
        if (!lockAcquired) {
          return reply.status(409).send({
            error: { code: "APPOINTMENT_SLOT_UNAVAILABLE", message: "Slot is being booked by another user" },
          });
        }

        try {
          // Check overlap (excluding current booking)
          const overlap = await prisma.booking.findFirst({
            where: {
              providerId: oldBooking.providerId,
              tenantId,
              id: { not: id },
              status: { in: ["confirmed", "completed"] },
              startsAt: { lt: newEndsAt },
              endsAt: { gt: newStartsAt },
            },
          });

          if (overlap) {
            return reply.status(409).send({
              error: { code: "APPOINTMENT_DOUBLE_BOOKING", message: "New slot is already booked" },
            });
          }

          // Atomic: cancel old, create new
          const [, newBooking] = await prisma.$transaction([
            prisma.booking.update({ where: { id }, data: { status: "cancelled" } }),
            prisma.booking.create({
              data: {
                tenantId,
                providerId: oldBooking.providerId,
                contactId: oldBooking.contactId,
                startsAt: newStartsAt,
                endsAt: newEndsAt,
                notes: oldBooking.notes,
                status: "confirmed",
              },
              select: {
                id: true,
                providerId: true,
                contactId: true,
                startsAt: true,
                endsAt: true,
                status: true,
                notes: true,
                createdAt: true,
                provider: { select: { id: true, name: true, specialization: true } },
                contact: { select: { id: true, name: true, phoneE164: true } },
              },
            }),
          ]);

          // Clean old reminders, set new
          await redis.del(`reminder:24h:${id}`);
          await redis.del(`reminder:2h:${id}`);

          const now = Date.now();
          const msUntilStart = newStartsAt.getTime() - now;
          const r24 = msUntilStart - 24 * 60 * 60_000;
          const r2 = msUntilStart - 2 * 60 * 60_000;
          if (r24 > 0) {
            await redis.set(
              `reminder:24h:${newBooking.id}`,
              JSON.stringify({ bookingId: newBooking.id, tenantId, type: "24h" }),
              { ex: Math.ceil(r24 / 1000) + 3600 },
            );
          }
          if (r2 > 0) {
            await redis.set(
              `reminder:2h:${newBooking.id}`,
              JSON.stringify({ bookingId: newBooking.id, tenantId, type: "2h" }),
              { ex: Math.ceil(r2 / 1000) + 3600 },
            );
          }

          return reply.status(201).send({
            data: newBooking,
            cancelledBookingId: id,
          });
        } finally {
          await redis.del(lockKey);
        }
      },
    });

    /** Today's appointments summary card */
    protectedApp.get("/v1/appointments/today", {
      preHandler: [requirePermission(PERMISSIONS.BOOKINGS_VIEW)],
      handler: async (request, reply) => {
        const now = new Date();
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const todayEnd = new Date(todayStart.getTime() + 86400_000 - 1);

        const tenantId = request.tenantId!;
        const [confirmed, completed, cancelled, noShow] = await Promise.all([
          prisma.booking.count({ where: { tenantId, status: "confirmed", startsAt: { gte: todayStart, lte: todayEnd } } }),
          prisma.booking.count({ where: { tenantId, status: "completed", startsAt: { gte: todayStart, lte: todayEnd } } }),
          prisma.booking.count({ where: { tenantId, status: "cancelled", startsAt: { gte: todayStart, lte: todayEnd } } }),
          prisma.booking.count({ where: { tenantId, status: "no_show", startsAt: { gte: todayStart, lte: todayEnd } } }),
        ]);

        return {
          data: {
            date: todayStart.toISOString().slice(0, 10),
            confirmed,
            completed,
            cancelled,
            noShow,
            total: confirmed + completed + cancelled + noShow,
          },
        };
      },
    });
  });
}
