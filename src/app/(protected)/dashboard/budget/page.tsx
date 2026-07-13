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
    budgetSubcategories: budgetCategory.budgetSubcategories.map((budgetSubcategory) => ({
      id: budgetSubcategory.id,
      name: budgetSubcategory.name,
      estimatedCost: budgetSubcategory.estimatedCost.toNumber(),
      paidAmount: budgetSubcategory.paidAmount.toNumber(),
      status: budgetSubcategory.status,
      budgetCategoryId: budgetSubcategory.budgetCategoryId
    })),
  }));
}

export type BudgetCategory = Awaited<ReturnType<typeof getCategories>>[number]
export type BudgetSubcategory = BudgetCategory["budgetSubcategories"][number]

export default async function BudgetWrapper () {
  const budgetCategories = await getCategories();

  return (
    <Budget budgetCategories={budgetCategories}/>
  );
}