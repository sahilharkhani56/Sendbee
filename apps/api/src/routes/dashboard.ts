import { FastifyInstance } from "fastify";
import { prisma } from "@whatsapp-crm/database";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";
import { redis } from "../redis";

// ─── Helpers ──────────────────────────────────────────────

/** Start of today (UTC) */
function todayStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Start of day N days ago (UTC) */
function daysAgo(n: number): Date {
  const d = todayStart();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/** Format date as YYYY-MM-DD */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════
// Dashboard & Analytics Routes
// ═══════════════════════════════════════════════════════════
export async function dashboardRoutes(app: FastifyInstance) {
  app.register(async (protectedApp) => {
    protectedApp.addHook("onRequest", tenantAuthMiddleware);

    // ═══ KPI OVERVIEW ════════════════════════════════════════

    /** GET /v1/dashboard/overview — KPI cards */
    protectedApp.get("/v1/dashboard/overview", {
      preHandler: [requirePermission(PERMISSIONS.ANALYTICS_VIEW)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const cacheKey = `dashboard:${tenantId}:overview`;

        // Check Redis cache (30s TTL)
        const cached = await redis.get(cacheKey);
        if (cached) {
          return { data: typeof cached === "string" ? JSON.parse(cached) : cached };
        }

        const today = todayStart();
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        // Run all KPI queries in parallel
        const [
          messagesToday,
          messagesInboundToday,
          messagesOutboundToday,
          conversationsOpen,
          conversationsTotal,
          appointmentsToday,
          appointmentsTodayByStatus,
          contactsTotal,
          contactsCreatedToday,
        ] = await Promise.all([
          // Total messages today
          prisma.message.count({
            where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
          }),
          // Inbound today
          prisma.message.count({
            where: { tenantId, direction: "inbound", createdAt: { gte: today, lt: tomorrow } },
          }),
          // Outbound today
          prisma.message.count({
            where: { tenantId, direction: "outbound", createdAt: { gte: today, lt: tomorrow } },
          }),
          // Open conversations
          prisma.conversation.count({
            where: { tenantId, status: "open" },
          }),
          // Total conversations
          prisma.conversation.count({
            where: { tenantId },
          }),
          // Appointments today (total)
          prisma.booking.count({
            where: { tenantId, startsAt: { gte: today, lt: tomorrow } },
          }),
          // Appointments today grouped by status
          prisma.booking.groupBy({
            by: ["status"],
            where: { tenantId, startsAt: { gte: today, lt: tomorrow } },
            _count: true,
          }),
          // Total active contacts
          prisma.contact.count({
            where: { tenantId, isDeleted: false },
          }),
          // New contacts today
          prisma.contact.count({
            where: { tenantId, isDeleted: false, createdAt: { gte: today, lt: tomorrow } },
          }),
        ]);

        // Build appointment status breakdown
        const appointmentsByStatus: Record<string, number> = {
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
        };
        for (const row of appointmentsTodayByStatus) {
          appointmentsByStatus[row.status] = row._count;
        }

        const overview = {
          date: fmtDate(today),
          messages: {
            total: messagesToday,
            inbound: messagesInboundToday,
            outbound: messagesOutboundToday,
          },
          conversations: {
            open: conversationsOpen,
            total: conversationsTotal,
          },
          appointments: {
            today: appointmentsToday,
            byStatus: appointmentsByStatus,
          },
          contacts: {
            total: contactsTotal,
            newToday: contactsCreatedToday,
          },
        };

        // Cache for 30s
        await redis.set(cacheKey, JSON.stringify(overview), { ex: 30 });

        return { data: overview };
      },
    });

    // ═══ MESSAGE VOLUME CHART (7-DAY) ════════════════════════

    /** GET /v1/dashboard/messages — 7-day message volume bar chart data */
    protectedApp.get("/v1/dashboard/messages", {
      preHandler: [requirePermission(PERMISSIONS.ANALYTICS_VIEW)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const cacheKey = `dashboard:${tenantId}:messages7d`;

        const cached = await redis.get(cacheKey);
        if (cached) {
          return { data: typeof cached === "string" ? JSON.parse(cached) : cached };
        }

        const sevenDaysAgo = daysAgo(6); // includes today = 7 days
        const tomorrow = new Date(todayStart());
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        // Get all messages in the 7-day window
        const messages = await prisma.message.findMany({
          where: {
            tenantId,
            createdAt: { gte: sevenDaysAgo, lt: tomorrow },
          },
          select: {
            direction: true,
            createdAt: true,
          },
        });

        // Build day-by-day breakdown
        const days: Array<{
          date: string;
          total: number;
          inbound: number;
          outbound: number;
        }> = [];

        for (let i = 6; i >= 0; i--) {
          const dayStart = daysAgo(i);
          const dayEnd = new Date(dayStart);
          dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
          const dateStr = fmtDate(dayStart);

          let inbound = 0;
          let outbound = 0;
          for (const m of messages) {
            if (m.createdAt >= dayStart && m.createdAt < dayEnd) {
              if (m.direction === "inbound") inbound++;
              else outbound++;
            }
          }

          days.push({
            date: dateStr,
            total: inbound + outbound,
            inbound,
            outbound,
          });
        }

        const result = {
          period: "7d",
          startDate: fmtDate(sevenDaysAgo),
          endDate: fmtDate(todayStart()),
          days,
        };

        await redis.set(cacheKey, JSON.stringify(result), { ex: 30 });

        return { data: result };
      },
    });

    // ═══ APPOINTMENT SUMMARY CHART ═══════════════════════════

    /** GET /v1/dashboard/appointments — Appointment summary by status */
    protectedApp.get("/v1/dashboard/appointments", {
      preHandler: [requirePermission(PERMISSIONS.ANALYTICS_VIEW)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const cacheKey = `dashboard:${tenantId}:appointments`;

        const cached = await redis.get(cacheKey);
        if (cached) {
          return { data: typeof cached === "string" ? JSON.parse(cached) : cached };
        }

        const today = todayStart();
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const sevenDaysAgo = daysAgo(6);

        // Parallel: today by status, 7-day by status, upcoming (next 7 days)
        const nextWeek = new Date(today);
        nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);

        const [todayByStatus, weekByStatus, upcoming] = await Promise.all([
          prisma.booking.groupBy({
            by: ["status"],
            where: { tenantId, startsAt: { gte: today, lt: tomorrow } },
            _count: true,
          }),
          prisma.booking.groupBy({
            by: ["status"],
            where: { tenantId, startsAt: { gte: sevenDaysAgo, lt: tomorrow } },
            _count: true,
          }),
          prisma.booking.count({
            where: {
              tenantId,
              status: "confirmed",
              startsAt: { gte: tomorrow, lt: nextWeek },
            },
          }),
        ]);

        const buildStatusMap = (rows: Array<{ status: string; _count: number }>) => {
          const map: Record<string, number> = { confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
          for (const row of rows) map[row.status] = row._count;
          return map;
        };

        const result = {
          date: fmtDate(today),
          today: buildStatusMap(todayByStatus),
          past7Days: buildStatusMap(weekByStatus),
          upcomingConfirmed: upcoming,
        };

        await redis.set(cacheKey, JSON.stringify(result), { ex: 30 });

        return { data: result };
      },
    });

    // ═══ CONVERSATION ANALYTICS ══════════════════════════════

    /** GET /v1/dashboard/conversations — Conversation analytics */
    protectedApp.get("/v1/dashboard/conversations", {
      preHandler: [requirePermission(PERMISSIONS.ANALYTICS_VIEW)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;
        const cacheKey = `dashboard:${tenantId}:conversations`;

        const cached = await redis.get(cacheKey);
        if (cached) {
          return { data: typeof cached === "string" ? JSON.parse(cached) : cached };
        }

        const today = todayStart();
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const [open, resolved, total, newToday, unreadTotal] = await Promise.all([
          prisma.conversation.count({ where: { tenantId, status: "open" } }),
          prisma.conversation.count({ where: { tenantId, status: "resolved" } }),
          prisma.conversation.count({ where: { tenantId } }),
          prisma.conversation.count({
            where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
          }),
          prisma.conversation.aggregate({
            where: { tenantId, status: "open" },
            _sum: { unreadCount: true },
          }),
        ]);

        const result = {
          date: fmtDate(today),
          open,
          resolved,
          total,
          newToday,
          totalUnread: unreadTotal._sum.unreadCount ?? 0,
        };

        await redis.set(cacheKey, JSON.stringify(result), { ex: 30 });

        return { data: result };
      },
    });
  });
}
