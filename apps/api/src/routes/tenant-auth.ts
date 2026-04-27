import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@whatsapp-crm/database";
import { sendOtp, verifyOtp } from "../services/otp";
import { signTenantTokens } from "../middleware/auth";

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Phone must be E.164 format (e.g. +919876543210)"),
});

const verifySchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Phone must be E.164 format"),
  code: z.string().length(6, "OTP must be 6 digits"),
  // Optional: provided during first-time signup to set name + vertical
  name: z.string().min(1).max(100).optional(),
  businessName: z.string().min(1).max(200).optional(),
  businessVertical: z
    .enum([
      "clinic", "salon", "gym", "education", "restaurant",
      "realestate", "legal", "repair", "events", "generic",
    ])
    .optional(),
});

export async function tenantAuthRoutes(app: FastifyInstance) {
  // ─── Send OTP ───────────────────────────────────────────
  app.post("/v1/auth/otp/send", async (request, reply) => {
    const parsed = phoneSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
      });
    }

    const result = await sendOtp(parsed.data.phone);
    if (!result.success) {
      return reply.status(429).send({
        error: { code: "RATE_LIMITED", message: result.message },
      });
    }

    return { message: result.message };
  });

  // ─── Verify OTP ─────────────────────────────────────────
  app.post("/v1/auth/otp/verify", async (request, reply) => {
    const parsed = verifySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
      });
    }

    const { phone, code, name, businessName, businessVertical } = parsed.data;

    const otpResult = await verifyOtp(phone, code);
    if (!otpResult.valid) {
      return reply.status(401).send({
        error: { code: "AUTH_OTP_INVALID", message: otpResult.message },
      });
    }

    // Check if user exists in any tenant
    const existingUser = await prisma.user.findFirst({
      where: { phone },
      include: { tenant: true },
    });

    // ─── FLOW D: Returning user ─────────────────────────
    if (existingUser && existingUser.isActive) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      });

      const tokens = signTenantTokens({
        userId: existingUser.id,
        tenantId: existingUser.tenantId,
        role: existingUser.role,
      });

      return {
        type: "login",
        user: {
          id: existingUser.id,
          name: existingUser.name,
          phone: existingUser.phone,
          role: existingUser.role,
        },
        tenant: {
          id: existingUser.tenant.id,
          name: existingUser.tenant.name,
          slug: existingUser.tenant.slug,
          businessVertical: existingUser.tenant.businessVertical,
        },
        ...tokens,
      };
    }

    // ─── FLOW C: Invited user (isActive: false) ─────────
    if (existingUser && !existingUser.isActive) {
      const activated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isActive: true,
          name: name || existingUser.name,
          lastLoginAt: new Date(),
        },
        include: { tenant: true },
      });

      const tokens = signTenantTokens({
        userId: activated.id,
        tenantId: activated.tenantId,
        role: activated.role,
      });

      return {
        type: "invite_accepted",
        user: {
          id: activated.id,
          name: activated.name,
          phone: activated.phone,
          role: activated.role,
        },
        tenant: {
          id: activated.tenant.id,
          name: activated.tenant.name,
          slug: activated.tenant.slug,
          businessVertical: activated.tenant.businessVertical,
        },
        ...tokens,
      };
    }

    // ─── FLOW B: New user signup ────────────────────────
    if (!businessName || !businessVertical) {
      return reply.status(200).send({
        type: "signup_required",
        message: "OTP verified. Please provide business details to complete signup.",
        phone,
        verified: true,
      });
    }

    // Create tenant + owner user in a transaction
    const slug =
      businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now().toString(36);

    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug,
          phone,
          businessVertical: businessVertical,
          status: "trial",
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          phone,
          name: name || "Business Owner",
          role: "owner",
          isActive: true,
          lastLoginAt: new Date(),
        },
      });

      return { tenant, user };
    });

    const tokens = signTenantTokens({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    });

    return {
      type: "signup",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        businessVertical: tenant.businessVertical,
      },
      ...tokens,
    };
  });
}
