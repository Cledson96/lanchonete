CREATE TYPE "WhatsAppConversationPriority" AS ENUM ('low', 'normal', 'high');

ALTER TABLE "WhatsAppConversation"
ADD COLUMN "ownerId" TEXT,
ADD COLUMN "priority" "WhatsAppConversationPriority" NOT NULL DEFAULT 'normal';

CREATE INDEX "WhatsAppConversation_priority_updatedAt_idx"
ON "WhatsAppConversation"("priority", "updatedAt");

CREATE INDEX "WhatsAppConversation_ownerId_idx"
ON "WhatsAppConversation"("ownerId");

ALTER TABLE "WhatsAppConversation"
ADD CONSTRAINT "WhatsAppConversation_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
