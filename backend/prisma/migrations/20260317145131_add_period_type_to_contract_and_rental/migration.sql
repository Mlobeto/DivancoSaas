-- AlterTable
ALTER TABLE "asset_rentals" ADD COLUMN     "monthlyRate" DECIMAL(10,2),
ADD COLUMN     "periodType" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "periodsElapsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quotationItemId" TEXT,
ADD COLUMN     "weeklyRate" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "rental_contracts" ADD COLUMN     "selectedPeriodType" TEXT NOT NULL DEFAULT 'daily';
