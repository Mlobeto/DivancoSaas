-- ============================================================
-- Migration: Expand Decimal precision for monetary price fields
-- Reason: Decimal(10,2) allows max ~99,999,999.99 which overflows
--         for Colombian Pesos (COP) where machinery prices routinely
--         exceed 100,000,000 COP/month.
-- New precision: Decimal(15,2) → max 9,999,999,999,999.99
-- ============================================================

-- ─── assets ────────────────────────────────────────────────
ALTER TABLE "assets" ALTER COLUMN "pricePerHour"         TYPE DECIMAL(15,2);
ALTER TABLE "assets" ALTER COLUMN "pricePerKm"           TYPE DECIMAL(15,2);
ALTER TABLE "assets" ALTER COLUMN "pricePerDay"          TYPE DECIMAL(15,2);
ALTER TABLE "assets" ALTER COLUMN "pricePerWeek"         TYPE DECIMAL(15,2);
ALTER TABLE "assets" ALTER COLUMN "pricePerMonth"        TYPE DECIMAL(15,2);
ALTER TABLE "assets" ALTER COLUMN "operatorCostRate"     TYPE DECIMAL(15,2);
ALTER TABLE "assets" ALTER COLUMN "maintenanceCostDaily" TYPE DECIMAL(15,2);

-- ─── asset_rental_profiles ─────────────────────────────────
ALTER TABLE "asset_rental_profiles" ALTER COLUMN "pricePerHour"         TYPE DECIMAL(15,2);
ALTER TABLE "asset_rental_profiles" ALTER COLUMN "pricePerKm"           TYPE DECIMAL(15,2);
ALTER TABLE "asset_rental_profiles" ALTER COLUMN "pricePerDay"          TYPE DECIMAL(15,2);
ALTER TABLE "asset_rental_profiles" ALTER COLUMN "pricePerWeek"         TYPE DECIMAL(15,2);
ALTER TABLE "asset_rental_profiles" ALTER COLUMN "pricePerMonth"        TYPE DECIMAL(15,2);
ALTER TABLE "asset_rental_profiles" ALTER COLUMN "operatorCostRate"     TYPE DECIMAL(15,2);
ALTER TABLE "asset_rental_profiles" ALTER COLUMN "maintenanceCostDaily" TYPE DECIMAL(15,2);

-- ─── asset_usages ──────────────────────────────────────────
ALTER TABLE "asset_usages" ALTER COLUMN "machineryCost" TYPE DECIMAL(15,2);
ALTER TABLE "asset_usages" ALTER COLUMN "operatorCost"  TYPE DECIMAL(15,2);
ALTER TABLE "asset_usages" ALTER COLUMN "totalCost"     TYPE DECIMAL(15,2);

-- ─── quotation_items ───────────────────────────────────────
ALTER TABLE "quotation_items" ALTER COLUMN "unitPrice"              TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "total"                  TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "calculatedUnitPrice"    TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "operatorCost"           TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "calculatedOperatorCost" TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "basePrice"              TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "operatorCostAmount"     TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "maintenanceCost"        TYPE DECIMAL(15,2);
ALTER TABLE "quotation_items" ALTER COLUMN "discount"               TYPE DECIMAL(15,2);

-- ─── rental_account_movements ──────────────────────────────
ALTER TABLE "rental_account_movements" ALTER COLUMN "machineryCost" TYPE DECIMAL(15,2);
ALTER TABLE "rental_account_movements" ALTER COLUMN "operatorCost"  TYPE DECIMAL(15,2);
ALTER TABLE "rental_account_movements" ALTER COLUMN "toolCost"      TYPE DECIMAL(15,2);
