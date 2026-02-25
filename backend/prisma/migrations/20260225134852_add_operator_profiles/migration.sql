-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OperatorType" AS ENUM ('HEAVY_MACHINERY', 'VEHICLE', 'EQUIPMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "OperatorDocumentType" AS ENUM ('DRIVERS_LICENSE', 'MACHINERY_LICENSE', 'TRAINING_CERTIFICATE', 'HEALTH_CERTIFICATE', 'INSURANCE', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('ASSET_START', 'ASSET_END', 'HOUROMETER', 'INCIDENT', 'WORK_PROGRESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('FUEL', 'TOLL', 'PARKING', 'FOOD', 'TRANSPORT', 'ACCOMMODATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateTable
CREATE TABLE "operator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "employeeCode" TEXT,
    "status" "OperatorStatus" NOT NULL DEFAULT 'ACTIVE',
    "hireDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "operatorType" "OperatorType" NOT NULL DEFAULT 'GENERAL',
    "defaultRateType" TEXT,
    "defaultRate" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_documents" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "OperatorDocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "operator_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "rateType" TEXT,
    "rate" DECIMAL(10,2),
    "allowExpenses" BOOLEAN NOT NULL DEFAULT true,
    "dailyExpenseLimit" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "operator_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_daily_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "workHours" DECIMAL(5,2),
    "hourMeter" DECIMAL(10,2),
    "odometer" DECIMAL(10,2),
    "fuelLevel" TEXT,
    "locationLat" DECIMAL(10,7),
    "locationLon" DECIMAL(10,7),
    "locationName" TEXT,
    "assetCondition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,
    "incidentReported" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "operator_daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_photos" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "takenAt" TIMESTAMP(3) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_expenses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receiptUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operator_profiles_userId_key" ON "operator_profiles"("userId");

-- CreateIndex
CREATE INDEX "operator_profiles_tenantId_businessUnitId_idx" ON "operator_profiles"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "operator_profiles_userId_idx" ON "operator_profiles"("userId");

-- CreateIndex
CREATE INDEX "operator_profiles_status_idx" ON "operator_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "operator_profiles_tenantId_businessUnitId_document_key" ON "operator_profiles"("tenantId", "businessUnitId", "document");

-- CreateIndex
CREATE INDEX "operator_documents_profileId_idx" ON "operator_documents"("profileId");

-- CreateIndex
CREATE INDEX "operator_documents_expiryDate_idx" ON "operator_documents"("expiryDate");

-- CreateIndex
CREATE INDEX "operator_assignments_profileId_idx" ON "operator_assignments"("profileId");

-- CreateIndex
CREATE INDEX "operator_assignments_rentalContractId_idx" ON "operator_assignments"("rentalContractId");

-- CreateIndex
CREATE INDEX "operator_assignments_assetId_idx" ON "operator_assignments"("assetId");

-- CreateIndex
CREATE INDEX "operator_assignments_status_idx" ON "operator_assignments"("status");

-- CreateIndex
CREATE INDEX "operator_daily_reports_profileId_idx" ON "operator_daily_reports"("profileId");

-- CreateIndex
CREATE INDEX "operator_daily_reports_date_idx" ON "operator_daily_reports"("date");

-- CreateIndex
CREATE INDEX "operator_daily_reports_syncStatus_idx" ON "operator_daily_reports"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "operator_daily_reports_assignmentId_date_key" ON "operator_daily_reports"("assignmentId", "date");

-- CreateIndex
CREATE INDEX "operator_photos_reportId_idx" ON "operator_photos"("reportId");

-- CreateIndex
CREATE INDEX "operator_expenses_profileId_idx" ON "operator_expenses"("profileId");

-- CreateIndex
CREATE INDEX "operator_expenses_assignmentId_idx" ON "operator_expenses"("assignmentId");

-- CreateIndex
CREATE INDEX "operator_expenses_status_idx" ON "operator_expenses"("status");

-- CreateIndex
CREATE INDEX "operator_expenses_date_idx" ON "operator_expenses"("date");

-- AddForeignKey
ALTER TABLE "operator_profiles" ADD CONSTRAINT "operator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_profiles" ADD CONSTRAINT "operator_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_profiles" ADD CONSTRAINT "operator_profiles_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_documents" ADD CONSTRAINT "operator_documents_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "operator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_assignments" ADD CONSTRAINT "operator_assignments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "operator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_assignments" ADD CONSTRAINT "operator_assignments_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "rental_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_assignments" ADD CONSTRAINT "operator_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_daily_reports" ADD CONSTRAINT "operator_daily_reports_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "operator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_daily_reports" ADD CONSTRAINT "operator_daily_reports_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "operator_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_daily_reports" ADD CONSTRAINT "operator_daily_reports_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_photos" ADD CONSTRAINT "operator_photos_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "operator_daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_expenses" ADD CONSTRAINT "operator_expenses_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "operator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_expenses" ADD CONSTRAINT "operator_expenses_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "operator_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
