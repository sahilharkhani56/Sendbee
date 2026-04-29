import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@whatsapp-crm/database";
import { tenantAuthMiddleware, requirePermission } from "../middleware/auth";
import { PERMISSIONS } from "@whatsapp-crm/shared";
import { redis } from "../redis";
import { env } from "../env";

// ═══════════════════════════════════════════════════════════
// Plan Definitions (single source of truth)
// ═══════════════════════════════════════════════════════════

export const PLANS: Record<
  string,
  {
    name: string;
    price: number; // Monthly in paise (₹999 = 99900)
    priceDisplay: string;
    contacts: number;
    messagesPerMonth: number;
    teamMembers: number;
    trialDays: number;
  }
> = {
  trial: {
    name: "Trial",
    price: 0,
    priceDisplay: "Free (14 days)",
    contacts: 100,
    messagesPerMonth: 500,
    teamMembers: 1,
    trialDays: 14,
  },
  starter: {
    name: "Starter",
    price: 99900,
    priceDisplay: "₹999/mo",
    contacts: 500,
    messagesPerMonth: 5000,
    teamMembers: 2,
    trialDays: 0,
  },
  growth: {
    name: "Growth",
    price: 249900,
    priceDisplay: "₹2,499/mo",
    contacts: 2000,
    messagesPerMonth: 20000,
    teamMembers: 5,
    trialDays: 0,
  },
  pro: {
    name: "Pro",
    price: 499900,
    priceDisplay: "₹4,999/mo",
    contacts: 10000,
    messagesPerMonth: 100000,
    teamMembers: 10,
    trialDays: 0,
  },
};

// ═══════════════════════════════════════════════════════════
// Razorpay HTTP Client (no npm dependency — direct REST API)
// ═══════════════════════════════════════════════════════════

class RazorpayClient {
  private baseUrl = "https://api.razorpay.com/v1";
  private keyId: string;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  private get authHeader(): string {
    return (
      "Basic " +
      Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")
    );
  }

  async request(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await res.json()) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  }

  async createCustomer(
    name: string,
    email: string | null,
    phone: string
  ): Promise<Record<string, unknown>> {
    const { ok, data } = await this.request("POST", "/customers", {
      name,
      email: email || undefined,
      contact: phone,
    });
    if (!ok)
      throw new Error(`Razorpay create customer failed: ${JSON.stringify(data)}`);
    return data;
  }

  async createSubscription(params: {
    plan_id: string;
    customer_id: string;
    total_count: number;
    quantity: number;
    notes?: Record<string, string>;
  }): Promise<Record<string, unknown>> {
    const { ok, data } = await this.request("POST", "/subscriptions", params);
    if (!ok)
      throw new Error(
        `Razorpay create subscription failed: ${JSON.stringify(data)}`
      );
    return data;
  }

  async cancelSubscription(
    subId: string,
    cancelAtEnd: boolean
  ): Promise<Record<string, unknown>> {
    const { ok, data } = await this.request(
      "POST",
      `/subscriptions/${subId}/cancel`,
      { cancel_at_cycle_end: cancelAtEnd ? 1 : 0 }
    );
    if (!ok)
      throw new Error(
        `Razorpay cancel subscription failed: ${JSON.stringify(data)}`
      );
    return data;
  }

  async pauseSubscription(
    subId: string
  ): Promise<Record<string, unknown>> {
    const { ok, data } = await this.request(
      "POST",
      `/subscriptions/${subId}/pause`,
      { pause_initiated_by: "customer" }
    );
    if (!ok)
      throw new Error(
        `Razorpay pause subscription failed: ${JSON.stringify(data)}`
      );
    return data;
  }

  async resumeSubscription(
    subId: string
  ): Promise<Record<string, unknown>> {
    const { ok, data } = await this.request(
      "POST",
      `/subscriptions/${subId}/resume`,
      { resume_at: "now" }
    );
    if (!ok)
      throw new Error(
        `Razorpay resume subscription failed: ${JSON.stringify(data)}`
      );
    return data;
  }

  async fetchSubscription(
    subId: string
  ): Promise<Record<string, unknown>> {
    const { ok, data } = await this.request(
      "GET",
      `/subscriptions/${subId}`
    );
    if (!ok)
      throw new Error(
        `Razorpay fetch subscription failed: ${JSON.stringify(data)}`
      );
    return data;
  }

  async fetchPayment(
    paymentId: string
  ): Promise<Record<string, unknown>> {
    const { ok, data } = await this.request(
      "GET",
      `/payments/${paymentId}`
    );
    if (!ok)
      throw new Error(
        `Razorpay fetch payment failed: ${JSON.stringify(data)}`
      );
    return data;
  }
}

