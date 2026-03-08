-- AlterTable
ALTER TABLE "asset_rentals" ADD COLUMN     "addendumId" TEXT;

-- AlterTable
ALTER TABLE "client_accounts" ADD COLUMN     "activeDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "limitsOverridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overriddenAt" TIMESTAMP(3),
ADD COLUMN     "overriddenBy" TEXT,
ADD COLUMN     "overrideReason" TEXT,
ADD COLUMN     "timeLimit" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "rental_contracts" ADD COLUMN     "agreedAmount" DECIMAL(12,2),
ADD COLUMN     "agreedPeriod" INTEGER,
ADD COLUMN     "contractType" TEXT NOT NULL DEFAULT 'master',
ADD COLUMN     "totalActiveDays" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "contract_addendums" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "addendumType" TEXT NOT NULL DEFAULT 'delivery',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "items" JSONB NOT NULL,
    "estimatedCost" DECIMAL(12,2) NOT NULL,
    "actualCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estimatedDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "pdfUrl" TEXT,
    "signedPdfUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "contract_addendums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_attachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "attachmentType" TEXT NOT NULL,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "contract_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limit_change_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentCreditLimit" DECIMAL(12,2) NOT NULL,
    "currentTimeLimit" INTEGER NOT NULL,
    "requestedCreditLimit" DECIMAL(12,2),
    "requestedTimeLimit" INTEGER,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedCreditLimit" DECIMAL(12,2),
    "approvedTimeLimit" INTEGER,
    "reviewNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "limit_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_clause_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "supportedVariables" JSONB,
    "applicableAssetTypes" TEXT[],
    "applicableContractTypes" TEXT[] DEFAULT ARRAY['master', 'specific']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "contract_clause_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_addendums_contractId_idx" ON "contract_addendums"("contractId");

-- CreateIndex
CREATE INDEX "contract_addendums_tenantId_status_idx" ON "contract_addendums"("tenantId", "status");

-- CreateIndex
CREATE INDEX "contract_addendums_issueDate_idx" ON "contract_addendums"("issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "contract_addendums_tenantId_code_key" ON "contract_addendums"("tenantId", "code");

-- CreateIndex
CREATE INDEX "contract_attachments_contractId_idx" ON "contract_attachments"("contractId");

-- CreateIndex
CREATE INDEX "contract_attachments_assetId_idx" ON "contract_attachments"("assetId");

-- CreateIndex
CREATE INDEX "contract_attachments_attachmentType_idx" ON "contract_attachments"("attachmentType");

-- CreateIndex
CREATE INDEX "limit_change_requests_clientAccountId_idx" ON "limit_change_requests"("clientAccountId");

-- CreateIndex
CREATE INDEX "limit_change_requests_status_idx" ON "limit_change_requests"("status");

-- CreateIndex
CREATE INDEX "limit_change_requests_requestedAt_idx" ON "limit_change_requests"("requestedAt");

-- CreateIndex
CREATE INDEX "limit_change_requests_urgency_idx" ON "limit_change_requests"("urgency");

-- CreateIndex
CREATE INDEX "contract_clause_templates_tenantId_idx" ON "contract_clause_templates"("tenantId");

-- CreateIndex
CREATE INDEX "contract_clause_templates_tenantId_businessUnitId_idx" ON "contract_clause_templates"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "contract_clause_templates_category_idx" ON "contract_clause_templates"("category");

-- CreateIndex
CREATE INDEX "contract_clause_templates_isActive_idx" ON "contract_clause_templates"("isActive");

-- CreateIndex
CREATE INDEX "contract_clause_templates_isDefault_idx" ON "contract_clause_templates"("isDefault");

-- CreateIndex
CREATE INDEX "client_accounts_limitsOverridden_idx" ON "client_accounts"("limitsOverridden");

-- CreateIndex
CREATE INDEX "rental_contracts_contractType_idx" ON "rental_contracts"("contractType");

-- AddForeignKey
ALTER TABLE "asset_rentals" ADD CONSTRAINT "asset_rentals_addendumId_fkey" FOREIGN KEY ("addendumId") REFERENCES "contract_addendums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limit_change_requests" ADD CONSTRAINT "limit_change_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limit_change_requests" ADD CONSTRAINT "limit_change_requests_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limit_change_requests" ADD CONSTRAINT "limit_change_requests_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limit_change_requests" ADD CONSTRAINT "limit_change_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limit_change_requests" ADD CONSTRAINT "limit_change_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_templates" ADD CONSTRAINT "contract_clause_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_templates" ADD CONSTRAINT "contract_clause_templates_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_templates" ADD CONSTRAINT "contract_clause_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
