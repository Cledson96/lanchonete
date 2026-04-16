-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Ingredient_price_idx" ON "Ingredient"("price");