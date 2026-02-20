-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetCategory" ADD VALUE 'SUPPLY_FUEL';
ALTER TYPE "AssetCategory" ADD VALUE 'SUPPLY_OIL';
ALTER TYPE "AssetCategory" ADD VALUE 'SUPPLY_PAINT';
ALTER TYPE "AssetCategory" ADD VALUE 'SUPPLY_SPARE_PART';
ALTER TYPE "AssetCategory" ADD VALUE 'SUPPLY_CONSUMABLE';
ALTER TYPE "AssetCategory" ADD VALUE 'SUPPLY_SAFETY';

-- AlterTable
ALTER TABLE "asset_templates" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "businessRules" JSONB,
ADD COLUMN     "compatibleWith" JSONB,
ADD COLUMN     "hasExpiryDate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hazardClass" TEXT,
ADD COLUMN     "isDangerous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "presentation" JSONB,
ADD COLUMN     "requiresLotTracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "technicalSpecs" JSONB;