// Lazy init — only created when keys exist
let razorpay: RazorpayClient | null = null;
function getRazorpay(): RazorpayClient | null {
  if (razorpay) return razorpay;
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    razorpay = new RazorpayClient(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET);
    return razorpay;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// Helper: Get current month key (YYYY-MM)
// ═══════════════════════════════════════════════════════════

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// ═══════════════════════════════════════════════════════════
// Helper: Verify Razorpay Webhook Signature
// ═══════════════════════════════════════════════════════════

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

// ═══════════════════════════════════════════════════════════
// Helper: Enforce Plan Limits
// ═══════════════════════════════════════════════════════════

export async function checkPlanLimits(
  tenantId: string,
  resource: "contacts" | "messages" | "teamMembers"
): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, status: true },
  });

  if (!tenant) {
    return { allowed: false, current: 0, limit: 0, plan: "unknown" };
  }

  const planDef = PLANS[tenant.plan] || PLANS.trial;

  if (resource === "contacts") {
    const count = await prisma.contact.count({
      where: { tenantId, isDeleted: false },
    });
    return {
      allowed: count < planDef.contacts,
      current: count,
      limit: planDef.contacts,
      plan: tenant.plan,
    };
  }

  if (resource === "messages") {
    const month = currentMonth();
    const usage = await prisma.usageRecord.findUnique({
      where: { tenantId_month: { tenantId, month } },
    });
    const count = usage?.messages ?? 0;
    return {
      allowed: count < planDef.messagesPerMonth,
      current: count,
      limit: planDef.messagesPerMonth,
      plan: tenant.plan,
    };
  }

  if (resource === "teamMembers") {
    const count = await prisma.user.count({
      where: { tenantId, isActive: true },
    });
    return {
      allowed: count < planDef.teamMembers,
      current: count,
      limit: planDef.teamMembers,
      plan: tenant.plan,
    };
  }

  return { allowed: false, current: 0, limit: 0, plan: tenant.plan };
}

// ═══════════════════════════════════════════════════════════
// Helper: Increment Usage Counter
// ═══════════════════════════════════════════════════════════

export async function incrementUsage(
  tenantId: string,
  resource: "messages" | "contacts",
  delta: number = 1
): Promise<void> {
  const month = currentMonth();
  await prisma.usageRecord.upsert({
    where: { tenantId_month: { tenantId, month } },
    create: { tenantId, month, [resource]: delta },
    update: { [resource]: { increment: delta } },
  });
}

// ═══════════════════════════════════════════════════════════
// Validation Schemas
// ═══════════════════════════════════════════════════════════

const subscribePlanSchema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
});

const upgradePlanSchema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
});

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════

