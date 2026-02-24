-- AlterTable
ALTER TABLE "asset_templates" ADD COLUMN     "rentalPricing" JSONB;

-- AlterTable
ALTER TABLE "business_unit_branding" ADD COLUMN     "contactInfo" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "footerConfig" SET DEFAULT '{"showContactInfo":true,"showDisclaimer":false,"textAlign":"center","height":60}';
