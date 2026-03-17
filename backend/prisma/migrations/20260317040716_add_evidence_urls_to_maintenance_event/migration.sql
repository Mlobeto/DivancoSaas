-- AlterTable
ALTER TABLE "maintenance_events" ADD COLUMN     "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
