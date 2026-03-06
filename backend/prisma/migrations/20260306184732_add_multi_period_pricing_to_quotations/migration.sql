-- AlterTable
ALTER TABLE "quotation_items" ADD COLUMN     "operatorCostPerDay" DECIMAL(15,2),
ADD COLUMN     "operatorCostPerMonth" DECIMAL(15,2),
ADD COLUMN     "operatorCostPerWeek" DECIMAL(15,2),
ADD COLUMN     "pricePerDay" DECIMAL(15,2),
ADD COLUMN     "pricePerMonth" DECIMAL(15,2),
ADD COLUMN     "pricePerWeek" DECIMAL(15,2),
ADD COLUMN     "totalPerDay" DECIMAL(15,2),
ADD COLUMN     "totalPerMonth" DECIMAL(15,2),
ADD COLUMN     "totalPerWeek" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "selectedPeriodType" TEXT;
