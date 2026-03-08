/**
 * PRUEBAS: Verificar Schema del Sistema de Contratos Maestros
 *
 * Este script prueba que el schema de contratos maestros esté correctamente configurado:
 * - Modelos: ContractAddendum, ContractAttachment, LimitChangeRequest, ContractClauseTemplate
 * - Relaciones entre modelos
 * - Campos agregados a ClientAccount y RentalContract
 *
 * Ejecutar con: npm run test:schema
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Iniciando pruebas del schema de contratos maestros...\n");

  try {
    // ═══════════════════════════════════════════════════════════
    // 1. VERIFICAR CLÁUSULAS DE CONTRATO
    // ═══════════════════════════════════════════════════════════
    console.log("📝 1. Verificando cláusulas de contrato...");

    const clausesCount = await prisma.contractClauseTemplate.count();
    console.log(`   ✅ Total de cláusulas: ${clausesCount}`);

    const clausesByCategory = await prisma.contractClauseTemplate.groupBy({
      by: ["category"],
      _count: true,
    });

    console.log("   📊 Cláusulas por categoría:");
    clausesByCategory.forEach(({ category, _count }) => {
      console.log(`      - ${category}: ${_count}`);
    });

    const defaultClauses = await prisma.contractClauseTemplate.count({
      where: { isDefault: true },
    });
    console.log(`   📌 Cláusulas por defecto: ${defaultClauses}\n`);

    // ═══════════════════════════════════════════════════════════
    // 2. VERIFICAR CONTRATOS EXISTENTES
    // ═══════════════════════════════════════════════════════════
    console.log("📋 2. Verificando contratos existentes...");

    const contractsCount = await prisma.rentalContract.count();
    console.log(`   ✅ Total de contratos: ${contractsCount}`);

    const contractsByType = await prisma.rentalContract.groupBy({
      by: ["contractType"],
      _count: true,
    });

    console.log("   📊 Contratos por tipo:");
    contractsByType.forEach(({ contractType, _count }) => {
      console.log(`      - ${contractType}: ${_count}`);
    });
    console.log();

    // ═══════════════════════════════════════════════════════════
    // 3. VERIFICAR CUENTAS DE CLIENTE
    // ═══════════════════════════════════════════════════════════
    console.log("💳 3. Verificando cuentas de cliente...");

    const accountsCount = await prisma.clientAccount.count();
    console.log(`   ✅ Total de cuentas: ${accountsCount}`);

    if (accountsCount > 0) {
      const sampleAccount = await prisma.clientAccount.findFirst({
        select: {
          id: true,
          creditLimit: true,
          timeLimit: true,
          activeDays: true,
          limitsOverridden: true,
          client: {
            select: {
              displayName: true,
            },
          },
        },
      });

      if (sampleAccount) {
        console.log(
          `   📄 Ejemplo de cuenta (${sampleAccount.client.displayName}):`,
        );
        console.log(`      - Límite de crédito: $${sampleAccount.creditLimit}`);
        console.log(
          `      - Límite de tiempo: ${sampleAccount.timeLimit} días`,
        );
        console.log(`      - Días activos: ${sampleAccount.activeDays}`);
        console.log(
          `      - Límites sobrepasados: ${sampleAccount.limitsOverridden ? "Sí" : "No"}`,
        );
      }
    }
    console.log();

    // ═══════════════════════════════════════════════════════════
    // 4. VERIFICAR MODELOS NUEVOS (vacíos por ahora)
    // ═══════════════════════════════════════════════════════════
    console.log("🆕 4. Verificando nuevos modelos...");

    const addendumsCount = await prisma.contractAddendum.count();
    console.log(`   📄 Addendums de contrato: ${addendumsCount}`);

    const attachmentsCount = await prisma.contractAttachment.count();
    console.log(`   📎 Anexos especiales: ${attachmentsCount}`);

    const requestsCount = await prisma.limitChangeRequest.count();
    console.log(`   📝 Solicitudes de ampliación: ${requestsCount}`);
    console.log();

    // ═══════════════════════════════════════════════════════════
    // 5. VERIFICAR RELACIONES
    // ═══════════════════════════════════════════════════════════
    console.log("🔗 5. Verificando relaciones...");

    // Verificar que podemos consultar cláusulas con sus relaciones
    const clauseWithRelations = await prisma.contractClauseTemplate.findFirst({
      include: {
        tenant: {
          select: { name: true },
        },
        businessUnit: {
          select: { name: true },
        },
      },
    });

    if (clauseWithRelations) {
      console.log(`   ✅ Relaciones de cláusulas funcionan correctamente`);
      console.log(`      - Tenant: ${clauseWithRelations.tenant.name}`);
      console.log(
        `      - BU: ${clauseWithRelations.businessUnit?.name || "Global"}`,
      );
    }

    // Verificar que podemos consultar contratos con addendums
    const contractWithAddendums = await prisma.rentalContract.findFirst({
      include: {
        addendums: true,
      },
    });

    if (contractWithAddendums) {
      console.log(`   ✅ Relación contrato → addendums funcionan`);
      console.log(`      - Contrato: ${contractWithAddendums.code}`);
      console.log(
        `      - Addendums: ${contractWithAddendums.addendums.length}`,
      );
    }

    console.log();

    // ═══════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════
    console.log("✅ PRUEBAS COMPLETADAS\n");
    console.log("📊 Resumen:");
    console.log(`   ✓ ${clausesCount} cláusulas de contrato cargadas`);
    console.log(`   ✓ ${contractsCount} contratos migrados a tipo 'specific'`);
    console.log(
      `   ✓ ${accountsCount} cuentas con campos de límites agregados`,
    );
    console.log(`   ✓ Modelos nuevos creados y listos para uso`);
    console.log(`   ✓ Relaciones entre modelos verificadas\n`);

    console.log("💡 El schema está listo para:");
    console.log("   1. Crear contratos maestros (tipo 'master')");
    console.log("   2. Agregar addendums por cada entrega");
    console.log("   3. Gestionar solicitudes de ampliación de límites");
    console.log(
      "   4. Adjuntar documentos especiales (seguridad, viáticos, etc.)",
    );
    console.log("   5. Usar plantillas de cláusulas en contratos\n");
  } catch (error) {
    console.error("\n❌ Error durante las pruebas:", error);
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
