/*
  Warnings:

  - You are about to drop the column `business_unit_id` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `credit_limit_amount` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `credit_limit_days` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `requires_owner_approval_on_exceed` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `rental_client_credit_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,businessUnitId,clientId]` on the table `rental_client_credit_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessUnitId` to the `rental_client_credit_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `rental_client_credit_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `rental_client_credit_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `rental_client_credit_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('BODEGA', 'TALLER', 'OBRA');

-- DropForeignKey
ALTER TABLE "rental_client_credit_profiles" DROP CONSTRAINT "rental_client_credit_profiles_business_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "rental_client_credit_profiles" DROP CONSTRAINT "rental_client_credit_profiles_client_id_fkey";

-- DropForeignKey
ALTER TABLE "rental_client_credit_profiles" DROP CONSTRAINT "rental_client_credit_profiles_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "rental_client_credit_profiles" DROP CONSTRAINT "rental_client_credit_profiles_updated_by_fkey";

-- DropIndex
DROP INDEX "rental_client_credit_profiles_client_id_idx";

-- DropIndex
DROP INDEX "rental_client_credit_profiles_tenant_id_business_unit_id_cl_key";

-- DropIndex
DROP INDEX "rental_client_credit_profiles_tenant_id_business_unit_id_idx";

-- AlterTable
ALTER TABLE "asset_rental_profiles" ADD COLUMN     "initialValues" JSONB,
ADD COLUMN     "trackingFields" JSONB;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "currentRentalContract" TEXT,
ADD COLUMN     "isCurrentlyRented" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "rental_client_credit_profiles" DROP COLUMN "business_unit_id",
DROP COLUMN "client_id",
DROP COLUMN "created_at",
DROP COLUMN "credit_limit_amount",
DROP COLUMN "credit_limit_days",
DROP COLUMN "is_active",
DROP COLUMN "requires_owner_approval_on_exceed",
DROP COLUMN "tenant_id",
DROP COLUMN "updated_at",
DROP COLUMN "updated_by",
ADD COLUMN     "businessUnitId" TEXT NOT NULL,
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creditLimitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "creditLimitDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requiresOwnerApprovalOnExceed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT;

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WarehouseType" NOT NULL DEFAULT 'BODEGA',
    "address" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouses_tenantId_businessUnitId_idx" ON "warehouses"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "warehouses_type_idx" ON "warehouses"("type");

-- CreateIndex
CREATE INDEX "warehouses_isActive_idx" ON "warehouses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_businessUnitId_code_key" ON "warehouses"("businessUnitId", "code");

-- CreateIndex
CREATE INDEX "assets_warehouseId_idx" ON "assets"("warehouseId");

-- CreateIndex
CREATE INDEX "rental_client_credit_profiles_tenantId_businessUnitId_idx" ON "rental_client_credit_profiles"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "rental_client_credit_profiles_clientId_idx" ON "rental_client_credit_profiles"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "rental_client_credit_profiles_tenantId_businessUnitId_clien_key" ON "rental_client_credit_profiles"("tenantId", "businessUnitId", "clientId");

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles" ADD CONSTRAINT "rental_client_credit_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles" ADD CONSTRAINT "rental_client_credit_profiles_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles" ADD CONSTRAINT "rental_client_credit_profiles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles" ADD CONSTRAINT "rental_client_credit_profiles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