export async function billingRoutes(app: FastifyInstance) {
  // ─────────────────────────────────────────────────────────
  // Razorpay Webhook (NO auth — verified by signature)
  // ─────────────────────────────────────────────────────────
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => {
      // We need the raw body for signature verification
      // but Fastify may already have a JSON parser
      // This only applies to this encapsulated context
      try {
        const json = JSON.parse(body as string);
        // Stash raw body for signature verification
        (json as Record<string, unknown>).__rawBody = body;
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  app.post("/v1/billing/webhook", async (request, reply) => {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return reply.status(503).send({
        error: { code: "BILLING_NOT_CONFIGURED", message: "Billing webhooks not configured" },
      });
    }

    // Get raw body for signature verification
    const rawBody = (request.body as Record<string, unknown>).__rawBody as string;
    const signature = request.headers["x-razorpay-signature"] as string;

    if (!signature || !rawBody) {
      return reply.status(401).send({
        error: { code: "WEBHOOK_INVALID", message: "Missing signature" },
      });
    }

    // Verify HMAC SHA256 signature — prevents webhook forgery
    let isValid = false;
    try {
      isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return reply.status(401).send({
        error: { code: "WEBHOOK_INVALID", message: "Invalid signature" },
      });
    }

    const body = request.body as Record<string, unknown>;
    const event = body.event as string;
    const payload = body.payload as Record<string, unknown>;

    if (!event || !payload) {
      return reply.status(400).send({
        error: { code: "WEBHOOK_INVALID", message: "Invalid payload" },
      });
    }

    // Idempotency: dedup by event + entity ID to prevent replay/duplicate processing
    // Razorpay may retry webhooks — same event should be processed only once
    const entityPayload = (payload.payment || payload.subscription) as Record<string, unknown> | undefined;
    const entity = entityPayload?.entity as Record<string, unknown> | undefined;
    const entityId = entity?.id || "unknown";
    const dedupKey = `rz_webhook_dedup:${event}:${entityId}`;
    const wasSet = await redis.set(dedupKey, "1", { ex: 86400, nx: true });
    if (!wasSet) {
      // Already processed — return 200 to prevent Razorpay retries
      return { ok: true, message: "Already processed" };
    }

    // Process events
    try {
      switch (event) {
        case "subscription.activated":
        case "subscription.charged": {
          const sub = (payload.subscription as Record<string, unknown>)?.entity as Record<string, unknown>;
          if (!sub) break;
          const razorpaySubId = sub.id as string;
          const subscription = await prisma.subscription.findUnique({
            where: { razorpaySubId },
          });
          if (!subscription) break;

          await prisma.$transaction([
            prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: "active",
                currentPeriodStart: sub.current_start
                  ? new Date((sub.current_start as number) * 1000)
                  : undefined,
                currentPeriodEnd: sub.current_end
                  ? new Date((sub.current_end as number) * 1000)
                  : undefined,
              },
            }),
            prisma.tenant.update({
              where: { id: subscription.tenantId },
              data: {
                status: "active",
                plan: subscription.plan,
                planExpiresAt: sub.current_end
                  ? new Date((sub.current_end as number) * 1000)
                  : undefined,
              },
            }),
          ]);

          // Record payment if charged
          if (event === "subscription.charged") {
            const payment = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
            if (payment) {
              await prisma.payment.upsert({
                where: { razorpayPaymentId: payment.id as string },
                create: {
                  tenantId: subscription.tenantId,
                  subscriptionId: subscription.id,
                  razorpayPaymentId: payment.id as string,
                  razorpayOrderId: payment.order_id as string | undefined,
                  amount: payment.amount as number,
                  currency: (payment.currency as string) || "INR",
                  status: "captured",
                  method: payment.method as string | undefined,
                },
                update: { status: "captured" },
              });
            }
          }
          break;
        }

        case "subscription.cancelled": {
          const sub = (payload.subscription as Record<string, unknown>)?.entity as Record<string, unknown>;
          if (!sub) break;
          const razorpaySubId = sub.id as string;
          const subscription = await prisma.subscription.findUnique({
            where: { razorpaySubId },
          });
          if (!subscription) break;

          await prisma.$transaction([
            prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: "cancelled",
                cancelledAt: new Date(),
              },
            }),
            prisma.tenant.update({
              where: { id: subscription.tenantId },
              data: { status: "churned" },
            }),
          ]);
          break;
        }

        case "payment.captured": {
          const payment = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
          if (!payment) break;
          const paymentId = payment.id as string;
          // Update existing payment record
          await prisma.payment.updateMany({
            where: { razorpayPaymentId: paymentId },
            data: {
              status: "captured",
              method: payment.method as string | undefined,
            },
          });
          break;
        }

        case "payment.failed": {
          const payment = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
          if (!payment) break;
          const paymentId = payment.id as string;
          const notes = payment.notes as Record<string, string> | undefined;
          const tenantId = notes?.tenant_id;

          if (tenantId) {
            // Record failed payment
            await prisma.payment.upsert({
              where: { razorpayPaymentId: paymentId },
              create: {
                tenantId,
                razorpayPaymentId: paymentId,
                amount: payment.amount as number,
                currency: (payment.currency as string) || "INR",
                status: "failed",
                failureReason: (payment.error_description as string) || "Payment failed",
                method: payment.method as string | undefined,
              },
              update: {
                status: "failed",
                failureReason: (payment.error_description as string) || "Payment failed",
              },
            });

            // Set grace period (7 days) — tenant can still use the system
            const subscription = await prisma.subscription.findFirst({
              where: { tenantId, status: { in: ["active", "past_due"] } },
              orderBy: { createdAt: "desc" },
            });

            if (subscription) {
              const graceEnd = new Date();
              graceEnd.setDate(graceEnd.getDate() + 7);
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: "past_due", graceEndsAt: graceEnd },
              });
              await prisma.tenant.update({
                where: { id: tenantId },
                data: { status: "active" }, // Keep active during grace period
              });
            }
          }
          break;
        }

        default:
          // Unknown event — acknowledge to prevent retries
          break;
      }
    } catch (err) {
      // Log but return 200 — Razorpay retries on non-2xx
      request.log.error({ err, event }, "Webhook processing error");
    }

    return { ok: true };
  });

  // ─────────────────────────────────────────────────────────
  // All authenticated billing routes
  // ─────────────────────────────────────────────────────────
  app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", tenantAuthMiddleware);

    // ─── GET /v1/billing/plans — List all available plans ───
    protectedApp.get("/v1/billing/plans", async () => {
      return {
        plans: Object.entries(PLANS).map(([key, plan]) => ({
          id: key,
          ...plan,
        })),
      };
    });

    // ─── GET /v1/billing/current — Current subscription + usage ───
    protectedApp.get("/v1/billing/current", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_VIEW)],
      handler: async (request) => {
        const tenantId = request.tenantId!;
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { plan: true, planExpiresAt: true, status: true },
        });

        if (!tenant) {
          return { error: { code: "NOT_FOUND", message: "Tenant not found" } };
        }

        const planDef = PLANS[tenant.plan] || PLANS.trial;

        // Current subscription
        const subscription = await prisma.subscription.findFirst({
          where: {
            tenantId,
            status: { in: ["trialing", "active", "past_due", "paused"] },
          },
          orderBy: { createdAt: "desc" },
        });

        // Usage for current month
        const month = currentMonth();
        const usage = await prisma.usageRecord.findUnique({
          where: { tenantId_month: { tenantId, month } },
        });

        // Contact count
        const contactCount = await prisma.contact.count({
          where: { tenantId, isDeleted: false },
        });

        // Team member count
        const teamCount = await prisma.user.count({
          where: { tenantId, isActive: true },
        });

        return {
          plan: {
            id: tenant.plan,
            name: planDef.name,
            price: planDef.price,
            priceDisplay: planDef.priceDisplay,
            expiresAt: tenant.planExpiresAt,
            status: tenant.status,
          },
          subscription: subscription
            ? {
                id: subscription.id,
                status: subscription.status,
                razorpaySubId: subscription.razorpaySubId,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                trialEndsAt: subscription.trialEndsAt,
                graceEndsAt: subscription.graceEndsAt,
                cancelledAt: subscription.cancelledAt,
              }
            : null,
          usage: {
            messages: { current: usage?.messages ?? 0, limit: planDef.messagesPerMonth },
            contacts: { current: contactCount, limit: planDef.contacts },
            teamMembers: { current: teamCount, limit: planDef.teamMembers },
          },
        };
      },
    });

    // ─── POST /v1/billing/subscribe — Create Razorpay subscription ───
    protectedApp.post("/v1/billing/subscribe", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_MANAGE)],
      handler: async (request, reply) => {
        const parsed = subscribePlanSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid plan",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }

        const { plan } = parsed.data;
        const tenantId = request.tenantId!;
        const planDef = PLANS[plan];

        // Check for existing active subscription
        const existingSub = await prisma.subscription.findFirst({
          where: {
            tenantId,
            status: { in: ["active", "trialing", "past_due"] },
          },
        });

        if (existingSub) {
          return reply.status(409).send({
            error: {
              code: "SUBSCRIPTION_EXISTS",
              message: "Active subscription already exists. Use upgrade endpoint instead.",
            },
          });
        }

        // Prevent downgrade from current plan
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { plan: true, name: true, email: true, phone: true },
        });

        if (!tenant) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Tenant not found" },
          });
        }

        const rz = getRazorpay();

        if (!rz) {
          // Dev mode — create subscription record without Razorpay
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          const subscription = await prisma.$transaction(async (tx) => {
            const sub = await tx.subscription.create({
              data: {
                tenantId,
                plan,
                status: "active",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
            });

            await tx.tenant.update({
              where: { id: tenantId },
              data: {
                plan,
                status: "active",
                planExpiresAt: periodEnd,
              },
            });

            return sub;
          });

          return {
            subscription: {
              id: subscription.id,
              plan,
              status: subscription.status,
              currentPeriodEnd: periodEnd,
            },
            razorpay: null,
            message: "Subscription activated (dev mode — no Razorpay keys configured)",
          };
        }

        // Production: Create Razorpay subscription
        try {
          // Create/find Razorpay customer
          const customer = await rz.createCustomer(
            tenant.name,
            tenant.email,
            tenant.phone
          );

          // Create subscription on Razorpay
          const rzSub = await rz.createSubscription({
            plan_id: planDef.name.toLowerCase(), // Razorpay plan IDs (pre-created in dashboard)
            customer_id: customer.id as string,
            total_count: 120, // Max billing cycles (10 years)
            quantity: 1,
            notes: { tenant_id: tenantId, plan },
          });

          // Store in DB
          const subscription = await prisma.subscription.create({
            data: {
              tenantId,
              plan,
              status: "trialing",
              razorpaySubId: rzSub.id as string,
              razorpayPlanId: planDef.name.toLowerCase(),
              razorpayCustomerId: customer.id as string,
              metadata: { razorpay_response: rzSub },
            },
          });

          return {
            subscription: {
              id: subscription.id,
              plan,
              status: "trialing",
            },
            razorpay: {
              subscriptionId: rzSub.id,
              shortUrl: rzSub.short_url, // Razorpay hosted payment page
              status: rzSub.status,
            },
          };
        } catch (err) {
          request.log.error({ err }, "Razorpay subscription creation failed");
          return reply.status(502).send({
            error: {
              code: "PAYMENT_GATEWAY_ERROR",
              message: "Failed to create subscription with payment provider",
            },
          });
        }
      },
    });

    // ─── POST /v1/billing/upgrade — Change plan ─────────────
    protectedApp.post("/v1/billing/upgrade", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_MANAGE)],
      handler: async (request, reply) => {
        const parsed = upgradePlanSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid plan",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }

        const { plan: newPlan } = parsed.data;
        const tenantId = request.tenantId!;

        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { plan: true },
        });

        if (!tenant) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Tenant not found" },
          });
        }

        // Validate plan hierarchy
        const planOrder = ["trial", "starter", "growth", "pro"];
        const currentIdx = planOrder.indexOf(tenant.plan);
        const newIdx = planOrder.indexOf(newPlan);

        if (newIdx <= currentIdx) {
          return reply.status(400).send({
            error: {
              code: "INVALID_UPGRADE",
              message: `Cannot downgrade from ${tenant.plan} to ${newPlan}. Contact support for downgrades.`,
            },
          });
        }

        const existingSub = await prisma.subscription.findFirst({
          where: {
            tenantId,
            status: { in: ["active", "trialing", "past_due"] },
          },
          orderBy: { createdAt: "desc" },
        });

        const rz = getRazorpay();

        if (!rz || !existingSub?.razorpaySubId) {
          // Dev mode: direct upgrade
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await prisma.$transaction(async (tx) => {
            if (existingSub) {
              await tx.subscription.update({
                where: { id: existingSub.id },
                data: { status: "cancelled", cancelledAt: now },
              });
            }

            await tx.subscription.create({
              data: {
                tenantId,
                plan: newPlan,
                status: "active",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
            });

            await tx.tenant.update({
              where: { id: tenantId },
              data: { plan: newPlan, status: "active", planExpiresAt: periodEnd },
            });
          });

          return {
            message: `Upgraded to ${newPlan} (dev mode)`,
            plan: newPlan,
            expiresAt: periodEnd,
          };
        }

        // Production: Cancel old subscription, create new
        try {
          // Cancel current at end of cycle
          await rz.cancelSubscription(existingSub.razorpaySubId, false);

          // The new subscription is created client-side after redirect
          // Here we mark the old one and prepare for new
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: { status: "cancelled", cancelledAt: new Date() },
          });

          await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan: newPlan },
          });

          return {
            message: `Upgrade to ${newPlan} initiated. Complete payment to activate.`,
            plan: newPlan,
            action: "subscribe", // Client should call /subscribe with new plan
          };
        } catch (err) {
          request.log.error({ err }, "Razorpay upgrade failed");
          return reply.status(502).send({
            error: {
              code: "PAYMENT_GATEWAY_ERROR",
              message: "Failed to process upgrade",
            },
          });
        }
      },
    });

    // ─── POST /v1/billing/cancel — Cancel subscription ──────
    protectedApp.post("/v1/billing/cancel", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_MANAGE)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;

        const subscription = await prisma.subscription.findFirst({
          where: {
            tenantId,
            status: { in: ["active", "trialing", "past_due", "paused"] },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!subscription) {
          return reply.status(404).send({
            error: {
              code: "NO_SUBSCRIPTION",
              message: "No active subscription to cancel",
            },
          });
        }

        const rz = getRazorpay();

        if (rz && subscription.razorpaySubId) {
          try {
            await rz.cancelSubscription(subscription.razorpaySubId, true);
          } catch (err) {
            request.log.error({ err }, "Razorpay cancel failed");
            return reply.status(502).send({
              error: {
                code: "PAYMENT_GATEWAY_ERROR",
                message: "Failed to cancel with payment provider",
              },
            });
          }
        }

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "cancelled", cancelledAt: new Date() },
        });

        // Tenant stays active until period ends
        if (subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { planExpiresAt: subscription.currentPeriodEnd },
          });

          return {
            message: "Subscription cancelled. Access continues until period end.",
            accessUntil: subscription.currentPeriodEnd,
          };
        }

        // No period end — downgrade immediately
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { plan: "trial", status: "churned" },
        });

        return {
          message: "Subscription cancelled immediately.",
          accessUntil: null,
        };
      },
    });

    // ─── GET /v1/billing/payments — Payment history ─────────
    protectedApp.get("/v1/billing/payments", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_VIEW)],
      handler: async (request) => {
        const tenantId = request.tenantId!;
        const query = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(parseInt(query.limit || "20", 10), 50);

        const payments = await prisma.payment.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            method: true,
            description: true,
            failureReason: true,
            createdAt: true,
          },
        });

        const hasMore = payments.length > limit;
        if (hasMore) payments.pop();

        return {
          payments,
          nextCursor: hasMore ? payments[payments.length - 1].id : null,
        };
      },
    });

    // ─── GET /v1/billing/usage — Usage for current month ────
    protectedApp.get("/v1/billing/usage", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_VIEW)],
      handler: async (request) => {
        const tenantId = request.tenantId!;
        const query = request.query as { month?: string };
        const month = query.month || currentMonth();

        // Validate month format
        if (!/^\d{4}-\d{2}$/.test(month)) {
          return {
            error: { code: "VALIDATION_ERROR", message: "Month must be YYYY-MM format" },
          };
        }

        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { plan: true },
        });

        const planDef = PLANS[tenant?.plan || "trial"] || PLANS.trial;

        const usage = await prisma.usageRecord.findUnique({
          where: { tenantId_month: { tenantId, month } },
        });

        return {
          month,
          plan: tenant?.plan || "trial",
          messages: {
            used: usage?.messages ?? 0,
            limit: planDef.messagesPerMonth,
            remaining: Math.max(0, planDef.messagesPerMonth - (usage?.messages ?? 0)),
          },
          contacts: {
            used: usage?.contacts ?? 0,
            limit: planDef.contacts,
          },
        };
      },
    });

    // ─── POST /v1/billing/verify-payment — Verify Razorpay payment ───
    // Called by frontend after Razorpay checkout success
    protectedApp.post("/v1/billing/verify-payment", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_MANAGE)],
      handler: async (request, reply) => {
        const schema = z.object({
          razorpay_payment_id: z.string().min(1),
          razorpay_subscription_id: z.string().min(1),
          razorpay_signature: z.string().min(1),
        });

        const parsed = schema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }

        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
          parsed.data;

        // Verify signature: HMAC SHA256 of (payment_id + "|" + subscription_id) with key_secret
        const keySecret = env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
          // Dev mode — trust the payment
          const subscription = await prisma.subscription.findUnique({
            where: { razorpaySubId: razorpay_subscription_id },
          });

          if (!subscription) {
            return reply.status(404).send({
              error: { code: "NOT_FOUND", message: "Subscription not found" },
            });
          }

          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await prisma.$transaction([
            prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: "active",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
            }),
            prisma.tenant.update({
              where: { id: subscription.tenantId },
              data: {
                plan: subscription.plan,
                status: "active",
                planExpiresAt: periodEnd,
              },
            }),
          ]);

          return {
            verified: true,
            message: "Payment verified (dev mode)",
          };
        }

        // Production signature verification
        const expectedSignature = crypto
          .createHmac("sha256", keySecret)
          .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
          .digest("hex");

        const isValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "hex"),
          Buffer.from(razorpay_signature, "hex")
        );

        if (!isValid) {
          return reply.status(400).send({
            error: {
              code: "PAYMENT_VERIFICATION_FAILED",
              message: "Payment signature verification failed",
            },
          });
        }

        // Verified — activate subscription
        const subscription = await prisma.subscription.findUnique({
          where: { razorpaySubId: razorpay_subscription_id },
        });

        if (!subscription) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Subscription not found" },
          });
        }

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          }),
          prisma.tenant.update({
            where: { id: subscription.tenantId },
            data: {
              plan: subscription.plan,
              status: "active",
              planExpiresAt: periodEnd,
            },
          }),
          prisma.payment.create({
            data: {
              tenantId: subscription.tenantId,
              subscriptionId: subscription.id,
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
              amount: PLANS[subscription.plan]?.price ?? 0,
              currency: "INR",
              status: "captured",
            },
          }),
        ]);

        return { verified: true, message: "Payment verified and subscription activated" };
      },
    });

    // ─── POST /v1/billing/start-trial — Initialize trial ────
    // Called during onboarding (auto or manual)
    protectedApp.post("/v1/billing/start-trial", {
      preHandler: [requirePermission(PERMISSIONS.BILLING_MANAGE)],
      handler: async (request, reply) => {
        const tenantId = request.tenantId!;

        // Check if tenant already has a subscription
        const existing = await prisma.subscription.findFirst({
          where: { tenantId },
        });

        if (existing) {
          return reply.status(409).send({
            error: {
              code: "TRIAL_ALREADY_STARTED",
              message: "Trial or subscription already exists",
            },
          });
        }

        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14);

        const subscription = await prisma.$transaction(async (tx) => {
          const sub = await tx.subscription.create({
            data: {
              tenantId,
              plan: "trial",
              status: "trialing",
              trialEndsAt: trialEnd,
              currentPeriodStart: now,
              currentPeriodEnd: trialEnd,
            },
          });

          await tx.tenant.update({
            where: { id: tenantId },
            data: {
              plan: "trial",
              status: "trial",
              planExpiresAt: trialEnd,
            },
          });

          return sub;
        });

        return {
          message: "14-day trial started",
          trialEndsAt: trialEnd,
          subscription: {
            id: subscription.id,
            plan: "trial",
            status: "trialing",
            trialEndsAt: trialEnd,
          },
        };
      },
    });

    // ─── GET /v1/billing/check-limits — Quick limit check ───
    // Used by other endpoints to enforce plan limits
    protectedApp.get("/v1/billing/check-limits", {
      handler: async (request) => {
        const tenantId = request.tenantId!;
        const query = request.query as { resource?: string };
        const resource = query.resource as "contacts" | "messages" | "teamMembers";

        if (!resource || !["contacts", "messages", "teamMembers"].includes(resource)) {
          return {
            error: { code: "VALIDATION_ERROR", message: "resource must be contacts, messages, or teamMembers" },
          };
        }

        return await checkPlanLimits(tenantId, resource);
      },
    });
  });
}
