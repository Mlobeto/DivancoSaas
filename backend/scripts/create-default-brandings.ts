/**
 * Script to create default BusinessUnitBranding for all Business Units
 *
 * This script creates default branding configuration for each BusinessUnit
 * that doesn't already have one.
 *
 * Run with: npx tsx scripts/create-default-brandings.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDefaultBrandings() {
  console.log(
    "\n🎨 Creating default BusinessUnitBranding for all Business Units\n",
  );

  try {
    // 1. Get all business units
    const businessUnits = await prisma.businessUnit.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`🏢 Found ${businessUnits.length} business units\n`);

    // 2. For each business unit, create branding if it doesn't exist
    let created = 0;
    let alreadyExists = 0;

    for (const businessUnit of businessUnits) {
      console.log(`📦 Processing: ${businessUnit.name}`);

      // Check if branding already exists
      const existingBranding = await prisma.businessUnitBranding.findUnique({
        where: { businessUnitId: businessUnit.id },
      });

      if (existingBranding) {
        console.log(`   ⏭️  Branding already exists, skipping\n`);
        alreadyExists++;
        continue;
      }

      // Create default branding
      const branding = await prisma.businessUnitBranding.create({
        data: {
          businessUnitId: businessUnit.id,
          logoUrl: null,
          primaryColor: "#1E40AF",
          secondaryColor: "#64748B",
          fontFamily: "Inter",
          headerConfig: {
            showLogo: true,
            logoAlign: "left",
            showBusinessName: true,
            showTaxInfo: false,
            height: 80,
          } as any,
          footerConfig: {
            showContactInfo: true,
            showDisclaimer: false,
            height: 60,
          } as any,
        },
      });

      console.log(`   ✅ Created default branding (${branding.id})\n`);
      created++;
    }

    console.log("=".repeat(60));
    console.log("✅ Branding initialization completed!");
    console.log("=".repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Business Units: ${businessUnits.length}`);
    console.log(`   - Created: ${created}`);
    console.log(`   - Already existed: ${alreadyExists}`);

    console.log("\n💡 Next steps:");
    console.log(
      "   - Customize branding: PUT /api/v1/branding/:businessUnitId",
    );
    console.log("   - Upload logos, set colors, configure header/footer");
    console.log(
      "   - All templates will automatically use BusinessUnit branding\n",
    );
  } catch (error) {
    console.error("\n❌ Failed:", error);
    throw error;
  }
}

async function main() {
  try {
    await createDefaultBrandings();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
