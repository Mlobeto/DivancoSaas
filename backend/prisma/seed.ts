/**
 * SEED DE DATOS BASE DEL SISTEMA
 *
 * Este seed crea:
 * 1. Roles base del sistema (admin, manager, employee, operator, viewer, accountant)
 * 2. Módulos disponibles (Machinery Rental, Inventory, Maintenance, etc.)
 * 3. Permisos granulares por módulo
 * 4. Asignación de permisos a roles (RolePermissions)
 *
 * Ejecutar con: npx prisma db seed
 */

import { PrismaClient, PermissionScope } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos base...\n");

  // ============================================
  // 1. ROLES BASE DEL SISTEMA
  // ============================================
  console.log("📝 Creando roles base...");

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { id: "role-admin" },
      update: {},
      create: {
        id: "role-admin",
        name: "admin",
        description:
          "Administrador con acceso completo a todas las funcionalidades",
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { id: "role-manager" },
      update: {},
      create: {
        id: "role-manager",
        name: "manager",
        description: "Gerente con permisos de gestión operativa",
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { id: "role-employee" },
      update: {},
      create: {
        id: "role-employee",
        name: "employee",
        description: "Empleado estándar con acceso a funcionalidades básicas",
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { id: "role-operator" },
      update: {},
      create: {
        id: "role-operator",
        name: "operator",
        description:
          "Operario de campo con acceso limitado (ideal para mobile)",
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { id: "role-viewer" },
      update: {},
      create: {
        id: "role-viewer",
        name: "viewer",
        description: "Observador con acceso de solo lectura",
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { id: "role-accountant" },
      update: {},
      create: {
        id: "role-accountant",
        name: "accountant",
        description: "Contador con acceso a reportes financieros y facturación",
        isSystem: true,
      },
    }),
  ]);

  console.log(`✅ ${roles.length} roles creados\n`);

  // ============================================
  // 2. MÓDULOS DEL SISTEMA
  // ============================================
  console.log("📦 Creando módulos disponibles...");

  const modules = await Promise.all([
    // Logística y Alquileres
    prisma.module.upsert({
      where: { name: "machinery-rental" },
      update: {},
      create: {
        name: "machinery-rental",
        displayName: "Alquiler de Maquinarias",
        description:
          "Gestión de alquiler de maquinarias y equipos para construcción",
        category: "logistics",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enableGPS: true,
          requirePhotos: true,
          offlineMode: true,
        }),
      },
    }),

    // Inventario
    prisma.module.upsert({
      where: { name: "inventory" },
      update: {},
      create: {
        name: "inventory",
        displayName: "Inventario",
        description: "Control de stock, productos, materiales y activos",
        category: "warehouse",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enableBarcode: true,
          enableLowStockAlerts: true,
          enableBatchTracking: true,
        }),
      },
    }),

    // Mantenimiento
    prisma.module.upsert({
      where: { name: "maintenance" },
      update: {},
      create: {
        name: "maintenance",
        displayName: "Mantenimiento",
        description:
          "Programación y seguimiento de mantenimientos preventivos y correctivos",
        category: "operations",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enablePreventiveMaintenance: true,
          enableMaintenanceAlerts: true,
        }),
      },
    }),

    // Reportes de Campo
    prisma.module.upsert({
      where: { name: "field-reports" },
      update: {},
      create: {
        name: "field-reports",
        displayName: "Reportes de Campo",
        description: "Reportes desde obra/campo con soporte offline (mobile)",
        category: "mobile",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          offlineMode: true,
          enablePhotos: true,
          enableGPS: true,
          enableSignatures: true,
        }),
      },
    }),

    // Cotizaciones y Ventas
    prisma.module.upsert({
      where: { name: "quotes-sales" },
      update: {},
      create: {
        name: "quotes-sales",
        displayName: "Cotizaciones y Ventas",
        description: "Gestión de cotizaciones, presupuestos y ventas",
        category: "commerce",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enableQuoteApproval: true,
          enableDiscounts: true,
          enableTaxCalculation: true,
        }),
      },
    }),

    // Proyectos de Arquitectura
    prisma.module.upsert({
      where: { name: "architecture-projects" },
      update: {},
      create: {
        name: "architecture-projects",
        displayName: "Proyectos de Arquitectura",
        description:
          "Gestión de proyectos arquitectónicos, planos y seguimiento",
        category: "projects",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enableFileAttachments: true,
          enableTaskTracking: true,
          enableTimeline: true,
        }),
      },
    }),

    // Gestión Ganadera
    prisma.module.upsert({
      where: { name: "livestock-management" },
      update: {},
      create: {
        name: "livestock-management",
        displayName: "Gestión Ganadera",
        description: "Control de ganado, sanidad, reproducción y producción",
        category: "agriculture",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enableHealthRecords: true,
          enableBreedingControl: true,
          enableWeightTracking: true,
        }),
      },
    }),

    // Punto de Venta (Ferretería)
    prisma.module.upsert({
      where: { name: "pos-retail" },
      update: {},
      create: {
        name: "pos-retail",
        displayName: "Punto de Venta (POS)",
        description: "Sistema de punto de venta para retail y ferretería",
        category: "commerce",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enableCashRegister: true,
          enableInvoicing: true,
          enablePaymentMethods: ["cash", "card", "transfer"],
        }),
      },
    }),

    // CRM
    prisma.module.upsert({
      where: { name: "crm" },
      update: {},
      create: {
        name: "crm",
        displayName: "CRM - Gestión de Clientes",
        description:
          "Gestión de relaciones con clientes, leads y oportunidades",
        category: "sales",
        version: "1.0.0",
        defaultConfig: JSON.stringify({
          enableLeadTracking: true,
          enableEmailIntegration: true,
        }),
      },
    }),
  ]);

  console.log(`✅ ${modules.length} módulos creados\n`);

  // ============================================
  // 3. PERMISOS GRANULARES
  // ============================================
  console.log("🔐 Creando permisos granulares...");

  const permissions = await Promise.all([
    // === MACHINERY RENTAL ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "machinery", action: "read" } },
      update: {},
      create: {
        resource: "machinery",
        action: "read",
        description: "Ver maquinarias disponibles",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "machinery", action: "create" } },
      update: {},
      create: {
        resource: "machinery",
        action: "create",
        description: "Registrar nuevas maquinarias",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "machinery", action: "update" } },
      update: {},
      create: {
        resource: "machinery",
        action: "update",
        description: "Actualizar información de maquinarias",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "machinery", action: "delete" } },
      update: {},
      create: {
        resource: "machinery",
        action: "delete",
        description: "Eliminar maquinarias del sistema",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "machinery", action: "rent" } },
      update: {},
      create: {
        resource: "machinery",
        action: "rent",
        description: "Alquilar maquinarias",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "machinery", action: "return" } },
      update: {},
      create: {
        resource: "machinery",
        action: "return",
        description: "Procesar devoluciones de maquinarias",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),

    // === INVENTORY ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "inventory", action: "read" } },
      update: {},
      create: {
        resource: "inventory",
        action: "read",
        description: "Ver inventario y stock",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "inventory", action: "create" } },
      update: {},
      create: {
        resource: "inventory",
        action: "create",
        description: "Agregar productos al inventario",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "inventory", action: "update" } },
      update: {},
      create: {
        resource: "inventory",
        action: "update",
        description: "Actualizar productos en inventario",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "inventory", action: "delete" } },
      update: {},
      create: {
        resource: "inventory",
        action: "delete",
        description: "Eliminar productos del inventario",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "inventory", action: "adjust" } },
      update: {},
      create: {
        resource: "inventory",
        action: "adjust",
        description: "Ajustar cantidades de stock",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),

    // === MAINTENANCE ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "maintenance", action: "read" } },
      update: {},
      create: {
        resource: "maintenance",
        action: "read",
        description: "Ver programación de mantenimientos",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: {
        resource_action: { resource: "maintenance", action: "schedule" },
      },
      update: {},
      create: {
        resource: "maintenance",
        action: "schedule",
        description: "Programar mantenimientos",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: {
        resource_action: { resource: "maintenance", action: "complete" },
      },
      update: {},
      create: {
        resource: "maintenance",
        action: "complete",
        description: "Marcar mantenimientos como completados",
        scope: PermissionScope.OWN,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "maintenance", action: "cancel" } },
      update: {},
      create: {
        resource: "maintenance",
        action: "cancel",
        description: "Cancelar mantenimientos programados",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),

    // === FIELD REPORTS ===
    prisma.permission.upsert({
      where: {
        resource_action: { resource: "field-report", action: "create" },
      },
      update: {},
      create: {
        resource: "field-report",
        action: "create",
        description: "Crear reportes desde campo/obra (mobile)",
        scope: PermissionScope.OWN,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "field-report", action: "read" } },
      update: {},
      create: {
        resource: "field-report",
        action: "read",
        description: "Ver reportes de campo",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: {
        resource_action: { resource: "field-report", action: "approve" },
      },
      update: {},
      create: {
        resource: "field-report",
        action: "approve",
        description: "Aprobar reportes de campo",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),

    // === QUOTES & SALES ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "quote", action: "read" } },
      update: {},
      create: {
        resource: "quote",
        action: "read",
        description: "Ver cotizaciones",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "quote", action: "create" } },
      update: {},
      create: {
        resource: "quote",
        action: "create",
        description: "Crear cotizaciones",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "quote", action: "update" } },
      update: {},
      create: {
        resource: "quote",
        action: "update",
        description: "Editar cotizaciones",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "quote", action: "approve" } },
      update: {},
      create: {
        resource: "quote",
        action: "approve",
        description: "Aprobar cotizaciones",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "sale", action: "create" } },
      update: {},
      create: {
        resource: "sale",
        action: "create",
        description: "Procesar ventas",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "sale", action: "read" } },
      update: {},
      create: {
        resource: "sale",
        action: "read",
        description: "Ver ventas registradas",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),

    // === PROJECTS ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "project", action: "read" } },
      update: {},
      create: {
        resource: "project",
        action: "read",
        description: "Ver proyectos",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "project", action: "create" } },
      update: {},
      create: {
        resource: "project",
        action: "create",
        description: "Crear nuevos proyectos",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "project", action: "update" } },
      update: {},
      create: {
        resource: "project",
        action: "update",
        description: "Actualizar proyectos",
        scope: PermissionScope.OWN,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "project", action: "delete" } },
      update: {},
      create: {
        resource: "project",
        action: "delete",
        description: "Eliminar proyectos",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),

    // === LIVESTOCK ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "livestock", action: "read" } },
      update: {},
      create: {
        resource: "livestock",
        action: "read",
        description: "Ver ganado registrado",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "livestock", action: "register" } },
      update: {},
      create: {
        resource: "livestock",
        action: "register",
        description: "Registrar nuevos animales",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "livestock", action: "health" } },
      update: {},
      create: {
        resource: "livestock",
        action: "health",
        description: "Registrar controles sanitarios",
        scope: PermissionScope.OWN,
      },
    }),

    // === USERS & SETTINGS ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "user", action: "read" } },
      update: {},
      create: {
        resource: "user",
        action: "read",
        description: "Ver usuarios de la BU",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "user", action: "create" } },
      update: {},
      create: {
        resource: "user",
        action: "create",
        description: "Invitar y crear usuarios",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "user", action: "update" } },
      update: {},
      create: {
        resource: "user",
        action: "update",
        description: "Actualizar usuarios",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "user", action: "delete" } },
      update: {},
      create: {
        resource: "user",
        action: "delete",
        description: "Eliminar usuarios",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "settings", action: "read" } },
      update: {},
      create: {
        resource: "settings",
        action: "read",
        description: "Ver configuración de la BU",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "settings", action: "update" } },
      update: {},
      create: {
        resource: "settings",
        action: "update",
        description: "Modificar configuración de la BU",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),

    // === REPORTS ===
    prisma.permission.upsert({
      where: { resource_action: { resource: "report", action: "read" } },
      update: {},
      create: {
        resource: "report",
        action: "read",
        description: "Ver reportes y estadísticas",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "report", action: "export" } },
      update: {},
      create: {
        resource: "report",
        action: "export",
        description: "Exportar reportes a PDF/Excel",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
  ]);

  console.log(`✅ ${permissions.length} permisos creados\n`);

  // ============================================
  // 4. ASIGNACIÓN DE PERMISOS A ROLES
  // ============================================
  console.log("🔗 Asignando permisos a roles...");

  // Helper para crear role permissions de forma segura
  const createRolePermissions = async (
    roleName: string,
    permissionPatterns: { resource: string; action: string }[],
  ) => {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return [];

    const rolePermissions = [];
    for (const pattern of permissionPatterns) {
      const permission = permissions.find(
        (p) => p.resource === pattern.resource && p.action === pattern.action,
      );
      if (permission) {
        const rp = await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        rolePermissions.push(rp);
      }
    }
    return rolePermissions;
  };

  // === ADMIN: Todos los permisos ===
  const adminPerms = await createRolePermissions("admin", [
    // Machinery
    { resource: "machinery", action: "read" },
    { resource: "machinery", action: "create" },
    { resource: "machinery", action: "update" },
    { resource: "machinery", action: "delete" },
    { resource: "machinery", action: "rent" },
    { resource: "machinery", action: "return" },
    // Inventory
    { resource: "inventory", action: "read" },
    { resource: "inventory", action: "create" },
    { resource: "inventory", action: "update" },
    { resource: "inventory", action: "delete" },
    { resource: "inventory", action: "adjust" },
    // Maintenance
    { resource: "maintenance", action: "read" },
    { resource: "maintenance", action: "schedule" },
    { resource: "maintenance", action: "complete" },
    { resource: "maintenance", action: "cancel" },
    // Field Reports
    { resource: "field-report", action: "read" },
    { resource: "field-report", action: "create" },
    { resource: "field-report", action: "approve" },
    // Quotes & Sales
    { resource: "quote", action: "read" },
    { resource: "quote", action: "create" },
    { resource: "quote", action: "update" },
    { resource: "quote", action: "approve" },
    { resource: "sale", action: "read" },
    { resource: "sale", action: "create" },
    // Projects
    { resource: "project", action: "read" },
    { resource: "project", action: "create" },
    { resource: "project", action: "update" },
    { resource: "project", action: "delete" },
    // Livestock
    { resource: "livestock", action: "read" },
    { resource: "livestock", action: "register" },
    { resource: "livestock", action: "health" },
    // Users
    { resource: "user", action: "read" },
    { resource: "user", action: "create" },
    { resource: "user", action: "update" },
    { resource: "user", action: "delete" },
    // Settings & Reports
    { resource: "settings", action: "read" },
    { resource: "settings", action: "update" },
    { resource: "report", action: "read" },
    { resource: "report", action: "export" },
  ]);

  // === MANAGER: Gestión operativa sin eliminar ===
  const managerPerms = await createRolePermissions("manager", [
    { resource: "machinery", action: "read" },
    { resource: "machinery", action: "create" },
    { resource: "machinery", action: "update" },
    { resource: "machinery", action: "rent" },
    { resource: "machinery", action: "return" },
    { resource: "inventory", action: "read" },
    { resource: "inventory", action: "create" },
    { resource: "inventory", action: "update" },
    { resource: "inventory", action: "adjust" },
    { resource: "maintenance", action: "read" },
    { resource: "maintenance", action: "schedule" },
    { resource: "maintenance", action: "cancel" },
    { resource: "field-report", action: "read" },
    { resource: "field-report", action: "approve" },
    { resource: "quote", action: "read" },
    { resource: "quote", action: "create" },
    { resource: "quote", action: "update" },
    { resource: "quote", action: "approve" },
    { resource: "sale", action: "read" },
    { resource: "sale", action: "create" },
    { resource: "project", action: "read" },
    { resource: "project", action: "create" },
    { resource: "project", action: "update" },
    { resource: "livestock", action: "read" },
    { resource: "livestock", action: "register" },
    { resource: "user", action: "read" },
    { resource: "user", action: "create" },
    { resource: "settings", action: "read" },
    { resource: "report", action: "read" },
    { resource: "report", action: "export" },
  ]);

  // === EMPLOYEE: Operaciones básicas ===
  const employeePerms = await createRolePermissions("employee", [
    { resource: "machinery", action: "read" },
    { resource: "machinery", action: "rent" },
    { resource: "machinery", action: "return" },
    { resource: "inventory", action: "read" },
    { resource: "inventory", action: "update" },
    { resource: "maintenance", action: "read" },
    { resource: "maintenance", action: "complete" },
    { resource: "field-report", action: "read" },
    { resource: "quote", action: "read" },
    { resource: "quote", action: "create" },
    { resource: "sale", action: "read" },
    { resource: "sale", action: "create" },
    { resource: "project", action: "read" },
    { resource: "project", action: "update" },
    { resource: "livestock", action: "read" },
    { resource: "livestock", action: "health" },
    { resource: "user", action: "read" },
    { resource: "report", action: "read" },
  ]);

  // === OPERATOR: Solo campo/mobile ===
  const operatorPerms = await createRolePermissions("operator", [
    { resource: "machinery", action: "read" },
    { resource: "field-report", action: "create" },
    { resource: "maintenance", action: "complete" },
    { resource: "livestock", action: "health" },
  ]);

  // === VIEWER: Solo lectura ===
  const viewerPerms = await createRolePermissions("viewer", [
    { resource: "machinery", action: "read" },
    { resource: "inventory", action: "read" },
    { resource: "maintenance", action: "read" },
    { resource: "field-report", action: "read" },
    { resource: "quote", action: "read" },
    { resource: "sale", action: "read" },
    { resource: "project", action: "read" },
    { resource: "livestock", action: "read" },
    { resource: "user", action: "read" },
    { resource: "settings", action: "read" },
    { resource: "report", action: "read" },
  ]);

  // === ACCOUNTANT: Finanzas y reportes ===
  const accountantPerms = await createRolePermissions("accountant", [
    { resource: "quote", action: "read" },
    { resource: "sale", action: "read" },
    { resource: "inventory", action: "read" },
    { resource: "report", action: "read" },
    { resource: "report", action: "export" },
    { resource: "settings", action: "read" },
  ]);

  const totalRolePerms =
    adminPerms.length +
    managerPerms.length +
    employeePerms.length +
    operatorPerms.length +
    viewerPerms.length +
    accountantPerms.length;

  console.log(`✅ ${totalRolePerms} asignaciones de permisos creadas\n`);

  // ============================================
  // RESUMEN
  // ============================================
  console.log("=".repeat(50));
  // ============================================
  // 6. INTENCIONES DEL SISTEMA
  // ============================================
  console.log("🎯 Creando intenciones base...");

  const intents = await Promise.all([
    // Storage e imágenes
    prisma.intentDefinition.upsert({
      where: { name: "UPLOAD_IMAGE" },
      update: {},
      create: {
        name: "UPLOAD_IMAGE",
        displayName: "Subir Imagen",
        description: "Permite subir una imagen al storage",
        category: "storage",
        defaultModule: "storage",
        defaultAction: "uploadFile",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "UPLOAD_FILE" },
      update: {},
      create: {
        name: "UPLOAD_FILE",
        displayName: "Subir Archivo",
        description: "Permite subir cualquier tipo de archivo",
        category: "storage",
        defaultModule: "storage",
        defaultAction: "uploadFile",
        isActive: true,
      },
    }),

    // Proyectos
    prisma.intentDefinition.upsert({
      where: { name: "PROJECT_UPDATE" },
      update: {},
      create: {
        name: "PROJECT_UPDATE",
        displayName: "Actualizar Proyecto",
        description:
          "Permite actualizar el estado o información de un proyecto",
        category: "projects",
        defaultModule: "projects",
        defaultAction: "updateStatus",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "PROJECT_CREATE" },
      update: {},
      create: {
        name: "PROJECT_CREATE",
        displayName: "Crear Proyecto",
        description: "Permite crear un nuevo proyecto",
        category: "projects",
        defaultModule: "projects",
        defaultAction: "create",
        isActive: true,
      },
    }),

    // Comunicaciones
    prisma.intentDefinition.upsert({
      where: { name: "SEND_MESSAGE" },
      update: {},
      create: {
        name: "SEND_MESSAGE",
        displayName: "Enviar Mensaje",
        description: "Permite enviar un mensaje por cualquier canal",
        category: "communications",
        defaultModule: "communications",
        defaultAction: "sendMessage",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "SEND_NOTIFICATION" },
      update: {},
      create: {
        name: "SEND_NOTIFICATION",
        displayName: "Enviar Notificación",
        description: "Permite enviar una notificación push",
        category: "communications",
        defaultModule: "communications",
        defaultAction: "sendNotification",
        isActive: true,
      },
    }),

    // Pagos y facturación
    prisma.intentDefinition.upsert({
      where: { name: "CREATE_INVOICE" },
      update: {},
      create: {
        name: "CREATE_INVOICE",
        displayName: "Crear Factura",
        description: "Permite crear una factura o documento fiscal",
        category: "billing",
        defaultModule: "billing",
        defaultAction: "createInvoice",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "SEND_PAYMENT_REMINDER" },
      update: {},
      create: {
        name: "SEND_PAYMENT_REMINDER",
        displayName: "Recordatorio de Pago",
        description: "Envía un recordatorio de pago pendiente",
        category: "billing",
        defaultModule: "billing",
        defaultAction: "sendPaymentReminder",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "REGISTER_PAYMENT" },
      update: {},
      create: {
        name: "REGISTER_PAYMENT",
        displayName: "Registrar Pago",
        description: "Permite registrar un pago recibido",
        category: "billing",
        defaultModule: "billing",
        defaultAction: "registerPayment",
        isActive: true,
      },
    }),

    // Tareas y asignaciones
    prisma.intentDefinition.upsert({
      where: { name: "ASSIGN_TASK" },
      update: {},
      create: {
        name: "ASSIGN_TASK",
        displayName: "Asignar Tarea",
        description: "Permite asignar una tarea a un usuario",
        category: "tasks",
        defaultModule: "tasks",
        defaultAction: "assignTask",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "COMPLETE_TASK" },
      update: {},
      create: {
        name: "COMPLETE_TASK",
        displayName: "Completar Tarea",
        description: "Marca una tarea como completada",
        category: "tasks",
        defaultModule: "tasks",
        defaultAction: "completeTask",
        isActive: true,
      },
    }),

    // Trabajo en campo
    prisma.intentDefinition.upsert({
      where: { name: "REGISTER_WORK_EVENT" },
      update: {},
      create: {
        name: "REGISTER_WORK_EVENT",
        displayName: "Registrar Evento de Trabajo",
        description: "Permite registrar horas trabajadas o evento en campo",
        category: "workforce",
        defaultModule: "workforce",
        defaultAction: "registerWorkEvent",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "CHECK_IN" },
      update: {},
      create: {
        name: "CHECK_IN",
        displayName: "Check In",
        description: "Registra entrada o inicio de jornada",
        category: "workforce",
        defaultModule: "workforce",
        defaultAction: "checkIn",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "CHECK_OUT" },
      update: {},
      create: {
        name: "CHECK_OUT",
        displayName: "Check Out",
        description: "Registra salida o fin de jornada",
        category: "workforce",
        defaultModule: "workforce",
        defaultAction: "checkOut",
        isActive: true,
      },
    }),

    // Inventario
    prisma.intentDefinition.upsert({
      where: { name: "UPDATE_INVENTORY" },
      update: {},
      create: {
        name: "UPDATE_INVENTORY",
        displayName: "Actualizar Inventario",
        description: "Actualiza cantidades o estado de inventario",
        category: "inventory",
        defaultModule: "inventory",
        defaultAction: "updateStock",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "REQUEST_MATERIAL" },
      update: {},
      create: {
        name: "REQUEST_MATERIAL",
        displayName: "Solicitar Material",
        description: "Crea solicitud de material o insumo",
        category: "inventory",
        defaultModule: "inventory",
        defaultAction: "requestMaterial",
        isActive: true,
      },
    }),

    // Entidades genéricas
    prisma.intentDefinition.upsert({
      where: { name: "CREATE_ENTITY" },
      update: {},
      create: {
        name: "CREATE_ENTITY",
        displayName: "Crear Entidad",
        description: "Crea una entidad genérica del sistema",
        category: "general",
        defaultModule: "core",
        defaultAction: "createEntity",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "UPDATE_STATUS" },
      update: {},
      create: {
        name: "UPDATE_STATUS",
        displayName: "Actualizar Estado",
        description: "Actualiza el estado de cualquier entidad",
        category: "general",
        defaultModule: "core",
        defaultAction: "updateStatus",
        isActive: true,
      },
    }),
    prisma.intentDefinition.upsert({
      where: { name: "DELETE_ENTITY" },
      update: {},
      create: {
        name: "DELETE_ENTITY",
        displayName: "Eliminar Entidad",
        description: "Elimina una entidad del sistema",
        category: "general",
        defaultModule: "core",
        defaultAction: "deleteEntity",
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${intents.length} intenciones creadas\n`);

  // ============================================
  // 7. DATOS DE PRUEBA: ALQUILER DE IMPLEMENTOS
  // ============================================
  console.log("🏗️  Creando datos de prueba para negocio de alquiler...");

  // Tenant demo
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "construcciones-demo" },
    update: {},
    create: {
      name: "Construcciones Demo S.A.",
      slug: "construcciones-demo",
      plan: "free",
      status: "ACTIVE",
      country: "CO",
    },
  });

  // BusinessUnit: Alquiler de implementos
  const rentalBU = await prisma.businessUnit.upsert({
    where: { tenantId_slug: { tenantId: demoTenant.id, slug: "alquiler" } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: "División Alquiler de Implementos",
      slug: "alquiler",
      description:
        "Unidad especializada en inventario, alquiler, evaluación de costos, mantenimiento y seguimiento de implementos para construcción",
      settings: JSON.stringify({
        enableRental: true,
        enableMaintenance: true,
        enableCostTracking: true,
        autoMaintenanceAlerts: true,
        rentalPeriods: ["daily", "weekly", "monthly"],
      }),
    },
  });

  // Usuario admin demo
  const bcrypt = require("bcrypt");
  const adminPassword = await bcrypt.hash("Admin123!", 10);

  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: "admin@construcciones-demo.com",
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: "admin@construcciones-demo.com",
      password: adminPassword,
      firstName: "Carlos",
      lastName: "Administrador",
      status: "ACTIVE",
    },
  });

  // Usuario gerente demo
  const managerPassword = await bcrypt.hash("Manager123!", 10);
  const managerUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: "gerente@construcciones-demo.com",
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: "gerente@construcciones-demo.com",
      password: managerPassword,
      firstName: "María",
      lastName: "Gerente",
      status: "ACTIVE",
    },
  });

  // Usuario operario demo
  const operatorPassword = await bcrypt.hash("Operario123!", 10);
  const operatorUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: "operario@construcciones-demo.com",
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: "operario@construcciones-demo.com",
      password: operatorPassword,
      firstName: "Juan",
      lastName: "Operario",
      status: "ACTIVE",
    },
  });

  // Asignar usuarios a BusinessUnit con roles
  await prisma.userBusinessUnit.upsert({
    where: {
      userId_businessUnitId: {
        userId: adminUser.id,
        businessUnitId: rentalBU.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      businessUnitId: rentalBU.id,
      roleId: roles.find((r) => r.name === "admin")!.id,
    },
  });

  await prisma.userBusinessUnit.upsert({
    where: {
      userId_businessUnitId: {
        userId: managerUser.id,
        businessUnitId: rentalBU.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      businessUnitId: rentalBU.id,
      roleId: roles.find((r) => r.name === "manager")!.id,
    },
  });

  await prisma.userBusinessUnit.upsert({
    where: {
      userId_businessUnitId: {
        userId: operatorUser.id,
        businessUnitId: rentalBU.id,
      },
    },
    update: {},
    create: {
      userId: operatorUser.id,
      businessUnitId: rentalBU.id,
      roleId: roles.find((r) => r.name === "operator")!.id,
    },
  });

  // Habilitar módulos para el BusinessUnit
  const rentalModules = [
    "machinery-rental",
    "inventory",
    "maintenance",
    "field-reports",
  ];
  for (const moduleName of rentalModules) {
    const module = modules.find((m) => m.name === moduleName);
    if (module) {
      await prisma.businessUnitModule.upsert({
        where: {
          businessUnitId_moduleId: {
            businessUnitId: rentalBU.id,
            moduleId: module.id,
          },
        },
        update: {},
        create: {
          businessUnitId: rentalBU.id,
          moduleId: module.id,
          isEnabled: true,
          config: JSON.stringify({
            features: ["rental", "tracking", "maintenance", "cost-analysis"],
          }),
        },
      });
    }
  }

  console.log("✅ Datos de prueba creados:");
  console.log(`   - Tenant: ${demoTenant.name} (${demoTenant.slug})`);
  console.log(
    `   - Business Unit: ${rentalBU.name} con ${rentalModules.length} módulos`,
  );
  console.log(`   - Admin: admin@construcciones-demo.com / Admin123!`);
  console.log(`   - Manager: gerente@construcciones-demo.com / Manager123!`);
  console.log(`   - Operario: operario@construcciones-demo.com / Operario123!`);
  console.log("");

  // ============================================
  // 8. EQUIPOS DE CONSTRUCCIÓN DISPONIBLES
  // ============================================
  console.log("🚜 Creando inventario de equipos...");

  const equipmentData = [
    {
      code: "EXC-CAT-320",
      name: "Excavadora Caterpillar 320",
      category: "Maquinaria pesada",
      description:
        "Excavadora hidráulica de 20 toneladas, ideal para excavaciones profundas y movimiento de tierras",
      specifications: {
        brand: "Caterpillar",
        model: "320 GC",
        year: 2021,
        power: "121 HP",
        weight: "20,000 kg",
        capacity: "1.2 m³",
      },
      dailyRate: 800000,
      weeklyRate: 4800000,
      monthlyRate: 16000000,
      status: "AVAILABLE",
      condition: "EXCELLENT",
    },
    {
      code: "GRU-LIE-110",
      name: "Grúa Torre Liebherr 110 EC-B",
      category: "Maquinaria pesada",
      description:
        "Grúa torre con alcance de 60m, capacidad de carga 6 toneladas",
      specifications: {
        brand: "Liebherr",
        model: "110 EC-B",
        year: 2020,
        maxLoad: "6,000 kg",
        reach: "60 m",
        height: "45 m",
      },
      dailyRate: 1500000,
      weeklyRate: 9000000,
      monthlyRate: 30000000,
      status: "RENTED",
      condition: "GOOD",
    },
    {
      code: "AND-MOD-100",
      name: "Andamio Modular 100m²",
      category: "Acceso y soporte",
      description:
        "Sistema de andamio modular certificado para trabajo en altura hasta 20m",
      specifications: {
        brand: "Layher",
        type: "Modular",
        area: "100 m²",
        maxHeight: "20 m",
        loadCapacity: "200 kg/m²",
      },
      dailyRate: 150000,
      weeklyRate: 750000,
      monthlyRate: 2400000,
      status: "AVAILABLE",
      condition: "GOOD",
    },
    {
      code: "MEZ-CON-1M3",
      name: "Mezcladora de Concreto 1m³",
      category: "Equipos de concreto",
      description: "Mezcladora de tambor basculante, motor eléctrico 220V",
      specifications: {
        brand: "Carmix",
        capacity: "1 m³",
        motor: "5.5 HP eléctrico",
        voltage: "220V",
        rpm: "28",
      },
      dailyRate: 80000,
      weeklyRate: 400000,
      monthlyRate: 1200000,
      status: "MAINTENANCE",
      condition: "FAIR",
    },
    {
      code: "COM-ATO-185",
      name: "Compresor de Aire Atlas Copco 185 CFM",
      category: "Herramientas neumáticas",
      description:
        "Compresor portátil diesel para herramientas neumáticas y martillos",
      specifications: {
        brand: "Atlas Copco",
        model: "XAS 185",
        pressure: "7 bar",
        flow: "185 CFM",
        fuel: "Diesel",
      },
      dailyRate: 200000,
      weeklyRate: 1000000,
      monthlyRate: 3200000,
      status: "AVAILABLE",
      condition: "EXCELLENT",
    },
    {
      code: "MON-JLG-12M",
      name: "Plataforma Elevadora JLG 12m",
      category: "Acceso y soporte",
      description: "Plataforma autopropulsada eléctrica, altura de trabajo 12m",
      specifications: {
        brand: "JLG",
        model: "1230ES",
        workHeight: "12 m",
        platformHeight: "10 m",
        capacity: "227 kg",
        power: "Eléctrico",
      },
      dailyRate: 250000,
      weeklyRate: 1250000,
      monthlyRate: 4000000,
      status: "AVAILABLE",
      condition: "EXCELLENT",
    },
    {
      code: "VIB-WCK-80",
      name: "Placa Vibratoria Wacker 80kg",
      category: "Compactación",
      description:
        "Compactador de suelos reversible para zanjas y áreas reducidas",
      specifications: {
        brand: "Wacker Neuson",
        model: "DPU 80",
        weight: "80 kg",
        force: "16 kN",
        engine: "Honda GX160",
      },
      dailyRate: 60000,
      weeklyRate: 300000,
      monthlyRate: 900000,
      status: "AVAILABLE",
      condition: "GOOD",
    },
    {
      code: "GEN-CAT-150",
      name: "Generador Caterpillar 150 kVA",
      category: "Energía",
      description: "Planta eléctrica diesel insonorizada para obra",
      specifications: {
        brand: "Caterpillar",
        model: "DE150E0",
        power: "150 kVA",
        voltage: "220/440V",
        fuel: "Diesel",
        tank: "400 L",
      },
      dailyRate: 350000,
      weeklyRate: 1750000,
      monthlyRate: 5600000,
      status: "AVAILABLE",
      condition: "EXCELLENT",
    },
    {
      code: "TAL-HIL-SDS",
      name: "Taladro Percutor Hilti TE 70",
      category: "Herramientas eléctricas",
      description:
        "Martillo perforador/demoledor SDS-MAX para concreto y mampostería",
      specifications: {
        brand: "Hilti",
        model: "TE 70-ATC/AVR",
        power: "1700 W",
        impact: "9.2 J",
        maxDrill: "70 mm",
      },
      dailyRate: 45000,
      weeklyRate: 225000,
      monthlyRate: 675000,
      status: "AVAILABLE",
      condition: "EXCELLENT",
    },
    {
      code: "CAR-BOB-S70",
      name: "Minicargador Bobcat S70",
      category: "Maquinaria compacta",
      description:
        "Minicargador compacto para espacios reducidos, con accesorios intercambiables",
      specifications: {
        brand: "Bobcat",
        model: "S70",
        capacity: "454 kg",
        power: "23.5 HP",
        width: "0.91 m",
      },
      dailyRate: 300000,
      weeklyRate: 1500000,
      monthlyRate: 4800000,
      status: "AVAILABLE",
      condition: "GOOD",
    },
    {
      code: "BOM-CON-60M3",
      name: "Bomba de Concreto 60 m³/h",
      category: "Equipos de concreto",
      description: "Bomba estacionaria para bombeo de concreto premezclado",
      specifications: {
        brand: "Putzmeister",
        model: "BSA 1409 D",
        output: "60 m³/h",
        pressure: "85 bar",
        power: "Diesel",
      },
      dailyRate: 600000,
      weeklyRate: 3000000,
      monthlyRate: 9600000,
      status: "RENTED",
      condition: "EXCELLENT",
    },
    {
      code: "NIV-TOP-ROT",
      name: "Nivel Láser Rotativo Topcon",
      category: "Topografía",
      description:
        "Nivel láser autonivelante con alcance 300m para nivelación y alineación",
      specifications: {
        brand: "Topcon",
        model: "RL-H5A",
        range: "300 m",
        accuracy: "±1.5 mm/10 m",
        laserClass: "Clase 2",
      },
      dailyRate: 35000,
      weeklyRate: 175000,
      monthlyRate: 525000,
      status: "AVAILABLE",
      condition: "EXCELLENT",
    },
  ];

  const createdEquipment = [];
  for (const eq of equipmentData) {
    const equipment = await prisma.equipment.upsert({
      where: {
        tenantId_code: {
          tenantId: demoTenant.id,
          code: eq.code,
        },
      },
      update: {
        name: eq.name,
        category: eq.category,
        description: eq.description,
        specifications: eq.specifications,
        dailyRate: eq.dailyRate,
        weeklyRate: eq.weeklyRate,
        monthlyRate: eq.monthlyRate,
        status: eq.status as any,
        condition: eq.condition as any,
      },
      create: {
        tenantId: demoTenant.id,
        businessUnitId: rentalBU.id,
        code: eq.code,
        name: eq.name,
        category: eq.category,
        description: eq.description,
        specifications: eq.specifications,
        dailyRate: eq.dailyRate,
        weeklyRate: eq.weeklyRate,
        monthlyRate: eq.monthlyRate,
        status: eq.status as any,
        condition: eq.condition as any,
      },
    });
    createdEquipment.push(eq.code);
  }

  console.log(`✅ ${createdEquipment.length} equipos de construcción creados`);
  console.log("");

  // ============================================
  console.log("🎉 SEED COMPLETADO EXITOSAMENTE\n");
  console.log(`📊 Resumen:`);
  console.log(`   - ${roles.length} roles creados`);
  console.log(`   - ${modules.length} módulos disponibles`);
  console.log(`   - ${permissions.length} permisos granulares`);
  console.log(`   - ${totalRolePerms} asignaciones rol-permiso`);
  console.log(`   - ${intents.length} intenciones base`);
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
