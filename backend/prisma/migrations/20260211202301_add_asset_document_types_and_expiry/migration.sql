/*
  Warnings:

  - Added the required column `updatedAt` to the `asset_attachments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'EXPIRED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "asset_attachments" ADD COLUMN     "alertDays" INTEGER,
ADD COLUMN     "documentTypeId" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "issueDate" TIMESTAMP(3),
ADD COLUMN     "lastAlertSent" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "AttachmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "asset_document_types" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultAlertDays" INTEGER,
    "color" TEXT,
    "icon" TEXT,
    "requiresFile" BOOLEAN NOT NULL DEFAULT true,
    "requiresExpiry" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_document_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_document_types_businessUnitId_idx" ON "asset_document_types"("businessUnitId");

-- CreateIndex
CREATE INDEX "asset_document_types_isActive_idx" ON "asset_document_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "asset_document_types_businessUnitId_code_key" ON "asset_document_types"("businessUnitId", "code");

-- CreateIndex
CREATE INDEX "asset_attachments_expiryDate_idx" ON "asset_attachments"("expiryDate");

-- CreateIndex
CREATE INDEX "asset_attachments_status_idx" ON "asset_attachments"("status");

-- CreateIndex
CREATE INDEX "asset_attachments_documentTypeId_idx" ON "asset_attachments"("documentTypeId");

-- AddForeignKey
ALTER TABLE "asset_attachments" ADD CONSTRAINT "asset_attachments_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "asset_document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_document_types" ADD CONSTRAINT "asset_document_types_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
