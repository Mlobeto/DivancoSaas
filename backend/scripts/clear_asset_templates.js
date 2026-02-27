#!/usr/bin/env node
/*
  Safe script to delete all AssetTemplates and dependent records.
  Preserves a SuperAdmin user identified by email passed as argument.

  Usage (from backend/):
    NODE_ENV=production DATABASE_URL="..." node scripts/clear_asset_templates.js Owner@Owner.com

  The script will:
  - verify the SuperAdmin exists
  - list how many templates will be removed
  - delete dependent BulkRentalItem and StockLevel rows
  - nullify references on PurchaseOrderItem and Asset
  - delete AssetTemplate rows

  WARNING: This is destructive. Make a DB backup if unsure.
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.argv[2];
  if (!superAdminEmail) {
    console.error('Usage: node scripts/clear_asset_templates.js <SuperAdminEmail>');
    process.exit(1);
  }

  const superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!superAdmin) {
    console.error(`SuperAdmin with email "${superAdminEmail}" not found. Aborting.`);
    process.exit(1);
  }

  console.log('Found SuperAdmin:', superAdminEmail);

  const templates = await prisma.assetTemplate.findMany({ select: { id: true, name: true, businessUnitId: true } });
  if (templates.length === 0) {
    console.log('No asset templates found. Nothing to do.');
    process.exit(0);
  }

  const ids = templates.map(t => t.id);
  console.log(`Will delete ${ids.length} asset templates.`);

  // Show sample names (up to 10)
  console.log('Sample templates:', templates.slice(0, 10).map(t => `${t.name} (bu:${t.businessUnitId})`).join(', '));

  // Confirm prompt
  if (process.env.FORCE !== '1') {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => rl.question('Type DELETE to confirm: ', a => { rl.close(); resolve(a); }));
    if (String(answer).trim() !== 'DELETE') {
      console.log('Aborted by user.');
      process.exit(0);
    }
  }

  try {
    // Delete dependents in safe order
    const results = await prisma.$transaction([
      // Remove BulkRentalItem entries referencing templates
      prisma.bulkRentalItem.deleteMany({ where: { templateId: { in: ids } } }),
      // Remove StockLevel entries (will cascade stock movements)
      prisma.stockLevel.deleteMany({ where: { templateId: { in: ids } } }),
      // Nullify PurchaseOrderItem.assetTemplateId
      prisma.purchaseOrderItem.updateMany({ where: { assetTemplateId: { in: ids } }, data: { assetTemplateId: null } }),
      // Nullify Asset.templateId
      prisma.asset.updateMany({ where: { templateId: { in: ids } }, data: { templateId: null } }),
      // Finally delete the asset templates
      prisma.assetTemplate.deleteMany({ where: { id: { in: ids } } }),
    ]);

    console.log('Deletion results:', results);
    console.log('Done.');
  } catch (err) {
    console.error('Error during deletion:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
