-- Add signatureRequestId and signatureProvider to RentalContract
ALTER TABLE "rental_contracts" 
ADD COLUMN "signatureRequestId" TEXT,
ADD COLUMN "signatureProvider" TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "rental_contracts_signatureRequestId_idx" ON "rental_contracts"("signatureRequestId");
