import { PrismaClient } from "@prisma/client";
import { permissionService } from "./src/core/services/permission.service";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * Demo completa de permisos adicionales de usuarios
 *
 * Crea un usuario EMPLOYEE y le asigna permisos adicionales de ADMIN
 */

async function main() {
  console.log("\n🎯 Demo: Permisos Adicionales de Usuario\n");
  console.log(
    "Escenario: Un EMPLOYEE necesita permisos de ADMIN temporalmente\n",
  );
  console.log("=".repeat(60));

  // 1. Obtener tenant y BU de prueba
  const tenant = await prisma.tenant.findFirst({
    include: {
      businessUnits: true,
    },
  });

  if (!tenant || tenant.businessUnits.length === 0) {
    console.log("⚠️  No hay tenants con Business Units");
    return;
  }

  const businessUnit = tenant.businessUnits[0];

  // 2. Obtener roles EMPLOYEE y ADMIN
  const employeeRole = await prisma.role.findFirst({
    where: { name: "EMPLOYEE" },
  });

  if (!employeeRole) {
    console.log("⚠️  Rol EMPLOYEE no encontrado");
    return;
  }

  // 3. Crear usuario de prueba EMPLOYEE
  console.log("\n📝 Paso 1: Creando usuario EMPLOYEE...\n");

  const hashedPassword = await bcrypt.hash("Test123!", 10);

  const employee = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "demo-employee@test.com",
      },
    },
    update: {},
    create: {
      email: "demo-employee@test.com",
      password: hashedPassword,
      firstName: "Juan",
      lastName: "Empleado",
      tenantId: tenant.id,
      status: "ACTIVE",
      businessUnits: {
        create: {
          businessUnitId: businessUnit.id,
          roleId: employeeRole.id,
        },
      },
    },
  });

  console.log(`✅ Usuario creado: ${employee.email}`);
  console.log(`   Rol: EMPLOYEE`);
  console.log(`   Business Unit: ${businessUnit.name}\n`);

  // 4. Ver permisos del rol EMPLOYEE
  console.log("📋 Paso 2: Permisos del rol EMPLOYEE\n");
  const employeePermissions = await permissionService.getUserPermissions(
    employee.id,
    businessUnit.id,
  );

  console.log(`   Total: ${employeePermissions.length} permisos`);
  employeePermissions.forEach((perm) => {
    console.log(`   ✓ ${perm}`);
  });

  const hasUsersCreate = employeePermissions.includes("users:create");
  const hasUsersDelete = employeePermissions.includes("users:delete");
  const hasSettingsUpdate = employeePermissions.includes("settings:update");

  console.log("\n   Puede crear usuarios: " + (hasUsersCreate ? "✅" : "❌"));
  console.log("   Puede eliminar usuarios: " + (hasUsersDelete ? "✅" : "❌"));
  console.log(
    "   Puede modificar settings: " + (hasSettingsUpdate ? "✅" : "❌"),
  );

  // 5. Asignar permisos adicionales de ADMIN
  console.log("\n\n➕ Paso 3: Asignando permisos adicionales de ADMIN...\n");

  const adminPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: "users", action: "create" },
        { resource: "users", action: "delete" },
        { resource: "settings", action: "update" },
        { resource: "business-units", action: "update" },
      ],
    },
  });

  // Filtrar solo los que el empleado NO tiene
  const permissionsToGrant = adminPermissions.filter((perm) => {
    const permKey = `${perm.resource}:${perm.action}`;
    return !employeePermissions.includes(permKey);
  });

  if (permissionsToGrant.length === 0) {
    console.log("   ℹ️  El EMPLOYEE ya tiene todos estos permisos\n");
    console.log("   Buscando otros permisos de ADMIN...\n");

    // Buscar permisos que definitivamente no tiene
    const otherAdminPerms = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: "roles", action: "read" },
          { resource: "business-units", action: "create" },
        ],
      },
    });

    permissionsToGrant.push(
      ...otherAdminPerms.filter((perm) => {
        const permKey = `${perm.resource}:${perm.action}`;
        return !employeePermissions.includes(permKey);
      }),
    );
  }

  console.log("   Permisos a agregar:");
  permissionsToGrant.forEach((perm) => {
    console.log(`   + ${perm.resource}:${perm.action}`);
  });

  for (const perm of permissionsToGrant) {
    await permissionService.grantUserPermission(
      employee.id,
      businessUnit.id,
      perm.id,
      "system-demo",
    );
  }

  console.log("\n✅ Permisos adicionales asignados\n");

  // 6. Verificar permisos totales
  console.log("📊 Paso 4: Permisos totales (EMPLOYEE + adicionales)\n");
  const totalPermissions = await permissionService.getUserPermissions(
    employee.id,
    businessUnit.id,
  );

  console.log(`   Total: ${totalPermissions.length} permisos\n`);
  console.log("   Permisos del rol EMPLOYEE:");
  employeePermissions.forEach((perm) => {
    console.log(`   ✓ ${perm}`);
  });

  console.log("\n   Permisos adicionales (solo del usuario):");
  const additionalOnly = await permissionService.getUserAdditionalPermissions(
    employee.id,
    businessUnit.id,
  );
  additionalOnly.forEach((perm) => {
    console.log(`   🆕 ${perm.resource}:${perm.action}`);
  });

  const nowHasUsersCreate = totalPermissions.includes("users:create");
  const nowHasUsersDelete = totalPermissions.includes("users:delete");
  const nowHasSettingsUpdate = totalPermissions.includes("settings:update");

  console.log(
    "\n   Ahora puede crear usuarios: " + (nowHasUsersCreate ? "✅" : "❌"),
  );
  console.log(
    "   Ahora puede eliminar usuarios: " + (nowHasUsersDelete ? "✅" : "❌"),
  );
  console.log(
    "   Ahora puede modificar settings: " +
      (nowHasSettingsUpdate ? "✅" : "❌"),
  );

  // 7. Probar revocar permiso
  if (adminPermissions.length > 0) {
    console.log("\n\n➖ Paso 5: Revocando un permiso adicional...\n");
    const permToRevoke = adminPermissions[0];
    console.log(
      `   Revocando: ${permToRevoke.resource}:${permToRevoke.action}`,
    );

    await permissionService.revokeUserPermission(
      employee.id,
      businessUnit.id,
      permToRevoke.id,
    );

    console.log("✅ Permiso revocado\n");

    const finalPermissions = await permissionService.getUserPermissions(
      employee.id,
      businessUnit.id,
    );
    console.log(`   Permisos finales: ${finalPermissions.length}\n`);
  }

  console.log("=".repeat(60));
  console.log("✨ Demo completada exitosamente!");
  console.log("=".repeat(60));
  console.log("\n💡 Casos de uso:");
  console.log("   1. Delegar tareas administrativas temporalmente a empleados");
  console.log("   2. Especialistas que necesitan permisos específicos");
  console.log("   3. Ascensos temporales o pruebas de nuevos roles");
  console.log("   4. Permisos de emergencia sin cambiar el rol\n");

  console.log("📚 API Endpoints:");
  console.log("   GET    /api/v1/users/:id/permissions");
  console.log("   POST   /api/v1/users/:id/permissions");
  console.log("   DELETE /api/v1/users/:id/permissions/:permissionId\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
