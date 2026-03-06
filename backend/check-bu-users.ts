/// <reference types="node" />
import prisma from "./src/config/database";

async function checkBUUsers() {
  try {
    console.log("🔍 Verificando usuarios con Business Units...\n");

    const users = await prisma.user.findMany({
      where: {
        tenantId: { not: null },
      },
      select: {
        email: true,
        tenantId: true,
        businessUnits: {
          include: {
            businessUnit: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`Usuarios con tenant (${users.length}):\n`);

    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log(`   Business Units: ${user.businessUnits.length}`);

      if (user.businessUnits.length > 0) {
        user.businessUnits.forEach((ubu, i) => {
          console.log(
            `   ${i + 1}. BU: ${ubu.businessUnit.name} (${ubu.businessUnit.slug})`,
          );
          console.log(`      BU ID: ${ubu.businessUnit.id}`);
          console.log(`      Role: ${ubu.role?.name || "Sin rol"}`);
        });
      } else {
        console.log(`   ⚠️  No tiene Business Units asignados`);
      }
      console.log("");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBUUsers();
