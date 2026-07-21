/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `RegistryItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RegistryItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "RegistryClaim_itemId_idx" ON "RegistryClaim"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistryItem_name_key" ON "RegistryItem"("name");
