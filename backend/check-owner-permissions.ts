/// <reference types="node" />
import prisma from "./src/config/database";

async function checkOwnerPermissions() {
  try {
    console.log("🔍 Verificando permisos del rol OWNER...\n");

    // Total de permisos disponibles en el sistema
    const totalPermissions = await prisma.permission.count();
    console.log(`📊 Total de permisos en el sistema: ${totalPermissions}`);

    // Permisos asignados al rol OWNER
    const ownerRole = await prisma.role.findUnique({
      where: { id: "role-owner" },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!ownerRole) {
      console.log("❌ Rol OWNER no encontrado");
      return;
    }

    console.log(
      `📋 Permisos asignados al OWNER: ${ownerRole.permissions.length}\n`,
    );

    if (ownerRole.permissions.length < totalPermissions) {
      console.log(
        `⚠️  PROBLEMA: El OWNER debería tener TODOS los ${totalPermissions} permisos`,
      );
      console.log(
        `   Actualmente solo tiene ${ownerRole.permissions.length}\n`,
      );

      console.log("📝 Permisos que el OWNER SÍ tiene:");
      ownerRole.permissions.slice(0, 10).forEach((rp) => {
        console.log(`   ✓ ${rp.permission.resource}:${rp.permission.action}`);
      });
      if (ownerRole.permissions.length > 10) {
        console.log(`   ... y ${ownerRole.permissions.length - 10} más\n`);
      }

      // Encontrar permisos faltantes
      const ownerPermissionIds = new Set(
        ownerRole.permissions.map((rp) => rp.permissionId),
      );
      const allPermissions = await prisma.permission.findMany();
      const missingPermissions = allPermissions.filter(
        (p) => !ownerPermissionIds.has(p.id),
      );

      console.log(
        `\n❌ Permisos FALTANTES para OWNER (${missingPermissions.length}):`,
      );
      missingPermissions.forEach((p) => {
        console.log(`   ✗ ${p.resource}:${p.action}`);
      });
    } else {
      console.log("✅ El OWNER tiene TODOS los permisos del sistema");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOwnerPermissions();
