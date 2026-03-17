-- AlterTable
ALTER TABLE "maintenance_events" ADD COLUMN     "chargedTo" TEXT,
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "costAmount" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "maintenance_events_contractId_idx" ON "maintenance_events"("contractId");

-- AddForeignKey
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
