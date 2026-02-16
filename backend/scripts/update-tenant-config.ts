/**
 * Script to update tenant configuration (vertical and modules)
 * Run with: npx tsx scripts/update-tenant-config.ts <tenant-slug> <vertical> <modules>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateTenantConfig(
  tenantSlug: string,
  vertical: string,
  modulesString: string,
) {
  console.log(`\n🔧 Updating configuration for tenant: ${tenantSlug}\n`);

  // Parse modules
  const modules = modulesString.split(",").map((m) => m.trim());

  // Get tenant with business units
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      businessUnits: true,
    },
  });

  if (!tenant) {
    console.error(`❌ Tenant '${tenantSlug}' not found`);
    return;
  }

  if (tenant.businessUnits.length === 0) {
    console.error(`❌ Tenant has no business units`);
    return;
  }

  const firstBU = tenant.businessUnits[0];
  const currentSettings = (firstBU.settings as any) || {};

  console.log(`📦 Updating Business Unit: ${firstBU.name}`);
  console.log(`   Current settings:`, currentSettings);
  console.log(`   New vertical: ${vertical}`);
  console.log(`   New modules: ${modules.join(", ")}`);

  // Update settings
  await prisma.businessUnit.update({
    where: { id: firstBU.id },
    data: {
      settings: {
        ...currentSettings,
        vertical,
        enabledModules: modules,
      },
    },
  });

  console.log(`\n✅ Configuration updated successfully!`);
  console.log(`\n📋 Verify with:`);
  console.log(`   npx tsx scripts/check-tenant-config.ts ${tenantSlug}`);
}

async function main() {
  const tenantSlug = process.argv[2];
  const vertical = process.argv[3];
  const modules = process.argv[4];

  if (!tenantSlug || !vertical || !modules) {
    console.error(
      "Usage: npx tsx scripts/update-tenant-config.ts <tenant-slug> <vertical> <modules>",
    );
    console.error(
      'Example: npx tsx scripts/update-tenant-config.ts prueba rental "inventory,clients,purchases,rental"',
    );
    process.exit(1);
  }

  await updateTenantConfig(tenantSlug, vertical, modules);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
