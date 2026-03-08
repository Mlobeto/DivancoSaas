/**
 * MIGRACIÓN: Actualizar Contratos Existentes a Tipo 'specific'
 *
 * Este script actualiza todos los contratos existentes en el sistema
 * para marcarlos como tipo 'specific' (contratos específicos con items detallados).
 *
 * Los nuevos contratos maestros usarán tipo 'master'.
 *
 * IMPORTANTE: Este script es idempotente (puede ejecutarse múltiples veces sin problemas).
 *
 * Ejecutar con: npm run migrate:contracts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando migración de contratos existentes...\n");

  try {
    // Contar contratos que necesitan actualización
    const contractsToUpdate = await prisma.rentalContract.count({
      where: {
        contractType: "master", // Default value del schema que necesitamos cambiar
      },
    });

    if (contractsToUpdate === 0) {
      console.log(
        "✅ No hay contratos para actualizar. Todos ya están clasificados.\n",
      );
      return;
    }

    console.log(`📊 Contratos a actualizar: ${contractsToUpdate}\n`);
    console.log("🔄 Actualizando contratos a tipo 'specific'...\n");

    // Actualizar todos los contratos existentes a tipo 'specific'
    const result = await prisma.rentalContract.updateMany({
      where: {
        contractType: "master",
      },
      data: {
        contractType: "specific",
      },
    });

    console.log(`✅ Contratos actualizados: ${result.count}\n`);

    // Verificar resultado
    const specificCount = await prisma.rentalContract.count({
      where: { contractType: "specific" },
    });

    const masterCount = await prisma.rentalContract.count({
      where: { contractType: "master" },
    });

    console.log("📊 Resumen final:");
    console.log(`   📄 Contratos tipo 'specific': ${specificCount}`);
    console.log(`   📋 Contratos tipo 'master': ${masterCount}`);
    console.log(`\n✨ Migración completada exitosamente!\n`);

    console.log("💡 Próximos pasos:");
    console.log("   1. Los contratos existentes ahora son tipo 'specific'");
    console.log("   2. Los nuevos contratos maestros usarán tipo 'master'");
    console.log(
      "   3. Implementar flujo de creación de contratos maestros con addendums",
    );
  } catch (error) {
    console.error("\n❌ Error durante la migración:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
