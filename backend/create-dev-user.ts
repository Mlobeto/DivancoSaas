/// <reference types="node" />
import prisma from "./src/config/database";
import * as bcrypt from "bcryptjs";

async function createDevUser() {
  try {
    console.log("👩‍💻 Creando usuario DEVELOPER (SUPER_ADMIN)...\n");

    const email = "dev@divancosaas.com";
    const password = "Dev123!"; // CAMBIAR según preferencia
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si ya existe (usar findFirst porque tenantId puede ser null)
    const existing = await prisma.user.findFirst({
      where: { email },
    });

    if (existing) {
      console.log("⚠️  El usuario ya existe. ¿Quieres resetear la contraseña?");
      console.log(`   Email: ${existing.email}`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Rol: ${existing.role}`);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashedPassword },
      });

      console.log("\n✅ Contraseña actualizada");
      console.log(`   Nueva contraseña: ${password}`);
      return;
    }

    // Crear nuevo usuario
    const devUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: "Developer",
        lastName: "Platform",
        status: "ACTIVE",
        role: "SUPER_ADMIN",
        tenantId: null, // Sin tenant - acceso global
      },
    });

    console.log("✅ Usuario DEVELOPER creado exitosamente\n");
    console.log("📋 Credenciales:");
    console.log(`   Email: ${devUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Rol: ${devUser.role}`);
    console.log(`   Tenant: (ninguno - acceso cross-tenant)`);
    console.log(`   ID: ${devUser.id}`);

    console.log("\n💡 Este usuario tiene:");
    console.log("   ✓ Acceso a todos los tenants");
    console.log("   ✓ Sin restricciones de business unit");
    console.log("   ✓ Acceso administrativo total de la plataforma");
    console.log("   ✓ Ideal para debugging y mantenimiento\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createDevUser();
