-- CreateEnum
CREATE TYPE "AssetManagementType" AS ENUM ('UNIT', 'BULK');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'RENTAL_OUT', 'RENTAL_RETURN', 'SALE', 'ADJUSTMENT', 'LOSS', 'TRANSFER', 'RESERVE', 'UNRESERVE');

-- AlterTable
ALTER TABLE "asset_templates" ADD COLUMN     "managementType" "AssetManagementType" NOT NULL DEFAULT 'UNIT';

-- CreateTable
CREATE TABLE "stock_levels" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "quantityAvailable" INTEGER NOT NULL DEFAULT 0,
    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
    "quantityRented" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "pricePerDay" DECIMAL(10,2),
    "pricePerWeek" DECIMAL(10,2),
    "pricePerMonth" DECIMAL(10,2),
    "minStock" INTEGER,
    "maxStock" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "stockLevelId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "balanceAfter" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_levels_businessUnitId_idx" ON "stock_levels"("businessUnitId");

-- CreateIndex
CREATE INDEX "stock_levels_templateId_idx" ON "stock_levels"("templateId");

-- CreateIndex
CREATE INDEX "stock_levels_quantityAvailable_idx" ON "stock_levels"("quantityAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "stock_levels_businessUnitId_templateId_location_key" ON "stock_levels"("businessUnitId", "templateId", "location");

-- CreateIndex
CREATE INDEX "stock_movements_stockLevelId_createdAt_idx" ON "stock_movements"("stockLevelId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "asset_templates_managementType_idx" ON "asset_templates"("managementType");

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "asset_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stockLevelId_fkey" FOREIGN KEY ("stockLevelId") REFERENCES "stock_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
