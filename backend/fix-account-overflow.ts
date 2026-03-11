/**
 * SCRIPT DE DIAGNÓSTICO Y CORRECCIÓN
 * Verifica y repara cuentas con valores que exceden límites de Decimal(15,2)
 */

import prisma from "./src/config/database";
import { Decimal } from "@prisma/client/runtime/library";

const MAX_DECIMAL_VALUE = 9999999999999.99;
const ACCOUNT_ID = "6005f91b-6d96-484d-b453-fa8bb598b881"; // ID de la cuenta con problema

async function diagnoseAccount() {
  console.log("\n🔍 Diagnóstico de Cuenta\n");
  console.log("=".repeat(60));

  const account = await prisma.clientAccount.findUnique({
    where: { id: ACCOUNT_ID },
    include: {
      client: true,
    },
  });

  if (!account) {
    console.log("❌ Cuenta no encontrada");
    return null;
  }

  console.log(`\n📋 Cliente: ${account.client.name}`);
  console.log(`📊 Balance actual: ${account.balance.toString()}`);
  console.log(`💰 Total recargado: ${account.totalReloaded.toString()}`);
  console.log(`📉 Total consumido: ${account.totalConsumed.toString()}`);

  // Verificar límites
  const balance = Number(account.balance);
  const totalReloaded = Number(account.totalReloaded);
  const totalConsumed = Number(account.totalConsumed);

  console.log("\n⚠️  Verificación de límites:");
  console.log(`   Límite máximo: ${MAX_DECIMAL_VALUE.toLocaleString()}`);
  console.log(
    `   Balance: ${balance.toLocaleString()} ${balance > MAX_DECIMAL_VALUE ? "❌ EXCEDE" : "✅ OK"}`,
  );
  console.log(
    `   Total recargado: ${totalReloaded.toLocaleString()} ${totalReloaded > MAX_DECIMAL_VALUE ? "❌ EXCEDE" : "✅ OK"}`,
  );
  console.log(
    `   Total consumido: ${totalConsumed.toLocaleString()} ${totalConsumed > MAX_DECIMAL_VALUE ? "❌ EXCEDE" : "✅ OK"}`,
  );

  // Calcular valores correctos desde movimientos
  console.log("\n🧮 Recalculando desde movimientos...");

  const movements = await prisma.rentalAccountMovement.findMany({
    where: { clientAccountId: ACCOUNT_ID },
    orderBy: { createdAt: "asc" },
  });

  let calculatedBalance = 0;
  let calculatedReloaded = 0;
  let calculatedConsumed = 0;

  for (const mov of movements) {
    const amount = Number(mov.amount);
    calculatedBalance += amount;

    if (amount > 0) {
      calculatedReloaded += amount;
    } else {
      calculatedConsumed += Math.abs(amount);
    }
  }

  console.log(`   Total movimientos: ${movements.length}`);
  console.log(`   Balance calculado: ${calculatedBalance.toLocaleString()}`);
  console.log(`   Recargas calculadas: ${calculatedReloaded.toLocaleString()}`);
  console.log(`   Consumos calculados: ${calculatedConsumed.toLocaleString()}`);

  // Comparar
  console.log("\n📊 Comparación:");
  const balanceDiff = Math.abs(balance - calculatedBalance);
  const reloadedDiff = Math.abs(totalReloaded - calculatedReloaded);
  const consumedDiff = Math.abs(totalConsumed - calculatedConsumed);

  console.log(
    `   Balance: ${balanceDiff > 0.01 ? `❌ Diferencia: ${balanceDiff.toLocaleString()}` : "✅ Correcto"}`,
  );
  console.log(
    `   Recargado: ${reloadedDiff > 0.01 ? `❌ Diferencia: ${reloadedDiff.toLocaleString()}` : "✅ Correcto"}`,
  );
  console.log(
    `   Consumido: ${consumedDiff > 0.01 ? `❌ Diferencia: ${consumedDiff.toLocaleString()}` : "✅ Correcto"}`,
  );

  return {
    account,
    current: { balance, totalReloaded, totalConsumed },
    calculated: {
      balance: calculatedBalance,
      totalReloaded: calculatedReloaded,
      totalConsumed: calculatedConsumed,
    },
    needsFix: balanceDiff > 0.01 || reloadedDiff > 0.01 || consumedDiff > 0.01,
  };
}

async function fixAccount() {
  const diagnosis = await diagnoseAccount();

  if (!diagnosis) {
    console.log("\n❌ No se puede corregir: cuenta no encontrada");
    return;
  }

  if (!diagnosis.needsFix) {
    console.log("\n✅ La cuenta está correcta, no requiere corrección");
    return;
  }

  console.log("\n🔧 Aplicando correcciones...");

  const { calculated } = diagnosis;

  // Validar que los valores calculados estén dentro del límite
  if (
    calculated.balance > MAX_DECIMAL_VALUE ||
    calculated.totalReloaded > MAX_DECIMAL_VALUE ||
    calculated.totalConsumed > MAX_DECIMAL_VALUE
  ) {
    console.log(
      "\n❌ ERROR: Los valores calculados aún exceden el límite máximo",
    );
    console.log(
      "   Esto indica que hay un problema más profundo con los datos.",
    );
    return;
  }

  const updated = await prisma.clientAccount.update({
    where: { id: ACCOUNT_ID },
    data: {
      balance: new Decimal(calculated.balance),
      totalReloaded: new Decimal(calculated.totalReloaded),
      totalConsumed: new Decimal(calculated.totalConsumed),
    },
  });

  console.log("\n✅ Cuenta corregida exitosamente");
  console.log(`   Nuevo balance: ${updated.balance.toString()}`);
  console.log(`   Nuevo total recargado: ${updated.totalReloaded.toString()}`);
  console.log(`   Nuevo total consumido: ${updated.totalConsumed.toString()}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "diagnose";

  try {
    if (command === "diagnose") {
      await diagnoseAccount();
    } else if (command === "fix") {
      await fixAccount();
    } else {
      console.log("\n❌ Comando desconocido");
      console.log("\nUso:");
      console.log("  npx ts-node fix-account-overflow.ts diagnose");
      console.log("  npx ts-node fix-account-overflow.ts fix");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
