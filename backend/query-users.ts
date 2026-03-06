/// <reference types="node" />
import prisma from "./src/config/database";

async function queryUsers() {
  try {
    console.log("🔍 Consultando usuarios...\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true,
        tenantId: true,
      },
    });

    console.log(`Total: ${users.length} usuarios\n`);

    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`);
      console.log(`   Password hash existe: ${user.password ? "✓" : "✗"}`);
      console.log(`   Tenant ID: ${user.tenantId || "(null)"}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}\n`);
    });

    // Buscar business units del primer usuario
    if (users.length > 0) {
      const firstUser = users[0];
      const businessUnits = await prisma.userBusinessUnit.findMany({
        where: { userId: firstUser.id },
        include: {
          businessUnit: true,
          role: true,
        },
      });

      console.log(`Business Units del usuario ${firstUser.email}:`);
      businessUnits.forEach((ubu) => {
        console.log(`  - ${ubu.businessUnit.name} (${ubu.businessUnit.id})`);
        console.log(`    Role: ${ubu.role?.name}\n`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

queryUsers();
