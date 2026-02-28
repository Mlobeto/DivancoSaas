/**
 * SEED: ROLES Y PERMISOS DE NEGOCIO
 *
 * Define los roles funcionales de la empresa y sus permisos.
 * Los permisos modelan las operaciones reales del negocio de alquiler.
 *
 * Ejecutar con: npx ts-node prisma/seed-roles-permissions.ts
 * O agregar al package.json: "seed:roles": "ts-node prisma/seed-roles-permissions.ts"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// PERMISOS DEL SISTEMA
// resource:action → descripción
// ============================================
const PERMISSIONS = [
  // Cotizaciones
  {
    resource: "quotations",
    action: "create",
    description: "Crear cotizaciones",
  },
  { resource: "quotations", action: "read", description: "Ver cotizaciones" },
  {
    resource: "quotations",
    action: "update",
    description: "Editar cotizaciones",
  },
  {
    resource: "quotations",
    action: "approve",
    description: "Aprobar cotizaciones",
  },
  {
    resource: "quotations",
    action: "delete",
    description: "Eliminar cotizaciones",
  },

  // Contratos de alquiler
  {
    resource: "contracts",
    action: "create",
    description: "Crear contratos de alquiler",
  },
  { resource: "contracts", action: "read", description: "Ver contratos" },
  { resource: "contracts", action: "update", description: "Editar contratos" },
  {
    resource: "contracts",
    action: "approve",
    description: "Aprobar contratos",
  },
  {
    resource: "contracts",
    action: "close",
    description: "Cerrar/finalizar contratos",
  },

  // Inventario / Activos
  { resource: "inventory", action: "read", description: "Ver inventario" },
  {
    resource: "inventory",
    action: "load",
    description: "Cargar stock / registrar ingresos",
  },
  {
    resource: "inventory",
    action: "deliver",
    description: "Entregar equipos e implementos",
  },
  {
    resource: "inventory",
    action: "authorize-dispatch",
    description: "Autorizar carga de equipos a obra",
  },
  {
    resource: "inventory",
    action: "manage",
    description: "Gestión completa de inventario",
  },

  // Órdenes de compra
  {
    resource: "purchase-orders",
    action: "create",
    description: "Crear órdenes de compra",
  },
  {
    resource: "purchase-orders",
    action: "read",
    description: "Ver órdenes de compra",
  },
  {
    resource: "purchase-orders",
    action: "update",
    description: "Editar órdenes de compra",
  },
  {
    resource: "purchase-orders",
    action: "approve",
    description: "Aprobar órdenes de compra",
  },

  // Clientes y cuentas corrientes
  { resource: "clients", action: "create", description: "Crear clientes" },
  { resource: "clients", action: "read", description: "Ver clientes" },
  { resource: "clients", action: "update", description: "Editar clientes" },

  // Facturación y finanzas
  {
    resource: "billing",
    action: "read",
    description: "Ver facturación y cuentas corrientes",
  },
  {
    resource: "billing",
    action: "discount",
    description: "Aplicar descuentos en cuenta corriente",
  },
  {
    resource: "billing",
    action: "manage",
    description: "Gestión completa de facturación",
  },

  // Mantenimiento preventivo
  {
    resource: "maintenance",
    action: "read",
    description: "Ver plan de mantenimiento",
  },
  {
    resource: "maintenance",
    action: "manage",
    description: "Gestionar mantenimiento preventivo",
  },

  // Operarios
  {
    resource: "operators",
    action: "create",
    description: "Registrar operarios",
  },
  { resource: "operators", action: "read", description: "Ver operarios" },
  { resource: "operators", action: "update", description: "Editar operarios" },
  {
    resource: "operators",
    action: "delete",
    description: "Eliminar operarios",
  },

  // Staff / Usuarios
  {
    resource: "users",
    action: "create",
    description: "Crear usuarios del sistema",
  },
  { resource: "users", action: "read", description: "Ver usuarios" },
  { resource: "users", action: "update", description: "Editar usuarios" },
  { resource: "users", action: "delete", description: "Eliminar usuarios" },

  // Reportes
  {
    resource: "reports",
    action: "read",
    description: "Ver reportes y estadísticas",
  },

  // Configuración
  {
    resource: "settings",
    action: "manage",
    description: "Gestionar configuración del sistema",
  },
];

// ============================================
// ROLES DE NEGOCIO Y SUS PERMISOS
// ============================================
const BUSINESS_ROLES: Array<{
  id: string;
  name: string;
  description: string;
  permissions: string[]; // "resource:action"
}> = [
  {
    id: "role-owner",
    name: "OWNER",
    description: "Propietario — acceso total al sistema",
    permissions: PERMISSIONS.map((p) => `${p.resource}:${p.action}`), // all
  },
  {
    id: "role-admin",
    name: "Administrativo",
    description: "Gestión general, usuarios, configuración y reportes",
    permissions: [
      "users:create",
      "users:read",
      "users:update",
      "users:delete",
      "settings:manage",
      "reports:read",
      "clients:read",
      "quotations:read",
      "contracts:read",
      "inventory:read",
      "purchase-orders:read",
      "operators:read",
    ],
  },
  {
    id: "role-comercial",
    name: "Comercial",
    description: "Cotizaciones, contratos y gestión de clientes",
    permissions: [
      "quotations:create",
      "quotations:read",
      "quotations:update",
      "contracts:create",
      "contracts:read",
      "clients:create",
      "clients:read",
      "clients:update",
      "billing:read",
      "inventory:read",
    ],
  },
  {
    id: "role-contable",
    name: "Contable",
    description: "Aprobaciones financieras, facturación y órdenes de compra",
    permissions: [
      "quotations:read",
      "quotations:approve",
      "contracts:read",
      "contracts:approve",
      "billing:read",
      "billing:discount",
      "billing:manage",
      "purchase-orders:read",
      "purchase-orders:approve",
      "reports:read",
    ],
  },
  {
    id: "role-operaciones",
    name: "Operaciones",
    description: "Entrega y retiro de equipos, despacho a obras",
    permissions: [
      "inventory:read",
      "inventory:deliver",
      "inventory:authorize-dispatch",
      "contracts:read",
      "operators:read",
    ],
  },
  {
    id: "role-compras",
    name: "Compras",
    description: "Órdenes de compra, abastecimiento y carga de stock",
    permissions: [
      "purchase-orders:create",
      "purchase-orders:read",
      "purchase-orders:update",
      "inventory:read",
      "inventory:load",
    ],
  },
  {
    id: "role-mantenimiento",
    name: "Mantenimiento",
    description: "Mantenimiento preventivo y gestión de insumos",
    permissions: [
      "maintenance:read",
      "maintenance:manage",
      "inventory:read",
      "inventory:load",
    ],
  },
  {
    id: "role-operario",
    name: "Operario",
    description: "Acceso básico — reportes diarios desde app móvil",
    permissions: ["inventory:read", "operators:read"],
  },
];

async function main() {
  console.log("🌱 Seed: Roles y Permisos de Negocio\n");

  // 1. Upsert all permissions
  console.log(`📝 Registrando ${PERMISSIONS.length} permisos...`);
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        resource_action: { resource: perm.resource, action: perm.action },
      },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log("✅ Permisos registrados\n");

  // 2. Upsert roles and their permission assignments
  console.log(`👤 Registrando ${BUSINESS_ROLES.length} roles...`);
  for (const roleDef of BUSINESS_ROLES) {
    // Upsert the role
    await prisma.role.upsert({
      where: { id: roleDef.id },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
      create: {
        id: roleDef.id,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
    });

    // Delete existing role-permissions and re-create
    await prisma.rolePermission.deleteMany({ where: { roleId: roleDef.id } });

    for (const permKey of roleDef.permissions) {
      const [resource, action] = permKey.split(":");
      const perm = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      });
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: roleDef.id, permissionId: perm.id },
        });
      } else {
        console.warn(`  ⚠️  Permiso no encontrado: ${permKey}`);
      }
    }

    console.log(
      `  ✅ ${roleDef.name} — ${roleDef.permissions.length} permisos`,
    );
  }

  console.log("\n🎉 ¡Seed completado!");
  console.log("\nROLES DISPONIBLES:");
  BUSINESS_ROLES.forEach((r) => {
    console.log(`  • ${r.name.padEnd(15)} — ${r.description}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
