-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "purchaseOrderId" TEXT,
ADD COLUMN     "purchasePrice" DECIMAL(65,30),
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "assetId" TEXT,
ADD COLUMN     "assetTemplateId" TEXT,
ADD COLUMN     "createsAsset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "generatedAssetId" TEXT;

-- CreateIndex
CREATE INDEX "assets_purchaseOrderId_idx" ON "assets"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "assets_supplierId_idx" ON "assets"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_order_items_assetTemplateId_idx" ON "purchase_order_items"("assetTemplateId");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_assetTemplateId_fkey" FOREIGN KEY ("assetTemplateId") REFERENCES "asset_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_generatedAssetId_fkey" FOREIGN KEY ("generatedAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
