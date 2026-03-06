/// <reference types="node" />
import prisma from "./src/config/database";

async function assignAllPermissionsToOwner() {
  try {
    console.log("🔧 Asignando TODOS los permisos al rol OWNER...\n");

    // Obtener el rol OWNER
    const ownerRole = await prisma.role.findUnique({
      where: { id: "role-owner" },
    });

    if (!ownerRole) {
      console.log("❌ Rol OWNER no encontrado");
      return;
    }

    // Obtener todos los permisos del sistema
    const allPermissions = await prisma.permission.findMany();
    console.log(`📊 Total de permisos en el sistema: ${allPermissions.length}`);

    // Obtener permisos actuales del OWNER
    const currentOwnerPermissions = await prisma.rolePermission.findMany({
      where: { roleId: ownerRole.id },
    });
    console.log(
      `📋 Permisos actuales del OWNER: ${currentOwnerPermissions.length}\n`,
    );

    const currentPermissionIds = new Set(
      currentOwnerPermissions.map((rp) => rp.permissionId),
    );

    // Encontrar permisos faltantes
    const missingPermissions = allPermissions.filter(
      (p) => !currentPermissionIds.has(p.id),
    );

    if (missingPermissions.length === 0) {
      console.log("✅ El OWNER ya tiene TODOS los permisos del sistema");
      return;
    }

    console.log(
      `➕ Agregando ${missingPermissions.length} permisos faltantes...\n`,
    );

    // Asignar permisos faltantes
    let count = 0;
    for (const permission of missingPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      });
      count++;
      console.log(`   ✓ ${count}. ${permission.resource}:${permission.action}`);
    }

    console.log(
      `\n✅ ¡Completado! El OWNER ahora tiene ${allPermissions.length} permisos`,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

assignAllPermissionsToOwner();
