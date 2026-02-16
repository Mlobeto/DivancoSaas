/*
  Warnings:

  - You are about to drop the column `footerHtml` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `headerHtml` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `templates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "templates" DROP COLUMN "footerHtml",
DROP COLUMN "headerHtml",
DROP COLUMN "logoUrl";

-- CreateTable
CREATE TABLE "business_unit_branding" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1E40AF',
    "secondaryColor" TEXT NOT NULL DEFAULT '#64748B',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "headerConfig" JSONB NOT NULL DEFAULT '{"showLogo":true,"logoAlign":"left","showBusinessName":true,"showTaxInfo":false,"height":80}',
    "footerConfig" JSONB NOT NULL DEFAULT '{"showContactInfo":true,"showDisclaimer":false,"height":60}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_unit_branding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_unit_branding_businessUnitId_key" ON "business_unit_branding"("businessUnitId");

-- CreateIndex
CREATE INDEX "business_unit_branding_businessUnitId_idx" ON "business_unit_branding"("businessUnitId");

-- AddForeignKey
ALTER TABLE "business_unit_branding" ADD CONSTRAINT "business_unit_branding_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
