/*
  Warnings:

  - You are about to drop the column `defaultWeight` on the `asset_templates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asset_templates" DROP COLUMN "defaultWeight",
ADD COLUMN     "requiresWeight" BOOLEAN NOT NULL DEFAULT false;
