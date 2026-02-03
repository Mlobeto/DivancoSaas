-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('WHATSAPP', 'WEB', 'MOBILE', 'API');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "business_unit_channel_configs" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "allowedIntents" JSONB NOT NULL DEFAULT '[]',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_unit_channel_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intent_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultModule" TEXT NOT NULL,
    "defaultAction" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intent_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_unit_intents" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "module" TEXT,
    "action" TEXT,
    "requiredPermission" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_unit_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_channel_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_channel_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_queue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "intent" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_unit_channel_configs_businessUnitId_idx" ON "business_unit_channel_configs"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "business_unit_channel_configs_businessUnitId_channel_key" ON "business_unit_channel_configs"("businessUnitId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "intent_definitions_name_key" ON "intent_definitions"("name");

-- CreateIndex
CREATE INDEX "business_unit_intents_businessUnitId_idx" ON "business_unit_intents"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "business_unit_intents_businessUnitId_intentId_key" ON "business_unit_intents"("businessUnitId", "intentId");

-- CreateIndex
CREATE INDEX "user_channel_identities_userId_idx" ON "user_channel_identities"("userId");

-- CreateIndex
CREATE INDEX "user_channel_identities_externalId_channel_idx" ON "user_channel_identities"("externalId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "user_channel_identities_userId_businessUnitId_channel_exter_key" ON "user_channel_identities"("userId", "businessUnitId", "channel", "externalId");

-- CreateIndex
CREATE INDEX "event_queue_status_createdAt_idx" ON "event_queue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "event_queue_tenantId_idx" ON "event_queue"("tenantId");

-- CreateIndex
CREATE INDEX "event_queue_userId_idx" ON "event_queue"("userId");

-- AddForeignKey
ALTER TABLE "business_unit_channel_configs" ADD CONSTRAINT "business_unit_channel_configs_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_unit_intents" ADD CONSTRAINT "business_unit_intents_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_unit_intents" ADD CONSTRAINT "business_unit_intents_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "intent_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_channel_identities" ADD CONSTRAINT "user_channel_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_channel_identities" ADD CONSTRAINT "user_channel_identities_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_queue" ADD CONSTRAINT "event_queue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_queue" ADD CONSTRAINT "event_queue_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_queue" ADD CONSTRAINT "event_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
