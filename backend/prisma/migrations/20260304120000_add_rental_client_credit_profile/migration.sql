-- CreateTable
CREATE TABLE "rental_client_credit_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "credit_limit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_limit_days" INTEGER NOT NULL DEFAULT 0,
    "requires_owner_approval_on_exceed" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "rental_client_credit_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rental_client_credit_profiles_tenant_id_business_unit_id_cl_key"
ON "rental_client_credit_profiles"("tenant_id", "business_unit_id", "client_id");

-- CreateIndex
CREATE INDEX "rental_client_credit_profiles_tenant_id_business_unit_id_idx"
ON "rental_client_credit_profiles"("tenant_id", "business_unit_id");

-- CreateIndex
CREATE INDEX "rental_client_credit_profiles_client_id_idx"
ON "rental_client_credit_profiles"("client_id");

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles"
ADD CONSTRAINT "rental_client_credit_profiles_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles"
ADD CONSTRAINT "rental_client_credit_profiles_business_unit_id_fkey"
FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles"
ADD CONSTRAINT "rental_client_credit_profiles_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_client_credit_profiles"
ADD CONSTRAINT "rental_client_credit_profiles_updated_by_fkey"
FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
