/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,businessUnitId,templateId,location]` on the table `stock_levels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `bulk_rental_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `stock_levels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `stock_movements` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "stock_levels_businessUnitId_templateId_location_key";

-- AlterTable
ALTER TABLE "bulk_rental_items" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_levels" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "bulk_rental_items_tenantId_idx" ON "bulk_rental_items"("tenantId");

-- CreateIndex
CREATE INDEX "stock_levels_tenantId_idx" ON "stock_levels"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_levels_tenantId_businessUnitId_templateId_location_key" ON "stock_levels"("tenantId", "businessUnitId", "templateId", "location");

-- CreateIndex
CREATE INDEX "stock_movements_tenantId_idx" ON "stock_movements"("tenantId");

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_rental_items" ADD CONSTRAINT "bulk_rental_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
