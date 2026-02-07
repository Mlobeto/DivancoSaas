/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "IntegrationType" ADD VALUE 'AZURE_COMMUNICATION_SERVICES';

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "requiresClinic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "supplies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_usages" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "assetId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_contracts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_assets" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "obra" TEXT NOT NULL,
    "estimatedStart" TIMESTAMP(3) NOT NULL,
    "estimatedEnd" TIMESTAMP(3) NOT NULL,
    "estimatedHours" DECIMAL(65,30),
    "estimatedDays" INTEGER,
    "actualEnd" TIMESTAMP(3),
    "actualHours" DECIMAL(65,30),
    "needsPostObraMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_reports" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "notes" TEXT,
    "evidenceUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,
    "decision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preventive_configs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "suppliesConfig" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preventive_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_events" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "notes" TEXT,
    "suppliesUsed" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplies_tenantId_businessUnitId_idx" ON "supplies"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "supply_usages_supplyId_idx" ON "supply_usages"("supplyId");

-- CreateIndex
CREATE INDEX "supply_usages_assetId_idx" ON "supply_usages"("assetId");

-- CreateIndex
CREATE INDEX "supply_usages_reason_idx" ON "supply_usages"("reason");

-- CreateIndex
CREATE INDEX "rental_contracts_tenantId_businessUnitId_idx" ON "rental_contracts"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "rental_contracts_clientId_idx" ON "rental_contracts"("clientId");

-- CreateIndex
CREATE INDEX "rental_contracts_status_idx" ON "rental_contracts"("status");

-- CreateIndex
CREATE INDEX "contract_assets_contractId_idx" ON "contract_assets"("contractId");

-- CreateIndex
CREATE INDEX "contract_assets_assetId_idx" ON "contract_assets"("assetId");

-- CreateIndex
CREATE INDEX "contract_assets_obra_idx" ON "contract_assets"("obra");

-- CreateIndex
CREATE INDEX "usage_reports_assetId_idx" ON "usage_reports"("assetId");

-- CreateIndex
CREATE INDEX "usage_reports_contractId_idx" ON "usage_reports"("contractId");

-- CreateIndex
CREATE INDEX "usage_reports_createdAt_idx" ON "usage_reports"("createdAt");

-- CreateIndex
CREATE INDEX "incidents_assetId_idx" ON "incidents"("assetId");

-- CreateIndex
CREATE INDEX "incidents_contractId_idx" ON "incidents"("contractId");

-- CreateIndex
CREATE INDEX "incidents_resolved_idx" ON "incidents"("resolved");

-- CreateIndex
CREATE INDEX "preventive_configs_assetId_version_idx" ON "preventive_configs"("assetId", "version");

-- CreateIndex
CREATE INDEX "maintenance_events_assetId_idx" ON "maintenance_events"("assetId");

-- CreateIndex
CREATE INDEX "maintenance_events_type_idx" ON "maintenance_events"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_usages" ADD CONSTRAINT "supply_usages_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "supplies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_usages" ADD CONSTRAINT "supply_usages_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_assets" ADD CONSTRAINT "contract_assets_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_assets" ADD CONSTRAINT "contract_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_reports" ADD CONSTRAINT "usage_reports_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_reports" ADD CONSTRAINT "usage_reports_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_configs" ADD CONSTRAINT "preventive_configs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
