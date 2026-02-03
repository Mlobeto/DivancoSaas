-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('SENDGRID', 'META_WHATSAPP', 'TWILIO_SMS', 'STRIPE', 'MERCADOPAGO', 'WOMPI', 'AWS_S3', 'CLOUDINARY', 'SIIGO', 'FACTURAMA', 'GOOGLE_MAPS', 'SENDGRID_ANALYTICS');

-- CreateTable
CREATE TABLE "integration_credentials" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "provider" "IntegrationType" NOT NULL,
    "credentials" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastValidated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integration_credentials_businessUnitId_idx" ON "integration_credentials"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_businessUnitId_provider_key" ON "integration_credentials"("businessUnitId", "provider");

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
