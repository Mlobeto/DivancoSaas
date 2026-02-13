/*
  Warnings:

  - You are about to drop the column `creditAfter` on the `rental_account_movements` table. All the data in the column will be lost.
  - You are about to drop the column `creditBefore` on the `rental_account_movements` table. All the data in the column will be lost.
  - You are about to drop the column `alertAmount` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `alertTriggered` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `currentCredit` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `initialCredit` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `lastAlertSent` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `lastStatementSent` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `nextStatementDue` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `statementFrequency` on the `rental_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `totalReloaded` on the `rental_contracts` table. All the data in the column will be lost.
  - Added the required column `balanceAfter` to the `rental_account_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceBefore` to the `rental_account_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientAccountId` to the `rental_account_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientAccountId` to the `rental_contracts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rental_account_movements" DROP CONSTRAINT "rental_account_movements_contractId_fkey";

-- DropIndex
DROP INDEX "rental_contracts_currentCredit_idx";

-- AlterTable
ALTER TABLE "rental_account_movements" DROP COLUMN "creditAfter",
DROP COLUMN "creditBefore",
ADD COLUMN     "balanceAfter" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "balanceBefore" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "clientAccountId" TEXT NOT NULL,
ALTER COLUMN "contractId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rental_contracts" DROP COLUMN "alertAmount",
DROP COLUMN "alertTriggered",
DROP COLUMN "currentCredit",
DROP COLUMN "initialCredit",
DROP COLUMN "lastAlertSent",
DROP COLUMN "lastStatementSent",
DROP COLUMN "nextStatementDue",
DROP COLUMN "statementFrequency",
DROP COLUMN "totalReloaded",
ADD COLUMN     "clientAccountId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalConsumed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalReloaded" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "alertAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "alertTriggered" BOOLEAN NOT NULL DEFAULT false,
    "lastAlertSent" TIMESTAMP(3),
    "statementFrequency" TEXT,
    "lastStatementSent" TIMESTAMP(3),
    "nextStatementDue" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_clientId_key" ON "client_accounts"("clientId");

-- CreateIndex
CREATE INDEX "client_accounts_tenantId_idx" ON "client_accounts"("tenantId");

-- CreateIndex
CREATE INDEX "client_accounts_balance_idx" ON "client_accounts"("balance");

-- CreateIndex
CREATE INDEX "rental_account_movements_clientAccountId_createdAt_idx" ON "rental_account_movements"("clientAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "rental_contracts_clientAccountId_idx" ON "rental_contracts"("clientAccountId");

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_account_movements" ADD CONSTRAINT "rental_account_movements_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_account_movements" ADD CONSTRAINT "rental_account_movements_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
