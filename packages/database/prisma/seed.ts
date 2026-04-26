import { PrismaClient, BusinessVertical, UserRole, SuperAdminRole } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Super Admin ─────────────────────────
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: "admin@whatsapp-crm.com" },
    update: {},
    create: {
      email: "admin@whatsapp-crm.com",
      passwordHash: hashPassword("SuperAdmin@123"),
      name: "Platform Admin",
      role: SuperAdminRole.super_admin,
    },
  });
  console.log(`  ✓ Super Admin: ${superAdmin.email}`);

  // ─── Tenant 1: Salon ────────────────────
  const salon = await prisma.tenant.upsert({
    where: { slug: "glamour-salon" },
    update: {},
    create: {
      name: "Glamour Salon & Spa",
      slug: "glamour-salon",
      phone: "+919876543210",
      email: "info@glamoursalon.in",
      businessVertical: BusinessVertical.salon,
      verticalConfig: {
        services: ["Haircut", "Facial", "Manicure", "Pedicure", "Hair Color"],
        slotDurations: { Haircut: 30, Facial: 45, Manicure: 30, Pedicure: 30, "Hair Color": 90 },
      },
      status: "active",
    },
  });
  console.log(`  ✓ Tenant: ${salon.name}`);

  // ─── Tenant 2: Clinic ───────────────────
  const clinic = await prisma.tenant.upsert({
    where: { slug: "care-clinic" },
    update: {},
    create: {
      name: "Care Multispeciality Clinic",
      slug: "care-clinic",
      phone: "+919876543211",
      email: "info@careclinic.in",
      businessVertical: BusinessVertical.clinic,
      verticalConfig: {
        departments: ["General", "Dental", "Dermatology"],
        consultationDuration: 20,
      },
      status: "active",
    },
  });
  console.log(`  ✓ Tenant: ${clinic.name}`);

  // ─── Users for Salon ────────────────────
  const salonUsers = [
    { phone: "+919900000001", name: "Priya Sharma", role: UserRole.owner },
    { phone: "+919900000002", name: "Ravi Kumar", role: UserRole.admin },
    { phone: "+919900000003", name: "Anita Desai", role: UserRole.staff },
  ];

  for (const u of salonUsers) {
    await prisma.user.upsert({
      where: { tenantId_phone: { tenantId: salon.id, phone: u.phone } },
      update: {},
      create: { tenantId: salon.id, ...u },
    });
  }
  console.log(`  ✓ ${salonUsers.length} users for ${salon.name}`);

  // ─── Users for Clinic ───────────────────
  const clinicUsers = [
    { phone: "+919900000011", name: "Dr. Arjun Patel", role: UserRole.owner },
    { phone: "+919900000012", name: "Meera Reddy", role: UserRole.admin },
    { phone: "+919900000013", name: "Sneha Nair", role: UserRole.staff },
  ];

  for (const u of clinicUsers) {
    await prisma.user.upsert({
      where: { tenantId_phone: { tenantId: clinic.id, phone: u.phone } },
      update: {},
      create: { tenantId: clinic.id, ...u },
    });
  }
  console.log(`  ✓ ${clinicUsers.length} users for ${clinic.name}`);

  // ─── Providers for Salon ────────────────
  const salonProvider = await prisma.provider.create({
    data: {
      tenantId: salon.id,
      name: "Priya Sharma",
      phone: "+919900000001",
      specialization: "Hair Stylist",
      workingHours: {
        mon: { start: "09:00", end: "19:00" },
        tue: { start: "09:00", end: "19:00" },
        wed: { start: "09:00", end: "19:00" },
        thu: { start: "09:00", end: "19:00" },
        fri: { start: "09:00", end: "19:00" },
        sat: { start: "10:00", end: "17:00" },
      },
      slotDuration: 30,
    },
  });

  // ─── Provider for Clinic ────────────────
  const clinicProvider = await prisma.provider.create({
    data: {
      tenantId: clinic.id,
      name: "Dr. Arjun Patel",
      phone: "+919900000011",
      specialization: "General Physician",
      workingHours: {
        mon: { start: "10:00", end: "18:00" },
        tue: { start: "10:00", end: "18:00" },
        wed: { start: "10:00", end: "18:00" },
        thu: { start: "10:00", end: "18:00" },
        fri: { start: "10:00", end: "18:00" },
      },
      slotDuration: 20,
    },
  });
  console.log("  ✓ Providers created");

  // ─── Contacts ───────────────────────────
  const salonContact = await prisma.contact.create({
    data: {
      tenantId: salon.id,
      phoneE164: "+919800000001",
      name: "Neha Gupta",
      tags: ["vip", "regular"],
    },
  });

  const clinicContact = await prisma.contact.create({
    data: {
      tenantId: clinic.id,
      phoneE164: "+919800000002",
      name: "Rahul Verma",
      tags: ["new-patient"],
    },
  });
  console.log("  ✓ Contacts created");

  // ─── Sample Bookings ────────────────────
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.booking.create({
    data: {
      tenantId: salon.id,
      providerId: salonProvider.id,
      contactId: salonContact.id,
      startsAt: new Date(tomorrow.setHours(10, 0, 0, 0)),
      endsAt: new Date(tomorrow.setHours(10, 30, 0, 0)),
      status: "confirmed",
      notes: "Haircut + Blow-dry",
    },
  });

  await prisma.booking.create({
    data: {
      tenantId: clinic.id,
      providerId: clinicProvider.id,
      contactId: clinicContact.id,
      startsAt: new Date(tomorrow.setHours(14, 0, 0, 0)),
      endsAt: new Date(tomorrow.setHours(14, 20, 0, 0)),
      status: "confirmed",
      notes: "General checkup",
    },
  });
  console.log("  ✓ Bookings created");

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
