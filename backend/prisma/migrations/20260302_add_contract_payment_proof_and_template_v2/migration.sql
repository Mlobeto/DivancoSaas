-- AlterTable: RentalContract - Add payment proof fields
ALTER TABLE "rental_contracts" ADD COLUMN "paymentType" TEXT,
ADD COLUMN "paymentProofUrl" TEXT,
ADD COLUMN "paymentDetails" JSONB,
ADD COLUMN "paymentVerifiedBy" TEXT,
ADD COLUMN "paymentVerifiedAt" TIMESTAMP(3);

-- AlterTable: Template - Add new fields
ALTER TABLE "templates" ADD COLUMN "version" TEXT NOT NULL DEFAULT '1.0',
ADD COLUMN "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requiresPaymentProof" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowLocalPayment" BOOLEAN NOT NULL DEFAULT true;

-- Temporarily add a new JSONB column
ALTER TABLE "templates" ADD COLUMN "content_json" JSONB;

-- Migrate existing HTML content to JSON structure (legacy templates)
UPDATE "templates" 
SET "content_json" = jsonb_build_object(
  'version', '1.0',
  'sections', jsonb_build_array(
    jsonb_build_object(
      'id', 'legacy_content',
      'type', 'custom_html',
      'order', 1,
      'title', 'Content',
      'isRequired', true,
      'config', jsonb_build_object(
        'html', "content"
      )
    )
  )
);

-- Drop the old content column and rename the new one
ALTER TABLE "templates" DROP COLUMN "content";
ALTER TABLE "templates" RENAME COLUMN "content_json" TO "content";

-- Make content NOT NULL
ALTER TABLE "templates" ALTER COLUMN "content" SET NOT NULL;

-- Comment explaining the migration
COMMENT ON COLUMN "rental_contracts"."paymentType" IS 'Type of payment: online | local';
COMMENT ON COLUMN "rental_contracts"."paymentProofUrl" IS 'Azure Blob URL of uploaded payment proof';
COMMENT ON COLUMN "rental_contracts"."paymentDetails" IS 'JSON with transaction details: {transactionRef, paymentDate, paidAt, notes, receivedBy}';
COMMENT ON COLUMN "templates"."content" IS 'JSON structure with modular sections for v2.0 templates';
