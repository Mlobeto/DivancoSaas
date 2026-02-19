import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script para asignar permisos a roles según su nivel de acceso
 *
 * Niveles de acceso:
 * - OWNER: Acceso total a todo
 * - ADMIN: Acceso completo excepto configuración de suscripción
 * - MANAGER: Gestión operativa (CRUD en la mayoría de módulos)
 * - EMPLOYEE: Operaciones básicas (crear, leer, actualizar en áreas específicas)
 * - VIEWER: Solo lectura
 */

interface PermissionDefinition {
  resource: string;
  action: string;
}

const PERMISSION_SETS = {
  // Permisos completos para un recurso
  FULL: (resource: string): PermissionDefinition[] => [
    { resource, action: "create" },
    { resource, action: "read" },
    { resource, action: "update" },
    { resource, action: "delete" },
  ],

  // Solo lectura
  READ: (resource: string): PermissionDefinition[] => [
    { resource, action: "read" },
  ],

  // CRUD básico (sin delete)
  CRUD_BASIC: (resource: string): PermissionDefinition[] => [
    { resource, action: "create" },
    { resource, action: "read" },
    { resource, action: "update" },
  ],
};

// Recursos del sistema
const RESOURCES = {
  // Core
  USERS: "users",
  ROLES: "roles",
  BUSINESS_UNITS: "business-units",
  SETTINGS: "settings",

  // Assets & Inventory
  ASSETS: "assets",
  ASSET_TEMPLATES: "asset-templates",
  SUPPLIES: "supplies",
  SUPPLY_CATEGORIES: "supply-categories",

  // Rental
  RENTAL_CONTRACTS: "rental-contracts",
  QUOTATIONS: "quotations",

  // Clients
  CLIENTS: "clients",
  ACCOUNTS: "accounts",

  // Purchasing
  SUPPLIERS: "suppliers",
  PURCHASE_ORDERS: "purchase-orders",
  SUPPLY_QUOTES: "supply-quotes",

  // Reports
  REPORTS: "reports",
  DASHBOARD: "dashboard",
};

