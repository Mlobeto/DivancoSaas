/*
  Warnings:

  - A unique constraint covering the columns `[clientReviewToken]` on the table `quotations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receiptToken]` on the table `rental_contracts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[signatureToken]` on the table `rental_contracts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "rental_contracts_signatureRequestId_idx";

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "clientMessage" TEXT,
ADD COLUMN     "clientRespondedAt" TIMESTAMP(3),
ADD COLUMN     "clientResponse" TEXT,
ADD COLUMN     "clientReviewToken" TEXT;

-- AlterTable
ALTER TABLE "rental_contracts" ADD COLUMN     "activationMethod" TEXT,
ADD COLUMN     "receiptToken" TEXT,
ADD COLUMN     "receiptUploadedAt" TIMESTAMP(3),
ADD COLUMN     "signatureCompletedAt" TIMESTAMP(3),
ADD COLUMN     "signatureRequestedAt" TIMESTAMP(3),
ADD COLUMN     "signatureStatus" TEXT,
ADD COLUMN     "signatureToken" TEXT;

-- CreateTable
CREATE TABLE "contract_clauses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "applicableAssetTypes" TEXT[],
    "requiresOperator" BOOLEAN NOT NULL DEFAULT false,
    "minimumValue" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_clauses_tenantId_businessUnitId_isActive_idx" ON "contract_clauses"("tenantId", "businessUnitId", "isActive");

-- CreateIndex
CREATE INDEX "contract_clauses_tenantId_category_idx" ON "contract_clauses"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "contract_clauses_tenantId_code_key" ON "contract_clauses"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_clientReviewToken_key" ON "quotations"("clientReviewToken");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_receiptToken_key" ON "rental_contracts"("receiptToken");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_signatureToken_key" ON "rental_contracts"("signatureToken");

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
