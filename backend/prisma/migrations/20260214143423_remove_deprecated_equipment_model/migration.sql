/*
  Warnings:

  - You are about to drop the `equipment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_businessUnitId_fkey";

-- DropForeignKey
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_tenantId_fkey";

-- DropTable
DROP TABLE "equipment";

-- DropEnum
DROP TYPE "EquipmentCondition";

-- DropEnum
DROP TYPE "EquipmentStatus";
