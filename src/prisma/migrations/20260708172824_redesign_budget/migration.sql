-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DUE', 'DEPOSIT', 'PAID');

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetSubcategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "estimatedCost" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DUE',
    "budgetCategoryId" INTEGER NOT NULL,

    CONSTRAINT "BudgetSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_name_key" ON "BudgetCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetSubcategory_budgetCategoryId_name_key" ON "BudgetSubcategory"("budgetCategoryId", "name");

-- AddForeignKey
ALTER TABLE "BudgetSubcategory" ADD CONSTRAINT "BudgetSubcategory_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
