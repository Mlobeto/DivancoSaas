-- AddColumn: salePrice to assets (for retail vertical)
ALTER TABLE "assets" ADD COLUMN "salePrice" DECIMAL(12,2);

-- CreateTable: asset_rental_profiles (Rental vertical extension)
CREATE TABLE "asset_rental_profiles" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    
    -- Rental: Tipo de tracking
    "trackingType" TEXT,
    
    -- Rental: Precios de alquiler
    "pricePerHour" DECIMAL(10,2),
    "minDailyHours" DECIMAL(5,2),
    "pricePerKm" DECIMAL(10,2),
    "pricePerDay" DECIMAL(10,2),
    "pricePerWeek" DECIMAL(10,2),
    "pricePerMonth" DECIMAL(10,2),
    
    -- Rental: Costos de operador
    "operatorCostType" TEXT,
    "operatorCostRate" DECIMAL(10,2),
    
    -- Rental: Mantenimiento
    "maintenanceCostDaily" DECIMAL(10,2),
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_rental_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_rental_profiles_assetId_key" ON "asset_rental_profiles"("assetId");

-- CreateIndex
CREATE INDEX "asset_rental_profiles_tenantId_businessUnitId_idx" ON "asset_rental_profiles"("tenantId", "businessUnitId");

-- CreateIndex
CREATE INDEX "asset_rental_profiles_trackingType_idx" ON "asset_rental_profiles"("trackingType");

-- AddForeignKey
ALTER TABLE "asset_rental_profiles" ADD CONSTRAINT "asset_rental_profiles_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_rental_profiles" ADD CONSTRAINT "asset_rental_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_rental_profiles" ADD CONSTRAINT "asset_rental_profiles_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing rental data from assets to asset_rental_profiles
-- IMPORTANTE: Solo migrar assets con trackingType (que son rental)
INSERT INTO "asset_rental_profiles" (
    "id",
    "assetId",
    "tenantId",
    "businessUnitId",
    "trackingType",
    "pricePerHour",
    "minDailyHours",
    "pricePerKm",
    "pricePerDay",
    "pricePerWeek",
    "pricePerMonth",
    "operatorCostType",
    "operatorCostRate",
    "maintenanceCostDaily",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid() AS "id",
    a."id" AS "assetId",
    a."tenantId",
    a."businessUnitId",
    a."trackingType",
    a."pricePerHour",
    a."minDailyHours",
    a."pricePerKm",
    a."pricePerDay",
    a."pricePerWeek",
    a."pricePerMonth",
    a."operatorCostType",
    a."operatorCostRate",
    a."maintenanceCostDaily",
    CURRENT_TIMESTAMP AS "createdAt",
    CURRENT_TIMESTAMP AS "updatedAt"
FROM "assets" a
WHERE a."trackingType" IS NOT NULL; -- Solo assets que tengan configuración rental

-- NOTA: NO eliminamos las columnas de assets todavía (mantener compatibilidad temporal)
-- Las columnas se eliminarán en una migración futura después de validar que todo funciona
