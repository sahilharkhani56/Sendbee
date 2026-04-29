import { prisma } from "@whatsapp-crm/database";

async function main() {
  const tenantId = process.argv[2];
  const waPhoneId = process.argv[3];
  const waAccessToken = process.argv[4] || "";

  if (!tenantId || !waPhoneId) {
    console.error("Usage: pnpm --filter api exec tsx src/seed-wa.ts <tenantId> <waPhoneId> [token]");
    process.exit(1);
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { waPhoneId, waAccessToken: waAccessToken || undefined },
  });

  console.log("OK:" + tenantId);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
