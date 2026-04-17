CREATE TYPE "OrderItemUnitStatus" AS ENUM (
  'novo',
  'em_preparo',
  'pronto',
  'entregue',
  'cancelado'
);

CREATE TABLE "OrderItemUnit" (
  "id" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "comandaEntryId" TEXT,
  "sequence" INTEGER NOT NULL,
  "status" "OrderItemUnitStatus" NOT NULL DEFAULT 'novo',
  "startedAt" TIMESTAMP(3),
  "readyAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrderItemUnit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderItemUnit_orderItemId_sequence_key" ON "OrderItemUnit"("orderItemId", "sequence");
CREATE INDEX "OrderItemUnit_status_createdAt_idx" ON "OrderItemUnit"("status", "createdAt");
CREATE INDEX "OrderItemUnit_comandaEntryId_idx" ON "OrderItemUnit"("comandaEntryId");

ALTER TABLE "OrderItemUnit"
ADD CONSTRAINT "OrderItemUnit_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItemUnit"
ADD CONSTRAINT "OrderItemUnit_comandaEntryId_fkey"
FOREIGN KEY ("comandaEntryId") REFERENCES "ComandaEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
