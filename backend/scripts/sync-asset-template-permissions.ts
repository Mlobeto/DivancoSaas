/**
 * SCRIPT: Sincronizar permisos de asset-templates
 *
 * Registra los permisos de asset-templates y los asigna a roles existentes
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Sincronizando permisos de asset-templates...\n");

  // Permisos de asset-templates (globales, sin tenant/BU)
  const permissions = [
    {
      resource: "asset-templates",
      action: "create",
      description: "Create asset templates",
      scope: "BUSINESS_UNIT" as const,
    },
    {
      resource: "asset-templates",
      action: "read",
      description: "View asset templates",
      scope: "BUSINESS_UNIT" as const,
    },
    {
      resource: "asset-templates",
      action: "update",
      description: "Update asset templates",
      scope: "BUSINESS_UNIT" as const,
    },
    {
      resource: "asset-templates",
      action: "delete",
      description: "Delete asset templates",
      scope: "BUSINESS_UNIT" as const,
    },
  ];

  console.log("📝 Registrando permisos globales...");

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {
        description: perm.description,
        scope: perm.scope,
      },
      create: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
        scope: perm.scope,
      },
    });

    createdPermissions.push(permission);
    console.log(`   ✅ ${perm.resource}:${perm.action}`);
  }

  console.log("\n📋 Asignando permisos a roles...");

  // Asignar todos los permisos a OWNER y ADMIN
  const ownerRole = await prisma.role.findUnique({
    where: { id: "role-owner" },
  });

  const adminRole = await prisma.role.findUnique({
    where: { id: "role-admin" },
  });

  const managerRole = await prisma.role.findUnique({
    where: { id: "role-manager" },
  });

  if (ownerRole) {
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: ownerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`   ✅ Permisos asignados a rol OWNER`);
  }

  if (adminRole) {
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`   ✅ Permisos asignados a rol ADMIN`);
  }

  if (managerRole) {
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`   ✅ Permisos asignados a rol MANAGER`);
  }

  console.log("\n✨ Sincronización completada!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
