import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script for initializing RBAC permissions
 *
 * This script:
 * 1. Creates module-level permissions for all core modules
 * 2. Assigns all permissions to OWNER role
 * 3. Creates basic permissions for ADMIN and MANAGER roles
 */

interface PermissionDefinition {
  resource: string;
  action: string;
  description: string;
  scope: "TENANT" | "BUSINESS_UNIT" | "OWN";
}

// Define all module permissions
const MODULE_PERMISSIONS: PermissionDefinition[] = [
  // INVENTORY MODULE
  {
    resource: "assets",
    action: "read",
    description: "View assets (inventory)",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "assets",
    action: "create",
    description: "Create new assets",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "assets",
    action: "update",
    description: "Update existing assets",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "assets",
    action: "delete",
    description: "Delete assets",
    scope: "BUSINESS_UNIT",
  },

  // CLIENTS MODULE
  {
    resource: "clients",
    action: "read",
    description: "View clients",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "clients",
    action: "create",
    description: "Create new clients",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "clients",
    action: "update",
    description: "Update existing clients",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "clients",
    action: "delete",
    description: "Delete clients",
    scope: "BUSINESS_UNIT",
  },

  // PURCHASES MODULE
  {
    resource: "purchases",
    action: "read",
    description: "View purchase orders",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "purchases",
    action: "create",
    description: "Create purchase orders",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "purchases",
    action: "update",
    description: "Update purchase orders",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "purchases",
    action: "delete",
    description: "Delete purchase orders",
    scope: "BUSINESS_UNIT",
  },

  // RENTAL MODULE
  {
    resource: "rental",
    action: "read",
    description: "View rental data",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "rental",
    action: "create",
    description: "Create rental records",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "rental",
    action: "update",
    description: "Update rental records",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "rental",
    action: "delete",
    description: "Delete rental records",
    scope: "BUSINESS_UNIT",
  },

  // QUOTATIONS (Rental sub-module)
  {
    resource: "quotations",
    action: "read",
    description: "View quotations",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "quotations",
    action: "create",
    description: "Create quotations",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "quotations",
    action: "update",
    description: "Update quotations",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "quotations",
    action: "delete",
    description: "Delete quotations",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "quotations",
    action: "approve",
    description: "Approve quotations",
    scope: "BUSINESS_UNIT",
  },

  // CONTRACTS (Rental sub-module)
  {
    resource: "contracts",
    action: "read",
    description: "View rental contracts",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "contracts",
    action: "create",
    description: "Create rental contracts",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "contracts",
    action: "update",
    description: "Update rental contracts",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "contracts",
    action: "delete",
    description: "Delete rental contracts",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "contracts",
    action: "sign",
    description: "Sign rental contracts",
    scope: "BUSINESS_UNIT",
  },

  // TEMPLATES
  {
    resource: "templates",
    action: "read",
    description: "View templates",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "templates",
    action: "create",
    description: "Create templates",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "templates",
    action: "update",
    description: "Update templates",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "templates",
    action: "delete",
    description: "Delete templates",
    scope: "BUSINESS_UNIT",
  },

  // REPORTS
  {
    resource: "reports",
    action: "read",
    description: "View reports",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "reports",
    action: "export",
    description: "Export reports",
    scope: "BUSINESS_UNIT",
  },

  // SETTINGS
  {
    resource: "settings",
    action: "read",
    description: "View settings",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "settings",
    action: "update",
    description: "Update settings",
    scope: "BUSINESS_UNIT",
  },

  // USERS (Business Unit level)
  {
    resource: "users",
    action: "read",
    description: "View users",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "users",
    action: "create",
    description: "Create users",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "users",
    action: "update",
    description: "Update users",
    scope: "BUSINESS_UNIT",
  },
  {
    resource: "users",
    action: "delete",
    description: "Delete users",
    scope: "BUSINESS_UNIT",
  },
];

async function main() {
  console.log("🌱 Seeding RBAC permissions...");

  // 1. Create all permissions
  console.log("Creating permissions...");
  const createdPermissions = [];

  for (const permDef of MODULE_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: permDef.resource,
          action: permDef.action,
        },
      },
      create: {
        resource: permDef.resource,
        action: permDef.action,
        description: permDef.description,
        scope: permDef.scope,
      },
      update: {
        description: permDef.description,
        scope: permDef.scope,
      },
    });

    createdPermissions.push(permission);
    console.log(`  ✓ ${permission.resource}:${permission.action}`);
  }

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // 2. Find or create OWNER role
  console.log("\nConfiguring OWNER role...");
  let ownerRole = await prisma.role.findFirst({
    where: { name: "OWNER" },
  });

  if (!ownerRole) {
    ownerRole = await prisma.role.create({
      data: {
        name: "OWNER",
        description: "Business owner with full access to all modules",
        isSystem: true,
      },
    });
    console.log("  ✓ Created OWNER role");
  } else {
    console.log("  ✓ OWNER role already exists");
  }

  // 3. Assign ALL permissions to OWNER
  console.log("\nAssigning permissions to OWNER...");
  let assignedCount = 0;

  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: ownerRole.id,
        permissionId: permission.id,
      },
      update: {},
    });
    assignedCount++;
  }

  console.log(`✅ Assigned ${assignedCount} permissions to OWNER`);

  // 4. Find or create ADMIN role (limited permissions)
  console.log("\nConfiguring ADMIN role...");
  let adminRole = await prisma.role.findFirst({
    where: { name: "ADMIN" },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: "ADMIN",
        description: "Administrator with read/write access to most modules",
        isSystem: true,
      },
    });
    console.log("  ✓ Created ADMIN role");
  }

  // Assign read/write permissions (but not delete) to ADMIN
  const adminPermissions = createdPermissions.filter(
    (p) =>
      p.action === "read" || p.action === "create" || p.action === "update",
  );

  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
      update: {},
    });
  }

  console.log(`✅ Assigned ${adminPermissions.length} permissions to ADMIN`);

  // 5. Find or create MANAGER role (read-only mostly)
  console.log("\nConfiguring MANAGER role...");
  let managerRole = await prisma.role.findFirst({
    where: { name: "MANAGER" },
  });

  if (!managerRole) {
    managerRole = await prisma.role.create({
      data: {
        name: "MANAGER",
        description: "Manager with read access and limited write permissions",
        isSystem: true,
      },
    });
    console.log("  ✓ Created MANAGER role");
  }

  // Assign read + create permissions to MANAGER
  const managerPermissions = createdPermissions.filter(
    (p) => p.action === "read" || p.action === "create",
  );

  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
      update: {},
    });
  }

  console.log(
    `✅ Assigned ${managerPermissions.length} permissions to MANAGER`,
  );

  console.log("\n🎉 RBAC seeding completed successfully!");
  console.log("\nRoles configured:");
  console.log(`  - OWNER: ${assignedCount} permissions (full access)`);
  console.log(`  - ADMIN: ${adminPermissions.length} permissions (read/write)`);
  console.log(
    `  - MANAGER: ${managerPermissions.length} permissions (read/create)`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
