-- Remove aceito from OrderStatus enum
-- Step 1: Update any existing rows that have aceito status to em_preparo
UPDATE "Order" SET status = 'em_preparo' WHERE status = 'aceito';
UPDATE "Comanda" SET status = 'em_preparo' WHERE status = 'aceito';
UPDATE "OrderStatusEvent" SET "fromStatus" = 'em_preparo' WHERE "fromStatus" = 'aceito';
UPDATE "OrderStatusEvent" SET "toStatus" = 'em_preparo' WHERE "toStatus" = 'aceito';

-- Step 2: Drop defaults that reference the old enum type
ALTER TABLE "Order" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Comanda" ALTER COLUMN status DROP DEFAULT;

-- Step 3: Recreate the enum without aceito
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('novo', 'em_preparo', 'pronto', 'saiu_para_entrega', 'entregue', 'fechado', 'cancelado');

-- Step 4: Update columns to use the new enum type
ALTER TABLE "Order" ALTER COLUMN status TYPE "OrderStatus" USING status::text::"OrderStatus";
ALTER TABLE "Comanda" ALTER COLUMN status TYPE "OrderStatus" USING status::text::"OrderStatus";
ALTER TABLE "OrderStatusEvent" ALTER COLUMN "fromStatus" TYPE "OrderStatus" USING "fromStatus"::text::"OrderStatus";
ALTER TABLE "OrderStatusEvent" ALTER COLUMN "toStatus" TYPE "OrderStatus" USING "toStatus"::text::"OrderStatus";

-- Step 5: Restore defaults with the new enum type
ALTER TABLE "Order" ALTER COLUMN status SET DEFAULT 'novo';
ALTER TABLE "Comanda" ALTER COLUMN status SET DEFAULT 'novo';

-- Step 6: Drop the old enum
DROP TYPE "OrderStatus_old";