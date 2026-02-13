-- Add auto-pricing fields to quotation_items table
ALTER TABLE "quotation_items" 
  ADD COLUMN "calculatedUnitPrice" DECIMAL(10,2),
  ADD COLUMN "priceOverridden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "operatorIncluded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "operatorCost" DECIMAL(10,2),
  ADD COLUMN "calculatedOperatorCost" DECIMAL(10,2);
