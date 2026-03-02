import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("\n=== Verificando Seed ===\n");

  const tenants = await prisma.tenant.findMany();
  console.log("📊 Tenants:", JSON.stringify(tenants, null, 2));

  const businessUnits = await prisma.businessUnit.findMany();
  console.log("\n🏗️  Business Units:", JSON.stringify(businessUnits, null, 2));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, tenantId: true },
  });
  console.log("\n👥 Users:", JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
