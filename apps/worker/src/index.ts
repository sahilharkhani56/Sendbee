// Worker process — Appointment reminder processor + No-show detection
// Uses polling (1-minute interval) since Upstash Redis is REST-only (no BullMQ)

import { prisma, BookingStatus } from "@whatsapp-crm/database";
import { Redis } from "@upstash/redis";

// ─── Config ───────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 1 minute
const REMINDER_24H_WINDOW_MS = 24 * 60 * 60_000;
const REMINDER_2H_WINDOW_MS = 2 * 60 * 60_000;
const NO_SHOW_GRACE_MINUTES = 30;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

console.log("👷 Worker process starting...");
console.log("   Reminder polling interval: 60s");
console.log("   No-show detection: enabled");

// ─── Reminder Processor ───────────────────────────────────

async function processReminders(): Promise<void> {
  const now = new Date();

  // 24h reminders: bookings starting between 23h59m and 24h from now
  const in24h = new Date(now.getTime() + REMINDER_24H_WINDOW_MS);
  const in23h59m = new Date(now.getTime() + REMINDER_24H_WINDOW_MS - POLL_INTERVAL_MS);

  const bookings24h = await prisma.booking.findMany({
    where: {
      status: BookingStatus.confirmed,
      startsAt: { gte: in23h59m, lte: in24h },
    },
    include: {
      contact: { select: { id: true, phoneE164: true, name: true, optOut: true } },
      provider: { select: { id: true, name: true } },
      tenant: { select: { id: true, waPhoneId: true, waAccessToken: true, name: true } },
    },
  });

  for (const booking of bookings24h) {
    await sendReminder(booking, "24h");
  }

  // 2h reminders: bookings starting between 1h59m and 2h from now
  const in2h = new Date(now.getTime() + REMINDER_2H_WINDOW_MS);
  const in1h59m = new Date(now.getTime() + REMINDER_2H_WINDOW_MS - POLL_INTERVAL_MS);

  const bookings2h = await prisma.booking.findMany({
    where: {
      status: BookingStatus.confirmed,
      startsAt: { gte: in1h59m, lte: in2h },
    },
    include: {
      contact: { select: { id: true, phoneE164: true, name: true, optOut: true } },
      provider: { select: { id: true, name: true } },
      tenant: { select: { id: true, waPhoneId: true, waAccessToken: true, name: true } },
    },
  });

  for (const booking of bookings2h) {
    await sendReminder(booking, "2h");
  }
}

async function sendReminder(
  booking: {
    id: string;
    startsAt: Date;
    contact: { id: string; phoneE164: string; name: string | null; optOut: boolean };
    provider: { id: string; name: string };
    tenant: { id: string; waPhoneId: string | null; waAccessToken: string | null; name: string | null };
  },
  type: "24h" | "2h"
): Promise<void> {
  const dedupKey = `reminder_sent:${type}:${booking.id}`;
  const alreadySent = await redis.get(dedupKey);
  if (alreadySent) return;

  if (booking.contact.optOut) return;

  if (!booking.tenant.waPhoneId || !booking.tenant.waAccessToken) {
    console.log(`[Reminder] Skipping ${type} for booking ${booking.id} — no WA credentials`);
    return;
  }

  try {
    const { WhatsAppClient } = await import("@whatsapp-crm/whatsapp-sdk");
    const wa = new WhatsAppClient({
      phoneNumberId: booking.tenant.waPhoneId,
      accessToken: booking.tenant.waAccessToken,
    });

    const timeStr = booking.startsAt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    const dateStr = booking.startsAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });

    await wa.sendTemplate({
      to: booking.contact.phoneE164,
      templateName: "appointment_reminder",
      languageCode: "en",
      parameters: [
        { type: "text", text: booking.contact.name || "there" },
        { type: "text", text: booking.provider.name },
        { type: "text", text: `${dateStr} at ${timeStr}` },
      ],
    });

    await redis.set(dedupKey, "1", { ex: 90_000 });
    console.log(`[Reminder] Sent ${type} reminder for booking ${booking.id} to ${booking.contact.phoneE164}`);
  } catch (err) {
    console.error(`[Reminder] Failed ${type} for booking ${booking.id}:`, err);
  }
}

// ─── No-Show Detection ────────────────────────────────────

async function detectNoShows(): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - NO_SHOW_GRACE_MINUTES * 60_000);

  const overdueBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.confirmed,
      endsAt: { lte: cutoff },
    },
    select: { id: true },
  });

  if (overdueBookings.length > 0) {
    await prisma.booking.updateMany({
      where: { id: { in: overdueBookings.map((b) => b.id) } },
      data: { status: BookingStatus.no_show },
    });
    console.log(`[No-Show] Marked ${overdueBookings.length} bookings as no_show`);
  }
}

// ─── No-Show Follow-Up (next day) ────────────────────────

async function sendNoShowFollowUps(): Promise<void> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60_000);
  const dayBefore = new Date(now.getTime() - 48 * 60 * 60_000);

  const noShows = await prisma.booking.findMany({
    where: {
      status: BookingStatus.no_show,
      updatedAt: { gte: dayBefore, lte: yesterday },
    },
    include: {
      contact: { select: { phoneE164: true, name: true, optOut: true } },
      provider: { select: { name: true } },
      tenant: { select: { id: true, waPhoneId: true, waAccessToken: true } },
    },
  });

  for (const booking of noShows) {
    const dedupKey = `noshow_followup:${booking.id}`;
    const alreadySent = await redis.get(dedupKey);
    if (alreadySent || booking.contact.optOut) continue;
    if (!booking.tenant.waPhoneId || !booking.tenant.waAccessToken) continue;

    try {
      const { WhatsAppClient } = await import("@whatsapp-crm/whatsapp-sdk");
      const wa = new WhatsAppClient({
        phoneNumberId: booking.tenant.waPhoneId,
        accessToken: booking.tenant.waAccessToken,
      });

      await wa.sendTemplate({
        to: booking.contact.phoneE164,
        templateName: "no_show_followup",
        languageCode: "en",
        parameters: [
          { type: "text", text: booking.contact.name || "there" },
          { type: "text", text: booking.provider.name },
        ],
      });

      await redis.set(dedupKey, "1", { ex: 7 * 24 * 3600 });
      console.log(`[No-Show] Sent follow-up for booking ${booking.id}`);
    } catch (err) {
      console.error(`[No-Show] Follow-up failed for ${booking.id}:`, err);
    }
  }
}

// ─── Main Loop ────────────────────────────────────────────

async function tick(): Promise<void> {
  try {
    await processReminders();
    await detectNoShows();
    await sendNoShowFollowUps();
  } catch (err) {
    console.error("[Worker] Tick error:", err);
  }
}

tick();
setInterval(tick, POLL_INTERVAL_MS);

console.log("👷 Worker running — polling every 60s for reminders + no-shows");
