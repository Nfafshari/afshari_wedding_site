/*
  Adds a price to registry items. Additive only: nullable, so existing items stay valid
  until the couple edits them, and the planner's form requires it from now on.
*/
-- AlterTable
ALTER TABLE "RegistryItem" ADD COLUMN     "price" DECIMAL(10,2);
