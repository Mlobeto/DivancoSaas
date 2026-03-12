#!/usr/bin/env node
/*
  Script to delete all data from the DB except the SuperAdmin user (by email).
  WARNING: This is destructive. Make a backup if unsure.

  Usage:
    node scripts/clear_all_except_superadmin.js owner@divancosaas.com [--reset-password]
*/

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.argv[2];
  const resetPassword = process.argv.includes("--reset-password");
  if (!superAdminEmail) {
    console.error(
      "Usage: node scripts/clear_all_except_superadmin.js <SuperAdminEmail> [--reset-password]",
    );
    process.exit(1);
  }

  const bcrypt = require("bcrypt");

  let superAdmin = await prisma.user.findFirst({
    where: { email: superAdminEmail },
  });

  if (!superAdmin) {
    const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashed = await bcrypt.hash(randomPassword, 10);
    superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashed,
        firstName: "Owner",
        lastName: "Admin",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        tenantId: null,
      },
    });
    console.log(`✅ SuperAdmin creado. Password: ${randomPassword}`);
  } else if (resetPassword) {
    const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashed = await bcrypt.hash(randomPassword, 10);
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { password: hashed },
    });
    console.log(
      `✅ Password de SuperAdmin reseteado. Nuevo password: ${randomPassword}`,
    );
  } else {
    console.log(`✅ SuperAdmin encontrado: ${superAdmin.email}`);
  }

  console.log("\n🗑️  Borrando datos en orden de dependencias...\n");

  // ── CHAT ──────────────────────────────────────────────────────
  await safe("chatMessage", () => prisma.chatMessage.deleteMany({}));
  await safe("chatRoomMember", () => prisma.chatRoomMember.deleteMany({}));
  await safe("chatRoom", () => prisma.chatRoom.deleteMany({}));

  // ── NOTIFICATIONS ─────────────────────────────────────────────
  await safe("notification", () => prisma.notification.deleteMany({}));
  await safe("userPushToken", () => prisma.userPushToken.deleteMany({}));

  // ── OPERATORS ─────────────────────────────────────────────────
  await safe("operatorExpense", () => prisma.operatorExpense.deleteMany({}));
  await safe("operatorPhoto", () => prisma.operatorPhoto.deleteMany({}));
  await safe("operatorDailyReport", () =>
    prisma.operatorDailyReport.deleteMany({}),
  );
  await safe("operatorAssignment", () =>
    prisma.operatorAssignment.deleteMany({}),
  );
  await safe("operatorDocument", () => prisma.operatorDocument.deleteMany({}));
  await safe("operatorProfile", () => prisma.operatorProfile.deleteMany({}));

  // ── QUOTATIONS ────────────────────────────────────────────────
  await safe("quotationContract", () =>
    prisma.quotationContract.deleteMany({}),
  );
  await safe("quotationItem", () => prisma.quotationItem.deleteMany({}));
  await safe("quotation", () => prisma.quotation.deleteMany({}));

  // ── CONTRACTS (dependents first) ──────────────────────────────
  await safe("contractClause", () => prisma.contractClause.deleteMany({}));
  await safe("contractClauseTemplate", () =>
    prisma.contractClauseTemplate.deleteMany({}),
  );
  await safe("contractAsset", () => prisma.contractAsset.deleteMany({}));
  await safe("contractAttachment", () =>
    prisma.contractAttachment.deleteMany({}),
  );
  await safe("contractAddendum", () => prisma.contractAddendum.deleteMany({}));
  await safe("limitChangeRequest", () =>
    prisma.limitChangeRequest.deleteMany({}),
  );
  await safe("rentalAccountMovement", () =>
    prisma.rentalAccountMovement.deleteMany({}),
  );

  // ── ASSETS (all usage records first) ─────────────────────────
  await safe("usageReport", () => prisma.usageReport.deleteMany({}));
  await safe("supplyUsage", () => prisma.supplyUsage.deleteMany({}));
  await safe("assetUsage", () => prisma.assetUsage.deleteMany({}));
  await safe("bulkRentalItem", () => prisma.bulkRentalItem.deleteMany({}));
  await safe("assetRental", () => prisma.assetRental.deleteMany({}));
  await safe("rentalContract", () => prisma.rentalContract.deleteMany({}));
  await safe("incident", () => prisma.incident.deleteMany({}));
  await safe("preventiveConfig", () => prisma.preventiveConfig.deleteMany({}));
  await safe("maintenanceEvent", () => prisma.maintenanceEvent.deleteMany({}));
  await safe("maintenanceRecord", () =>
    prisma.maintenanceRecord.deleteMany({}),
  );
  await safe("assetEvent", () => prisma.assetEvent.deleteMany({}));
  await safe("assetAttachment", () => prisma.assetAttachment.deleteMany({}));
  await safe("assetState", () => prisma.assetState.deleteMany({}));
  await safe("systemAnnouncement", () =>
    prisma.systemAnnouncement.deleteMany({}),
  );

  // ── CLIENTS ───────────────────────────────────────────────────
  await safe("clientRiskSnapshot", () =>
    prisma.clientRiskSnapshot.deleteMany({}),
  );
  await safe("clientAccountMovement", () =>
    prisma.clientAccountMovement.deleteMany({}),
  );
  await safe("clientAccount", () => prisma.clientAccount.deleteMany({}));
  await safe("clientTaxProfile", () => prisma.clientTaxProfile.deleteMany({}));
  await safe("clientContact", () => prisma.clientContact.deleteMany({}));
  await safe("rentalClientCreditProfile", () =>
    prisma.rentalClientCreditProfile.deleteMany({}),
  );
  await safe("clientBusinessUnit", () =>
    prisma.clientBusinessUnit.deleteMany({}),
  );
  await safe("clientRankingConfig", () =>
    prisma.clientRankingConfig.deleteMany({}),
  );
  await safe("client", () => prisma.client.deleteMany({}));

  // ── PURCHASING / STOCK ────────────────────────────────────────
  await safe("stockTransaction", () => prisma.stockTransaction.deleteMany({}));
  await safe("supplyQuote", () => prisma.supplyQuote.deleteMany({}));
  await safe("purchaseOrderItem", () =>
    prisma.purchaseOrderItem.deleteMany({}),
  );
  await safe("supplierAccountEntry", () =>
    prisma.supplierAccountEntry.deleteMany({}),
  );
  await safe("purchaseOrder", () => prisma.purchaseOrder.deleteMany({}));
  await safe("supplierContact", () => prisma.supplierContact.deleteMany({}));
  await safe("supplier", () => prisma.supplier.deleteMany({}));
  await safe("stockMovement", () => prisma.stockMovement.deleteMany({}));
  await safe("stockLevel", () => prisma.stockLevel.deleteMany({}));
  await safe("supply", () => prisma.supply.deleteMany({}));
  await safe("supplyCategory", () => prisma.supplyCategory.deleteMany({}));

  // ── ASSETS / WAREHOUSE ────────────────────────────────────────
  await safe("assetRentalProfile", () =>
    prisma.assetRentalProfile.deleteMany({}),
  );
  await safe("assetDocumentType", () =>
    prisma.assetDocumentType.deleteMany({}),
  );
  await safe("asset", () => prisma.asset.deleteMany({}));
  await safe("warehouse", () => prisma.warehouse.deleteMany({}));
  await safe("assetTemplate", () => prisma.assetTemplate.deleteMany({}));

  // ── TEMPLATES / BRANDING ──────────────────────────────────────
  await safe("template", () => prisma.template.deleteMany({}));
  await safe("documentTemplate", () => prisma.documentTemplate.deleteMany({}));
  await safe("emailTemplate", () => prisma.emailTemplate.deleteMany({}));
  await safe("businessUnitBranding", () =>
    prisma.businessUnitBranding.deleteMany({}),
  );

  // ── MODULES / INTEGRATIONS ────────────────────────────────────
  await safe("businessUnitModule", () =>
    prisma.businessUnitModule.deleteMany({}),
  );
  await safe("module", () => prisma.module.deleteMany({}));
  await safe("businessUnitIntent", () =>
    prisma.businessUnitIntent.deleteMany({}),
  );
  await safe("intentDefinition", () => prisma.intentDefinition.deleteMany({}));
  await safe("businessUnitChannelConfig", () =>
    prisma.businessUnitChannelConfig.deleteMany({}),
  );
  await safe("businessUnitIntegration", () =>
    prisma.businessUnitIntegration.deleteMany({}),
  );
  await safe("integrationCredential", () =>
    prisma.integrationCredential.deleteMany({}),
  );
  await safe("platformSubscription", () =>
    prisma.platformSubscription.deleteMany({}),
  );
  await safe("workflow", () => prisma.workflow.deleteMany({}));

  // ── INFRA ─────────────────────────────────────────────────────
  await safe("eventQueue", () => prisma.eventQueue.deleteMany({}));
  await safe("userChannelIdentity", () =>
    prisma.userChannelIdentity.deleteMany({}),
  );
  await safe("auditLog", () => prisma.auditLog.deleteMany({}));

  // ── RBAC ──────────────────────────────────────────────────────
  await safe("userPermission", () => prisma.userPermission.deleteMany({}));
  await safe("rolePermission", () => prisma.rolePermission.deleteMany({}));
  await safe("permission", () => prisma.permission.deleteMany({}));
  await safe("userBusinessUnit", () => prisma.userBusinessUnit.deleteMany({}));
  await safe("role", () => prisma.role.deleteMany({}));

  // ── TENANTS / BUSINESS UNITS ──────────────────────────────────
  await safe("businessUnit", () => prisma.businessUnit.deleteMany({}));
  await safe("tenant", () => prisma.tenant.deleteMany({}));

  // ── USERS (keep superAdmin) ───────────────────────────────────
  await safe("user (non-admin)", () =>
    prisma.user.deleteMany({ where: { email: { not: superAdminEmail } } }),
  );

  console.log("\n✨ Limpieza completa. Solo queda el SuperAdmin.");
  console.log(`   Email: ${superAdminEmail}`);
  await prisma.$disconnect();
}

