/*
  Warnings:

  - You are about to drop the column `category` on the `supplies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[businessUnitId,code]` on the table `supplies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "MovementDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "SupplyCategoryType" AS ENUM ('CONSUMABLE', 'SPARE_PART', 'RAW_MATERIAL', 'FINISHED_PRODUCT', 'TOOL', 'OTHER');

-- DropIndex
DROP INDEX "supplies_category_idx";

-- AlterTable
ALTER TABLE "supplies" DROP COLUMN "category",
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sku" TEXT;

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "type" "ClientType" NOT NULL DEFAULT 'COMPANY',
    "countryCode" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "channel" "ContactChannel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_tax_profiles" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "taxIdType" TEXT NOT NULL,
    "taxIdNumber" TEXT NOT NULL,
    "taxRegime" TEXT,
    "fiscalResponsibility" TEXT,
    "fiscalAddressLine1" TEXT,
    "fiscalAddressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_account_movements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(14,2) NOT NULL,
    "direction" "MovementDirection" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sourceModule" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "balanceAfter" DECIMAL(14,2),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_account_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_ranking_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "weights" JSONB NOT NULL DEFAULT '{}',
    "thresholds" JSONB NOT NULL DEFAULT '{}',
    "policies" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_ranking_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_risk_snapshots" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "segment" TEXT NOT NULL,
    "currentBalance" DECIMAL(14,2),
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_risk_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SupplyCategoryType" NOT NULL DEFAULT 'CONSUMABLE',
    "color" TEXT,
    "icon" TEXT,
    "requiresStockControl" BOOLEAN NOT NULL DEFAULT true,
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_tenantId_idx" ON "clients"("tenantId");

-- CreateIndex
CREATE INDEX "clients_businessUnitId_idx" ON "clients"("businessUnitId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "client_contacts_clientId_idx" ON "client_contacts"("clientId");

-- CreateIndex
CREATE INDEX "client_tax_profiles_clientId_idx" ON "client_tax_profiles"("clientId");

-- CreateIndex
CREATE INDEX "client_tax_profiles_countryCode_idx" ON "client_tax_profiles"("countryCode");

-- CreateIndex
CREATE INDEX "client_account_movements_tenantId_idx" ON "client_account_movements"("tenantId");

-- CreateIndex
CREATE INDEX "client_account_movements_businessUnitId_idx" ON "client_account_movements"("businessUnitId");

-- CreateIndex
CREATE INDEX "client_account_movements_clientId_idx" ON "client_account_movements"("clientId");

-- CreateIndex
CREATE INDEX "client_account_movements_date_idx" ON "client_account_movements"("date");

-- CreateIndex
CREATE INDEX "client_ranking_configs_tenantId_idx" ON "client_ranking_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "client_ranking_configs_businessUnitId_key" ON "client_ranking_configs"("businessUnitId");

-- CreateIndex
CREATE INDEX "client_risk_snapshots_segment_idx" ON "client_risk_snapshots"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "client_risk_snapshots_clientId_key" ON "client_risk_snapshots"("clientId");

-- CreateIndex
CREATE INDEX "supply_categories_tenantId_businessUnitId_idx" ON "supply_categories"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "supply_categories_type_idx" ON "supply_categories"("type");

-- CreateIndex
CREATE UNIQUE INDEX "supply_categories_businessUnitId_code_key" ON "supply_categories"("businessUnitId", "code");

-- CreateIndex
CREATE INDEX "supplies_categoryId_idx" ON "supplies"("categoryId");

-- CreateIndex
CREATE INDEX "supplies_sku_idx" ON "supplies"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "supplies_businessUnitId_code_key" ON "supplies"("businessUnitId", "code");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tax_profiles" ADD CONSTRAINT "client_tax_profiles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_account_movements" ADD CONSTRAINT "client_account_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_account_movements" ADD CONSTRAINT "client_account_movements_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_account_movements" ADD CONSTRAINT "client_account_movements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_ranking_configs" ADD CONSTRAINT "client_ranking_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_ranking_configs" ADD CONSTRAINT "client_ranking_configs_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_risk_snapshots" ADD CONSTRAINT "client_risk_snapshots_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_categories" ADD CONSTRAINT "supply_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_categories" ADD CONSTRAINT "supply_categories_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "supply_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
