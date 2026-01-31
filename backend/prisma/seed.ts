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
        description: "Administrador con acceso completo a todas las funcionalidades",
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
        description: "Operario de campo con acceso limitado (ideal para mobile)",
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
        description: "Gestión de alquiler de maquinarias y equipos para construcción",
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
        description: "Programación y seguimiento de mantenimientos preventivos y correctivos",
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
        description: "Gestión de proyectos arquitectónicos, planos y seguimiento",
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
        description: "Gestión de relaciones con clientes, leads y oportunidades",
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
      where: { resource_action: { resource: "maintenance", action: "schedule" } },
      update: {},
      create: {
        resource: "maintenance",
        action: "schedule",
        description: "Programar mantenimientos",
        scope: PermissionScope.BUSINESS_UNIT,
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: "maintenance", action: "complete" } },
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
      where: { resource_action: { resource: "field-report", action: "create" } },
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
      where: { resource_action: { resource: "field-report", action: "approve" } },
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
    permissionPatterns: { resource: string; action: string }[]
  ) => {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return [];

    const rolePermissions = [];
    for (const pattern of permissionPatterns) {
      const permission = permissions.find(
        (p) => p.resource === pattern.resource && p.action === pattern.action
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
  console.log("=" .repeat(50));
  console.log("🎉 SEED COMPLETADO EXITOSAMENTE\n");
  console.log(`📊 Resumen:`);
  console.log(`   - ${roles.length} roles creados`);
  console.log(`   - ${modules.length} módulos disponibles`);
  console.log(`   - ${permissions.length} permisos granulares`);
  console.log(`   - ${totalRolePerms} asignaciones rol-permiso`);
  console.log("=" .repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
