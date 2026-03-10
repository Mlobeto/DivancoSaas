-- AlterTable
ALTER TABLE "contract_addendums" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveredById" TEXT,
ADD COLUMN     "driverName" TEXT,
ADD COLUMN     "hasOperator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "operatorCertificationUrl" TEXT,
ADD COLUMN     "operatorDocumentationNotes" TEXT,
ADD COLUMN     "operatorInsuranceUrl" TEXT,
ADD COLUMN     "operatorLicenseUrl" TEXT,
ADD COLUMN     "preparedAt" TIMESTAMP(3),
ADD COLUMN     "preparedById" TEXT,
ADD COLUMN     "transportNotes" TEXT,
ADD COLUMN     "transportType" TEXT,
ADD COLUMN     "vehicleId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending_preparation';

-- AlterTable
ALTER TABLE "quotation_items" ADD COLUMN     "otherCosts" DECIMAL(15,2),
ADD COLUMN     "otherCostsDescription" TEXT,
ADD COLUMN     "transportCost" DECIMAL(15,2);

-- CreateIndex
CREATE INDEX "contract_addendums_deliveredAt_idx" ON "contract_addendums"("deliveredAt");

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
