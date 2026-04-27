import { PrismaClient, BusinessVertical, UserRole, SuperAdminRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Super Admin ─────────────────────────
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: "admin@whatsapp-crm.com" },
    update: { passwordHash: await hashPassword("SuperAdmin@123") },
    create: {
      email: "admin@whatsapp-crm.com",
      passwordHash: await hashPassword("SuperAdmin@123"),
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
  let salonProvider = await prisma.provider.findFirst({
    where: { tenantId: salon.id, phone: "+919900000001" },
  });
  if (!salonProvider) {
    salonProvider = await prisma.provider.create({
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
  }

  // ─── Provider for Clinic ────────────────
  let clinicProvider = await prisma.provider.findFirst({
    where: { tenantId: clinic.id, phone: "+919900000011" },
  });
  if (!clinicProvider) {
    clinicProvider = await prisma.provider.create({
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
  }
  console.log("  ✓ Providers created/found");

  // ─── Contacts ───────────────────────────
  let salonContact = await prisma.contact.findFirst({
    where: { tenantId: salon.id, phoneE164: "+919800000001" },
  });
  if (!salonContact) {
    salonContact = await prisma.contact.create({
      data: {
        tenantId: salon.id,
        phoneE164: "+919800000001",
        name: "Neha Gupta",
        tags: ["vip", "regular"],
      },
    });
  }

  let clinicContact = await prisma.contact.findFirst({
    where: { tenantId: clinic.id, phoneE164: "+919800000002" },
  });
  if (!clinicContact) {
    clinicContact = await prisma.contact.create({
      data: {
        tenantId: clinic.id,
        phoneE164: "+919800000002",
        name: "Rahul Verma",
        tags: ["new-patient"],
      },
    });
  }
  console.log("  ✓ Contacts created/found");

  // ─── Sample Bookings (skip if already exist) ──
  const existingBookings = await prisma.booking.count({ where: { tenantId: salon.id } });
  if (existingBookings === 0) {
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
  } else {
    console.log("  ✓ Bookings already exist, skipping");
  }

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
