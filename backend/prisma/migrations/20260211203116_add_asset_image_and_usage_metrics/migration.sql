-- AlterTable
ALTER TABLE "asset_usages" ADD COLUMN     "createdAtDevice" TIMESTAMP(3),
ADD COLUMN     "evidenceUrls" JSONB,
ADD COLUMN     "kmUsed" DECIMAL(65,30),
ADD COLUMN     "metricType" TEXT,
ADD COLUMN     "metricValue" DECIMAL(65,30),
ADD COLUMN     "syncedAt" TIMESTAMP(3),
ALTER COLUMN "hoursUsed" DROP NOT NULL;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "imageUrl" TEXT;
