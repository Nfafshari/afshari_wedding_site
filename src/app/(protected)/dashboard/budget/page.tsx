import { prisma } from "@/lib/prisma";
import Budget from "./client";

export async function getCategories () {
  const categories = await prisma.budgetCategory.findMany({
    include: { 
      budgetSubcategories: {
        orderBy: { estimatedCost: "asc" }
      },
     },
    orderBy: { order: "asc" }
  });

  // Map the raw Prisma rows into a plain, serializable shape for the client:
  // Decimal -> number here at the boundary so components never touch Decimal.
  return categories.map((budgetCategory) => ({
    id: budgetCategory.id,
    name: budgetCategory.name,
    budgetSubCategories: budgetCategory.budgetSubcategories.map((budgetSubCategory) => ({
      id: budgetSubCategory.id,
      name: budgetSubCategory.name,
      estimatedCost: budgetSubCategory.estimatedCost.toNumber(),
      paidAmount: budgetSubCategory.paidAmount.toNumber(),
      status: budgetSubCategory.status,
      budgetCategoryId: budgetSubCategory.budgetCategoryId
    })),
  }));
}

export type BudgetCategory = Awaited<ReturnType<typeof getCategories>>[number]
export type BudgetSubCategory = BudgetCategory["budgetSubCategories"][number]

export default async function BudgetWrapper () {
  const budgetCategories = await getCategories();

  return (
    <Budget budgetCategories={budgetCategories}/>
  );
}