/*
  Warnings:

  - A unique constraint covering the columns `[businessUnitId,code]` on the table `assets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `assets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('MACHINERY', 'IMPLEMENT', 'VEHICLE', 'TOOL');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "customData" JSONB,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "asset_templates" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "requiresPreventiveMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_templates_businessUnitId_idx" ON "asset_templates"("businessUnitId");

-- CreateIndex
CREATE INDEX "asset_templates_category_idx" ON "asset_templates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "asset_templates_businessUnitId_name_key" ON "asset_templates"("businessUnitId", "name");

-- CreateIndex
CREATE INDEX "assets_templateId_idx" ON "assets"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_businessUnitId_code_key" ON "assets"("businessUnitId", "code");

-- AddForeignKey
ALTER TABLE "asset_templates" ADD CONSTRAINT "asset_templates_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "asset_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
