-- MenuItemIngredient: change PK from menuItemId to separate id column
ALTER TABLE "MenuItemIngredient" DROP CONSTRAINT "MenuItemIngredient_pkey";
ALTER TABLE "MenuItemIngredient" ADD COLUMN "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "MenuItemIngredient" ADD PRIMARY KEY ("id");
ALTER TABLE "MenuItemIngredient" ALTER COLUMN "menuItemId" DROP DEFAULT;

-- OrderItemIngredient: change PK from orderItemId to separate id column
ALTER TABLE "OrderItemIngredient" DROP CONSTRAINT "OrderItemIngredient_pkey";
ALTER TABLE "OrderItemIngredient" ADD COLUMN "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "OrderItemIngredient" ADD PRIMARY KEY ("id");
ALTER TABLE "OrderItemIngredient" ALTER COLUMN "orderItemId" DROP DEFAULT;

-- ComandaEntryIngredient: change PK from comandaEntryId to separate id column
ALTER TABLE "ComandaEntryIngredient" DROP CONSTRAINT "ComandaEntryIngredient_pkey";
ALTER TABLE "ComandaEntryIngredient" ADD COLUMN "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "ComandaEntryIngredient" ADD PRIMARY KEY ("id");
ALTER TABLE "ComandaEntryIngredient" ALTER COLUMN "comandaEntryId" DROP DEFAULT;