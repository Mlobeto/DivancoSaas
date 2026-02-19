-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layoutConfig" JSONB NOT NULL DEFAULT '{"format":"A4","orientation":"portrait","margins":{"top":20,"right":20,"bottom":20,"left":20}}',
    "sections" JSONB NOT NULL DEFAULT '[]',
    "htmlContent" TEXT,
    "customStyles" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emailType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT NOT NULL,
    "fromName" TEXT,
    "replyToEmail" TEXT,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "preheader" TEXT,
    "useBranding" BOOLEAN NOT NULL DEFAULT true,
    "customColors" JSONB,
    "defaultAttachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_permissions_userId_businessUnitId_idx" ON "user_permissions"("userId", "businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_businessUnitId_permissionId_key" ON "user_permissions"("userId", "businessUnitId", "permissionId");

-- CreateIndex
CREATE INDEX "document_templates_tenantId_businessUnitId_idx" ON "document_templates"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "document_templates_documentType_isActive_idx" ON "document_templates"("documentType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_businessUnitId_documentType_isDefault_key" ON "document_templates"("businessUnitId", "documentType", "isDefault");

-- CreateIndex
CREATE INDEX "email_templates_tenantId_businessUnitId_idx" ON "email_templates"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "email_templates_emailType_isActive_idx" ON "email_templates"("emailType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_businessUnitId_emailType_isDefault_key" ON "email_templates"("businessUnitId", "emailType", "isDefault");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