async function main() {
  console.log("\n🔐 Asignando permisos a roles del sistema\n");

  // Obtener todos los permisos existentes
  const allPermissions = await prisma.permission.findMany();
  console.log(`📋 Total de permisos en el sistema: ${allPermissions.length}\n`);

  // Mapeo de permisos resource:action -> id
  const permissionMap = new Map<string, string>();
  allPermissions.forEach((perm) => {
    const key = `${perm.resource}:${perm.action}`;
    permissionMap.set(key, perm.id);
  });

  // Helper para obtener IDs de permisos
  const getPermissionIds = (permissions: PermissionDefinition[]): string[] => {
    return permissions
      .map((p) => permissionMap.get(`${p.resource}:${p.action}`))
      .filter((id): id is string => id !== undefined);
  };

  // ========================================
  // VIEWER - Solo lectura en todo
  // ========================================
  console.log("👁️  Configurando permisos para VIEWER (solo lectura)...");

  const viewerPermissions = [
    ...PERMISSION_SETS.READ(RESOURCES.DASHBOARD),
    ...PERMISSION_SETS.READ(RESOURCES.ASSETS),
    ...PERMISSION_SETS.READ(RESOURCES.SUPPLIES),
    ...PERMISSION_SETS.READ(RESOURCES.CLIENTS),
    ...PERMISSION_SETS.READ(RESOURCES.RENTAL_CONTRACTS),
    ...PERMISSION_SETS.READ(RESOURCES.QUOTATIONS),
    ...PERMISSION_SETS.READ(RESOURCES.REPORTS),
    ...PERMISSION_SETS.READ(RESOURCES.SUPPLIERS),
    ...PERMISSION_SETS.READ(RESOURCES.PURCHASE_ORDERS),
  ];

  await assignPermissionsToRole("role-viewer", viewerPermissions);
  console.log(`✅ VIEWER: ${viewerPermissions.length} permisos asignados\n`);

  // ========================================
  // EMPLOYEE - Operaciones básicas
  // ========================================
  console.log(
    "👤 Configurando permisos para EMPLOYEE (operaciones básicas)...",
  );

  const employeePermissions = [
    ...PERMISSION_SETS.READ(RESOURCES.DASHBOARD),
    ...PERMISSION_SETS.CRUD_BASIC(RESOURCES.ASSETS),
    ...PERMISSION_SETS.CRUD_BASIC(RESOURCES.SUPPLIES),
    ...PERMISSION_SETS.CRUD_BASIC(RESOURCES.CLIENTS),
    ...PERMISSION_SETS.CRUD_BASIC(RESOURCES.RENTAL_CONTRACTS),
    ...PERMISSION_SETS.CRUD_BASIC(RESOURCES.QUOTATIONS),
    ...PERMISSION_SETS.READ(RESOURCES.SUPPLIERS),
    ...PERMISSION_SETS.READ(RESOURCES.PURCHASE_ORDERS),
    ...PERMISSION_SETS.READ(RESOURCES.REPORTS),
  ];

  await assignPermissionsToRole("role-employee", employeePermissions);
  console.log(
    `✅ EMPLOYEE: ${employeePermissions.length} permisos asignados\n`,
  );

  // ========================================
  // MANAGER - Gestión operativa completa
  // ========================================
  console.log("👔 Configurando permisos para MANAGER (gestión operativa)...");

  const managerPermissions = [
    ...PERMISSION_SETS.FULL(RESOURCES.DASHBOARD),
    ...PERMISSION_SETS.FULL(RESOURCES.ASSETS),
    ...PERMISSION_SETS.FULL(RESOURCES.ASSET_TEMPLATES),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLIES),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLY_CATEGORIES),
    ...PERMISSION_SETS.FULL(RESOURCES.CLIENTS),
    ...PERMISSION_SETS.FULL(RESOURCES.ACCOUNTS),
    ...PERMISSION_SETS.FULL(RESOURCES.RENTAL_CONTRACTS),
    ...PERMISSION_SETS.FULL(RESOURCES.QUOTATIONS),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLIERS),
    ...PERMISSION_SETS.FULL(RESOURCES.PURCHASE_ORDERS),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLY_QUOTES),
    ...PERMISSION_SETS.FULL(RESOURCES.REPORTS),
    ...PERMISSION_SETS.READ(RESOURCES.USERS), // Can view users but not manage
  ];

  await assignPermissionsToRole("role-manager", managerPermissions);
  console.log(`✅ MANAGER: ${managerPermissions.length} permisos asignados\n`);

  // ========================================
  // ADMIN - Casi todo (excepto config de plataforma)
  // ========================================
  console.log(
    "🔧 Configurando permisos para ADMIN (acceso completo al tenant)...",
  );

  const adminPermissions = [
    ...PERMISSION_SETS.FULL(RESOURCES.USERS),
    ...PERMISSION_SETS.FULL(RESOURCES.BUSINESS_UNITS),
    ...PERMISSION_SETS.READ(RESOURCES.ROLES), // Can view roles but not modify system roles
    ...PERMISSION_SETS.FULL(RESOURCES.SETTINGS),
    ...PERMISSION_SETS.FULL(RESOURCES.DASHBOARD),
    ...PERMISSION_SETS.FULL(RESOURCES.ASSETS),
    ...PERMISSION_SETS.FULL(RESOURCES.ASSET_TEMPLATES),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLIES),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLY_CATEGORIES),
    ...PERMISSION_SETS.FULL(RESOURCES.CLIENTS),
    ...PERMISSION_SETS.FULL(RESOURCES.ACCOUNTS),
    ...PERMISSION_SETS.FULL(RESOURCES.RENTAL_CONTRACTS),
    ...PERMISSION_SETS.FULL(RESOURCES.QUOTATIONS),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLIERS),
    ...PERMISSION_SETS.FULL(RESOURCES.PURCHASE_ORDERS),
    ...PERMISSION_SETS.FULL(RESOURCES.SUPPLY_QUOTES),
    ...PERMISSION_SETS.FULL(RESOURCES.REPORTS),
  ];

  await assignPermissionsToRole("role-admin", adminPermissions);
  console.log(`✅ ADMIN: ${adminPermissions.length} permisos asignados\n`);

  // ========================================
  // OWNER - Acceso total
  // ========================================
  console.log("👑 Configurando permisos para OWNER (acceso total)...");

  const ownerPermissions = allPermissions.map((p) => ({
    resource: p.resource,
    action: p.action,
  }));

  await assignPermissionsToRole("role-owner", ownerPermissions);
  console.log(
    `✅ OWNER: ${ownerPermissions.length} permisos asignados (todos)\n`,
  );

  // Mostrar resumen
  console.log("=".repeat(50));
  console.log("✨ Permisos asignados exitosamente!\n");

  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { permissions: true },
      },
    },
    orderBy: { name: "asc" },
  });

  console.log("📊 Resumen de permisos por rol:\n");
  roles.forEach((role) => {
    console.log(
      `  ${role.name.padEnd(12)} → ${role._count.permissions} permisos`,
    );
  });
  console.log("=".repeat(50));
}

/**
 * Asigna permisos a un rol (elimina los existentes y crea los nuevos)
 */
async function assignPermissionsToRole(
  roleId: string,
  permissions: PermissionDefinition[],
) {
  // Obtener permisos existentes
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map<string, string>();
  allPermissions.forEach((perm) => {
    const key = `${perm.resource}:${perm.action}`;
    permissionMap.set(key, perm.id);
  });

  // Obtener IDs de permisos
  const permissionIds = permissions
    .map((p) => permissionMap.get(`${p.resource}:${p.action}`))
    .filter((id): id is string => id !== undefined);

  // Eliminar permisos existentes del rol
  await prisma.rolePermission.deleteMany({
    where: { roleId },
  });

  // Crear nuevos permisos
  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
