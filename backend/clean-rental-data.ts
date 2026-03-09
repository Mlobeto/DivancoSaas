/**
 * CLEAN RENTAL DATA SCRIPT
 * Elimina todas las cotizaciones, contratos, addendums y movimientos de cuenta
 * para poder hacer pruebas limpias con el flujo correcto de master contracts
 */

import prisma from "./src/config/database";

async function cleanRentalData() {
  console.log("🧹 Iniciando limpieza de datos de alquiler...\n");

  try {
    // 1. Eliminar movimientos de cuenta (dependen de AssetRental y Contracts)
    console.log("📋 Eliminando movimientos de cuenta...");
    const deletedMovements = await prisma.rentalAccountMovement.deleteMany({});
    console.log(`   ✅ ${deletedMovements.count} movimientos eliminados\n`);

    // 2. Eliminar asset rentals (dependen de Contracts y Addendums)
    console.log("🚜 Eliminando asset rentals...");
    const deletedRentals = await prisma.assetRental.deleteMany({});
    console.log(`   ✅ ${deletedRentals.count} asset rentals eliminados\n`);

    // 3. Eliminar addendums (dependen de Contracts)
    console.log("📄 Eliminando addendums de contratos...");
    const deletedAddendums = await prisma.contractAddendum.deleteMany({});
    console.log(`   ✅ ${deletedAddendums.count} addendums eliminados\n`);

    // 4. Eliminar contratos
    console.log("📑 Eliminando contratos de alquiler...");
    const deletedContracts = await prisma.rentalContract.deleteMany({});
    console.log(`   ✅ ${deletedContracts.count} contratos eliminados\n`);

    // 5. Eliminar quotation-contract links
    console.log("🔗 Eliminando links cotización-contrato...");
    const deletedQuotationContracts = await prisma.quotationContract.deleteMany(
      {},
    );
    console.log(`   ✅ ${deletedQuotationContracts.count} links eliminados\n`);

    // 6. Eliminar items de cotizaciones
    console.log("📦 Eliminando items de cotizaciones...");
    const deletedQuotationItems = await prisma.quotationItem.deleteMany({});
    console.log(`   ✅ ${deletedQuotationItems.count} items eliminados\n`);

    // 7. Eliminar cotizaciones
    console.log("💰 Eliminando cotizaciones...");
    const deletedQuotations = await prisma.quotation.deleteMany({});
    console.log(`   ✅ ${deletedQuotations.count} cotizaciones eliminadas\n`);

    // 8. Resetear balances de cuentas a 0 (opcional, mantiene las cuentas pero limpia saldos)
    console.log("💳 Reseteando balances de cuentas...");
    const updatedAccounts = await prisma.clientAccount.updateMany({
      data: {
        balance: 0,
        totalConsumed: 0,
        // No reseteamos totalReloaded para mantener historial de recargas manuales
        activeDays: 0,
        alertTriggered: false,
        lastAlertSent: null,
      },
    });
    console.log(`   ✅ ${updatedAccounts.count} cuentas reseteadas\n`);

    console.log("✨ Limpieza completada exitosamente!");
    console.log("\nResumen:");
    console.log(`  - ${deletedMovements.count} movimientos eliminados`);
    console.log(`  - ${deletedRentals.count} asset rentals eliminados`);
    console.log(`  - ${deletedAddendums.count} addendums eliminados`);
    console.log(`  - ${deletedContracts.count} contratos eliminados`);
    console.log(
      `  - ${deletedQuotationContracts.count} quotation-contracts eliminados`,
    );
    console.log(
      `  - ${deletedQuotationItems.count} quotation items eliminados`,
    );
    console.log(`  - ${deletedQuotations.count} cotizaciones eliminadas`);
    console.log(`  - ${updatedAccounts.count} cuentas reseteadas`);
    console.log("\n🚀 Puedes empezar con el flujo limpio!");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
cleanRentalData()
  .then(() => {
    console.log("\n✅ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script falló:", error);
    process.exit(1);
  });
