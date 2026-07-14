/*
  Warnings:

  - You are about to drop the `BudgetItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BudgetOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BudgetOption" DROP CONSTRAINT "BudgetOption_itemId_fkey";

-- DropTable
DROP TABLE "BudgetItem";

-- DropTable
DROP TABLE "BudgetOption";

-- DropEnum
DROP TYPE "BudgetCategory";

-- DropEnum
DROP TYPE "BudgetStatus";
