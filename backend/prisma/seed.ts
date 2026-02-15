/**
 * SEED DE DATOS BASE DEL SISTEMA - VERSIÓN MINIMALISTA
 *
 * Este seed crea:
 * 1. Roles base del sistema (OWNER, ADMIN, MANAGER, EMPLOYEE, VIEWER)
 * 2. Tenant de prueba (Construcciones Demo S.A.)
 * 3. Business Unit de prueba (División Alquiler)
 * 4. Usuario OWNER de prueba (admin@construcciones-demo.com / Admin123!)
 *
 * Ejecutar con: npx prisma db seed
 *
 * NOTA: Los módulos ahora se manejan en frontend (vertical/core architecture).
 * No se registran en base de datos hasta que implementemos suscripciones.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed minimalista...\n");

  // ============================================
  // 1. ROLES BASE DEL SISTEMA
  // ============================================
  console.log("📝 Creando roles base...");

  const roles = [
    {
      id: "role-owner",
      name: "OWNER",
      description: "Propietario de la plataforma con acceso total",
      isSystem: true,
    },
    {
      id: "role-admin",
      name: "ADMIN",
      description: "Administrador con acceso completo al tenant",
      isSystem: true,
    },
    {
      id: "role-manager",
      name: "MANAGER",
      description: "Gerente con permisos de gestión operativa",
      isSystem: true,
    },
    {
      id: "role-employee",
      name: "EMPLOYEE",
      description: "Empleado estándar con acceso a funcionalidades básicas",
      isSystem: true,
    },
    {
      id: "role-viewer",
      name: "VIEWER",
      description: "Observador con acceso de solo lectura",
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }

  console.log(`✅ ${roles.length} roles creados\n`);

  // ============================================
  // 2. TENANT DE PRUEBA
  // ============================================
  console.log("🏢 Creando tenant de prueba...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "construcciones-demo" },
    update: {},
    create: {
      id: "tenant-demo-001",
      name: "Construcciones Demo S.A.",
      slug: "construcciones-demo",
      plan: "free",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Tenant creado: ${tenant.name}\n`);

  // ============================================
  // 3. BUSINESS UNIT DE PRUEBA
  // ============================================
  console.log("🏗️  Creando Business Unit de prueba...");

  const businessUnit = await prisma.businessUnit.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "alquiler" } },
    update: {},
    create: {
      id: "bu-demo-001",
      name: "División Alquiler de Implementos",
      slug: "alquiler",
      description: "División de alquiler de maquinaria y equipos",
      tenantId: tenant.id,
      settings: JSON.stringify({
        timezone: "America/Bogota",
        currency: "COP",
      }),
    },
  });

  console.log(`✅ Business Unit creado: ${businessUnit.name}\n`);

  // ============================================
  // 4. PLATFORM OWNER (SUPER_ADMIN)
  // ============================================
  console.log("👑 Creando PLATFORM OWNER (SUPER_ADMIN)...");

  const platformOwnerPassword = await bcrypt.hash("PlatformOwner123!", 10);

  const platformOwner = await prisma.user.upsert({
    where: { email: "owner@divancosaas.com" },
    update: {},
    create: {
      id: "user-platform-owner",
      email: "owner@divancosaas.com",
      password: platformOwnerPassword,
      firstName: "Platform",
      lastName: "Owner",
      status: "ACTIVE",
      role: "SUPER_ADMIN", // ← Global role, cross-tenant access
      // tenantId: null (no tenant for platform owner)
    },
  });

  console.log(`✅ Platform Owner creado: ${platformOwner.email}`);
  console.log(`   Rol: SUPER_ADMIN (sin tenant)\n`);

  // ============================================
  // 5. TENANT ADMIN
  // ============================================
  console.log("👤 Creando Tenant Admin...");

  const tenantAdminPassword = await bcrypt.hash("Admin123!", 10);

  const tenantAdmin = await prisma.user.upsert({
    where: { email: "admin@construcciones-demo.com" },
    update: {},
    create: {
      id: "user-tenant-admin",
      email: "admin@construcciones-demo.com",
      password: tenantAdminPassword,
      firstName: "Carlos",
      lastName: "Administrador",
      status: "ACTIVE",
      role: "USER", // ← Global role, tenant-scoped
      tenant: {
        connect: { id: tenant.id },
      },
    },
  });

  console.log(`✅ Tenant Admin creado: ${tenantAdmin.email}\n`);

  // ============================================
  // 6. ASIGNAR TENANT ADMIN AL BUSINESS UNIT
  // ============================================
  console.log("🔗 Asignando Tenant Admin a Business Unit...");

  const ownerRole = await prisma.role.findUnique({
    where: { id: "role-owner" },
  });

  if (ownerRole) {
    await prisma.userBusinessUnit.upsert({
      where: {
        userId_businessUnitId: {
          userId: tenantAdmin.id,
          businessUnitId: businessUnit.id,
        },
      },
      update: {},
      create: {
        userId: tenantAdmin.id,
        businessUnitId: businessUnit.id,
        roleId: ownerRole.id,
      },
    });

    console.log(`✅ Tenant Admin asignado como OWNER del Business Unit\n`);
  }

  // ============================================
  // RESUMEN
  // ============================================
  console.log("=".repeat(50));
  console.log("✨ Seed completado exitosamente!");
  console.log("=".repeat(50));
  console.log("\n🎭 USUARIOS CREADOS:\n");
  console.log("1️⃣  PLATFORM OWNER (gestiona suscripciones y módulos)");
  console.log(`   Email: ${platformOwner.email}`);
  console.log(`   Password: PlatformOwner123!`);
  console.log(`   Rol: SUPER_ADMIN (sin tenant)`);
  console.log("");
  console.log("2️⃣  TENANT ADMIN (gestiona su empresa)");
  console.log(`   Email: ${tenantAdmin.email}`);
  console.log(`   Password: Admin123!`);
  console.log(`   Rol: USER + OWNER en BU`);
  console.log(`   Tenant: ${tenant.name}`);
  console.log(`   Business Unit: ${businessUnit.name}`);
  console.log("=".repeat(50));
  console.log("\n📝 Próximos pasos:");
  console.log("1. Login como Platform Owner para gestionar módulos");
  console.log("2. Ir a /admin/modules para asignar módulos a tenants/BUs");
  console.log("3. Login como Tenant Admin para usar módulos asignados");
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
