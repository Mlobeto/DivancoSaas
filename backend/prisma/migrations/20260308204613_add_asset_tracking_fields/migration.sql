-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "currentHourMeter" DECIMAL(12,2),
ADD COLUMN     "currentKm" DECIMAL(12,2),
ADD COLUMN     "documentExpiries" JSONB,
ADD COLUMN     "initialHourMeter" DECIMAL(12,2),
ADD COLUMN     "initialKm" DECIMAL(12,2),
ADD COLUMN     "minStockLevel" INTEGER;
