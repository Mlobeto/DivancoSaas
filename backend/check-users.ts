/// <reference types="node" />
import prisma from "./src/config/database";

async function checkUsers() {
  console.log("📋 Verificando usuarios en la base de datos...\n");

  const users = await prisma.user.findMany({
    include: {
      tenant: true,
      businessUnits: {
        include: {
          businessUnit: true,
          role: true,
        },
      },
    },
  });

  console.log(`Total usuarios: ${users.length}\n`);

  for (const user of users) {
    console.log("─".repeat(50));
    console.log(`👤 Usuario: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role Global: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId || "(sin tenant)"}`);
    if (user.tenant) {
      console.log(`   Tenant: ${user.tenant.name} (${user.tenant.slug})`);
    }
    console.log(`   Business Units (${user.businessUnits.length}):`);
    for (const ubu of user.businessUnits) {
      console.log(
        `      - ${ubu.businessUnit.name} (${ubu.businessUnit.slug})`,
      );
      console.log(`        BU ID: ${ubu.businessUnit.id}`);
      console.log(`        Role: ${ubu.role?.name || "(sin rol)"}`);
    }
    console.log("");
  }
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
