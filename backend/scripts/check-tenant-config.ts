/**
 * Script to check and update tenant configuration
 * Run with: npx tsx scripts/check-tenant-config.ts <tenant-slug>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTenantConfig(tenantSlug: string) {
  console.log(`\n🔍 Checking configuration for tenant: ${tenantSlug}\n`);

  // Get tenant with business units
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      businessUnits: {
        include: {
          enabledModules: true,
        },
      },
    },
  });

  if (!tenant) {
    console.error(`❌ Tenant '${tenantSlug}' not found`);
    return;
  }

  console.log(`✅ Tenant found: ${tenant.name} (${tenant.id})`);
  console.log(`   Plan: ${tenant.plan}`);
  console.log(`   Country: ${tenant.country}`);
  console.log(`   Status: ${tenant.status}`);
  console.log(`   Business Units: ${tenant.businessUnits.length}\n`);

  // Check each business unit
  for (const bu of tenant.businessUnits) {
    console.log(`📦 Business Unit: ${bu.name} (${bu.id})`);
    console.log(`   Settings:`, bu.settings);

    const settings = bu.settings as any;
    console.log(`   - enabledModules:`, settings?.enabledModules || "NOT SET");
    console.log(`   - vertical:`, settings?.vertical || "NOT SET");
    console.log(`   - Database modules:`, bu.enabledModules.length);
    console.log("");
  }

  // Ask if user wants to update
  console.log("💡 To update the BusinessUnit settings, run:");
  console.log(
    `   npx tsx scripts/update-tenant-config.ts ${tenantSlug} "rental" "inventory,clients,purchases,rental"`,
  );
}

async function main() {
  const tenantSlug = process.argv[2];

  if (!tenantSlug) {
    console.error(
      "Usage: npx tsx scripts/check-tenant-config.ts <tenant-slug>",
    );
    console.error("Example: npx tsx scripts/check-tenant-config.ts prueba");
    process.exit(1);
  }

  await checkTenantConfig(tenantSlug);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
