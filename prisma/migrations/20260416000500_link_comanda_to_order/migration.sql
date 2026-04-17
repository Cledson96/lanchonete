ALTER TABLE "Comanda"
ADD COLUMN "orderId" TEXT;

CREATE UNIQUE INDEX "Comanda_orderId_key" ON "Comanda"("orderId");

ALTER TABLE "Comanda"
ADD CONSTRAINT "Comanda_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
