/*
  Warnings:

  - A unique constraint covering the columns `[quotationId]` on the table `rental_contracts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `rental_contracts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alertAmount` to the `rental_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `rental_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentCredit` to the `rental_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialCredit` to the `rental_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `rental_contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "asset_usages" ADD COLUMN     "hourometerEnd" DECIMAL(10,2),
ADD COLUMN     "hourometerStart" DECIMAL(10,2),
ADD COLUMN     "hoursBilled" DECIMAL(5,2),
ADD COLUMN     "hoursWorked" DECIMAL(5,2),
ADD COLUMN     "kmTraveled" DECIMAL(5,2),
ADD COLUMN     "machineryCost" DECIMAL(10,2),
ADD COLUMN     "odometerEnd" DECIMAL(10,2),
ADD COLUMN     "odometerStart" DECIMAL(10,2),
ADD COLUMN     "operatorCost" DECIMAL(10,2),
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "rentalId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "totalCost" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "maintenanceCostDaily" DECIMAL(10,2),
ADD COLUMN     "minDailyHours" DECIMAL(5,2),
ADD COLUMN     "operatorCostRate" DECIMAL(10,2),
ADD COLUMN     "operatorCostType" TEXT,
ADD COLUMN     "pricePerDay" DECIMAL(10,2),
ADD COLUMN     "pricePerHour" DECIMAL(10,2),
ADD COLUMN     "pricePerKm" DECIMAL(10,2),
ADD COLUMN     "pricePerWeek" DECIMAL(10,2),
ADD COLUMN     "trackingType" TEXT;

-- AlterTable
ALTER TABLE "rental_contracts" ADD COLUMN     "actualEndDate" TIMESTAMP(3),
ADD COLUMN     "alertAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "alertTriggered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "currentCredit" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "estimatedEndDate" TIMESTAMP(3),
ADD COLUMN     "estimatedTotal" DECIMAL(12,2),
ADD COLUMN     "initialCredit" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "lastAlertSent" TIMESTAMP(3),
ADD COLUMN     "lastAutoChargeDate" TIMESTAMP(3),
ADD COLUMN     "lastStatementSent" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nextStatementDue" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "quotationId" TEXT,
ADD COLUMN     "signedPdfUrl" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "statementFrequency" TEXT,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "totalConsumed" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalReloaded" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "asset_rentals" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "withdrawalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "trackingType" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2),
    "operatorCostType" TEXT,
    "operatorCostRate" DECIMAL(10,2),
    "initialHourometer" DECIMAL(10,2),
    "currentHourometer" DECIMAL(10,2),
    "totalHoursUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "initialOdometer" DECIMAL(10,2),
    "currentOdometer" DECIMAL(10,2),
    "totalKmUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dailyRate" DECIMAL(10,2),
    "daysElapsed" INTEGER NOT NULL DEFAULT 0,
    "totalMachineryCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalOperatorCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastChargeDate" TIMESTAMP(3),
    "withdrawalEvidence" TEXT[],
    "returnEvidence" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "asset_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_account_movements" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "creditBefore" DECIMAL(12,2) NOT NULL,
    "creditAfter" DECIMAL(12,2) NOT NULL,
    "assetRentalId" TEXT,
    "usageReportId" TEXT,
    "machineryCost" DECIMAL(10,2),
    "operatorCost" DECIMAL(10,2),
    "toolCost" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "rental_account_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_rentals_contractId_actualReturnDate_idx" ON "asset_rentals"("contractId", "actualReturnDate");

-- CreateIndex
CREATE INDEX "asset_rentals_assetId_actualReturnDate_idx" ON "asset_rentals"("assetId", "actualReturnDate");

-- CreateIndex
CREATE INDEX "asset_rentals_lastChargeDate_idx" ON "asset_rentals"("lastChargeDate");

-- CreateIndex
CREATE INDEX "rental_account_movements_contractId_createdAt_idx" ON "rental_account_movements"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "rental_account_movements_movementType_idx" ON "rental_account_movements"("movementType");

-- CreateIndex
CREATE INDEX "rental_account_movements_assetRentalId_idx" ON "rental_account_movements"("assetRentalId");

-- CreateIndex
CREATE INDEX "asset_usages_rentalId_date_idx" ON "asset_usages"("rentalId", "date");

-- CreateIndex
CREATE INDEX "asset_usages_status_processedAt_idx" ON "asset_usages"("status", "processedAt");

-- CreateIndex
CREATE INDEX "assets_trackingType_idx" ON "assets"("trackingType");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_quotationId_key" ON "rental_contracts"("quotationId");

-- CreateIndex
CREATE INDEX "rental_contracts_tenantId_businessUnitId_status_idx" ON "rental_contracts"("tenantId", "businessUnitId", "status");

-- CreateIndex
CREATE INDEX "rental_contracts_clientId_status_idx" ON "rental_contracts"("clientId", "status");

-- CreateIndex
CREATE INDEX "rental_contracts_currentCredit_idx" ON "rental_contracts"("currentCredit");

-- CreateIndex
CREATE INDEX "rental_contracts_lastAutoChargeDate_idx" ON "rental_contracts"("lastAutoChargeDate");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_tenantId_code_key" ON "rental_contracts"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "asset_usages" ADD CONSTRAINT "asset_usages_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "asset_rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_rentals" ADD CONSTRAINT "asset_rentals_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_rentals" ADD CONSTRAINT "asset_rentals_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_rentals" ADD CONSTRAINT "asset_rentals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_account_movements" ADD CONSTRAINT "rental_account_movements_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_account_movements" ADD CONSTRAINT "rental_account_movements_assetRentalId_fkey" FOREIGN KEY ("assetRentalId") REFERENCES "asset_rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_account_movements" ADD CONSTRAINT "rental_account_movements_usageReportId_fkey" FOREIGN KEY ("usageReportId") REFERENCES "asset_usages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_account_movements" ADD CONSTRAINT "rental_account_movements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
