-- AlterTable
ALTER TABLE "quotation_items" ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "discount" DECIMAL(10,2),
ADD COLUMN     "discountReason" TEXT,
ADD COLUMN     "maintenanceCost" DECIMAL(10,2),
ADD COLUMN     "operatorCostAmount" DECIMAL(10,2),
ADD COLUMN     "operatorCostType" TEXT,
ADD COLUMN     "rentalPeriodType" TEXT,
ADD COLUMN     "standbyHours" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "estimatedDays" INTEGER,
ADD COLUMN     "estimatedEndDate" TIMESTAMP(3),
ADD COLUMN     "estimatedStartDate" TIMESTAMP(3),
ADD COLUMN     "quotationType" TEXT NOT NULL DEFAULT 'time_based',
ADD COLUMN     "serviceDescription" TEXT;
