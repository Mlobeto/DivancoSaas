-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "requestMetadata" JSONB,
ADD COLUMN     "requestStatus" TEXT,
ADD COLUMN     "requestType" TEXT;

-- CreateIndex
CREATE INDEX "chat_rooms_requestType_requestStatus_idx" ON "chat_rooms"("requestType", "requestStatus");