async function safe(label, fn) {
  try {
    const result = await fn();
    const count = result?.count ?? "?";
    console.log(`  ✓ ${label}: ${count} registros eliminados`);
  } catch (e) {
    if (e.code === "P2021" || e.message?.includes("does not exist")) {
      console.log(`  ⚠ ${label}: tabla no encontrada (skip)`);
    } else {
      console.warn(`  ✗ ${label}: ${e.message}`);
    }
  }
}

main();

async function main() {
  const superAdminEmail = process.argv[2];
  const resetPassword = process.argv.includes("--reset-password");
  if (!superAdminEmail) {
    console.error(
      "Usage: node scripts/clear_all_except_superadmin.js <SuperAdminEmail> [--reset-password]",
    );
    process.exit(1);
  }

  let superAdmin = await prisma.user.findFirst({
    where: { email: superAdminEmail },
  });
  const bcrypt = require("bcrypt");
  if (!superAdmin) {
    const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashed = await bcrypt.hash(randomPassword, 10);
    superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashed,
        firstName: "Owner",
        lastName: "Admin",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        tenantId: null,
      },
    });
    console.log(`Created SuperAdmin with password: ${randomPassword}`);
  } else if (resetPassword) {
    const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashed = await bcrypt.hash(randomPassword, 10);
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { password: hashed },
    });
    console.log(`SuperAdmin password reset. New password: ${randomPassword}`);
  }

  // Delete dependents first (order matters)
  await prisma.assetUsage.deleteMany({});
  await prisma.assetEvent.deleteMany({});
  await prisma.assetAttachment.deleteMany({});
  await prisma.supplyUsage.deleteMany({});
  await prisma.usageReport.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.preventiveConfig.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.maintenanceEvent.deleteMany({});
  await prisma.operatorAssignment.deleteMany({});
  await prisma.operatorDailyReport.deleteMany({});
  await prisma.bulkRentalItem.deleteMany({});
  await prisma.stockLevel.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  // Modelo 'contract' no existe, solo borrar rentalContract
  await prisma.rentalContract.deleteMany({});
  await prisma.assetState.deleteMany({});
  await prisma.assetRental.deleteMany({});
  await prisma.assetRentalProfile.deleteMany({});
  await prisma.userBusinessUnit.deleteMany({});
  await prisma.userPermission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.eventQueue.deleteMany({});
  await prisma.userChannelIdentity.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.supply.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetTemplate.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.businessUnit.deleteMany({});
  await prisma.tenant.deleteMany({});

  // Delete all users except SuperAdmin
  await prisma.user.deleteMany({ where: { email: { not: superAdminEmail } } });

  console.log("DB wipe complete. Only SuperAdmin remains.");
  await prisma.$disconnect();
}

main();
