/*
  Warnings:

  - You are about to drop the column `businessUnitId` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `clients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_businessUnitId_fkey";

-- DropIndex
DROP INDEX "clients_businessUnitId_idx";

-- DropIndex
DROP INDEX "clients_status_idx";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "businessUnitId",
DROP COLUMN "status",
DROP COLUMN "tags";

-- CreateTable
CREATE TABLE "client_business_units" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_business_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_business_units_tenantId_idx" ON "client_business_units"("tenantId");

-- CreateIndex
CREATE INDEX "client_business_units_businessUnitId_idx" ON "client_business_units"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "client_business_units_tenantId_businessUnitId_clientId_key" ON "client_business_units"("tenantId", "businessUnitId", "clientId");

-- AddForeignKey
ALTER TABLE "client_business_units" ADD CONSTRAINT "client_business_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_business_units" ADD CONSTRAINT "client_business_units_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_business_units" ADD CONSTRAINT "client_business_units_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
