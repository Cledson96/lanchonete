-- CreateEnum
CREATE TYPE "MenuItemKind" AS ENUM ('simples', 'combo');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "kind" "MenuItemKind" NOT NULL DEFAULT 'simples';

-- CreateTable
CREATE TABLE "MenuItemComponent" (
    "comboMenuItemId" TEXT NOT NULL,
    "componentMenuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItemComponent_pkey" PRIMARY KEY ("comboMenuItemId","componentMenuItemId")
);

-- AddForeignKey
ALTER TABLE "MenuItemComponent" ADD CONSTRAINT "MenuItemComponent_comboMenuItemId_fkey" FOREIGN KEY ("comboMenuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemComponent" ADD CONSTRAINT "MenuItemComponent_componentMenuItemId_fkey" FOREIGN KEY ("componentMenuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
