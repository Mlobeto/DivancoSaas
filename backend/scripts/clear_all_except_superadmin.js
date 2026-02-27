#!/usr/bin/env node
/*
  Script to delete all data from the DB except the SuperAdmin user (by email).
  WARNING: This is destructive. Make a backup if unsure.

  Usage:
    NODE_ENV=production DATABASE_URL="..." node scripts/clear_all_except_superadmin.js Owner@Owner.com
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
