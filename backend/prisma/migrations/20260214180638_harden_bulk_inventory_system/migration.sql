/*
  Warnings:

  - The values [PURCHASE,RENTAL_OUT,RENTAL_RETURN,SALE,ADJUSTMENT,LOSS,TRANSFER] on the enum `StockMovementType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `balanceAfter` on the `stock_movements` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `stock_movements` table. All the data in the column will be lost.
  - Added the required column `availableAfter` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `availableBefore` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantityAfter` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantityBefore` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentedAfter` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentedBefore` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservedAfter` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservedBefore` to the `stock_movements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockMovementType_new" AS ENUM ('ADD', 'RESERVE', 'UNRESERVE', 'RENT_OUT', 'RETURN', 'ADJUST');
ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "StockMovementType_new" USING ("type"::text::"StockMovementType_new");
ALTER TYPE "StockMovementType" RENAME TO "StockMovementType_old";
ALTER TYPE "StockMovementType_new" RENAME TO "StockMovementType";
DROP TYPE "public"."StockMovementType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "stock_levels" DROP CONSTRAINT "stock_levels_templateId_fkey";

-- AlterTable
ALTER TABLE "stock_levels" ADD COLUMN     "unitCost" DECIMAL(10,2),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stock_movements" DROP COLUMN "balanceAfter",
DROP COLUMN "reference",
ADD COLUMN     "availableAfter" INTEGER NOT NULL,
ADD COLUMN     "availableBefore" INTEGER NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "quantityAfter" INTEGER NOT NULL,
ADD COLUMN     "quantityBefore" INTEGER NOT NULL,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceType" TEXT,
ADD COLUMN     "rentedAfter" INTEGER NOT NULL,
ADD COLUMN     "rentedBefore" INTEGER NOT NULL,
ADD COLUMN     "reservedAfter" INTEGER NOT NULL,
ADD COLUMN     "reservedBefore" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "bulk_rental_items" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerDay" DECIMAL(10,2),
    "pricePerWeek" DECIMAL(10,2),
    "pricePerMonth" DECIMAL(10,2),
    "location" TEXT,
    "stockLevelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "bulk_rental_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bulk_rental_items_contractId_idx" ON "bulk_rental_items"("contractId");

-- CreateIndex
CREATE INDEX "bulk_rental_items_templateId_idx" ON "bulk_rental_items"("templateId");

-- CreateIndex
CREATE INDEX "bulk_rental_items_stockLevelId_idx" ON "bulk_rental_items"("stockLevelId");

-- CreateIndex
CREATE INDEX "stock_movements_referenceId_idx" ON "stock_movements"("referenceId");

-- CreateIndex
CREATE INDEX "stock_movements_referenceType_idx" ON "stock_movements"("referenceType");

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "asset_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_rental_items" ADD CONSTRAINT "bulk_rental_items_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_rental_items" ADD CONSTRAINT "bulk_rental_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "asset_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_rental_items" ADD CONSTRAINT "bulk_rental_items_stockLevelId_fkey" FOREIGN KEY ("stockLevelId") REFERENCES "stock_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_rental_items" ADD CONSTRAINT "bulk_rental_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
