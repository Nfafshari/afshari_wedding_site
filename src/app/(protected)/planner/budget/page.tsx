import { prisma } from "@/lib/prisma";
import Budget from "./client";

/**
 * Render per request rather than at build time.
 *
 * A Prisma query alone does NOT make a route dynamic — Next will prerender this
 * page during `next build`, where no search params exist. The sort controls read
 * `?sort`/`?dir` via useSearchParams, which then forces a client-side bailout and
 * fails the build unless the subtree sits in a <Suspense> boundary.
 *
 * A private planner over live financial data has nothing to gain from being
 * prerendered, so declaring it dynamic is both the fix and the honest description
 * of what this page is.
 */
export const dynamic = 'force-dynamic';

export async function getCategories () {
  const categories = await prisma.budgetCategory.findMany({
    include: {
      budgetSubcategories: {
        // Ties on cost are common (several rows at $0), so break on id — otherwise
        // Postgres is free to return them in a different order each query.
        orderBy: [{ estimatedCost: "asc" }, { id: "asc" }]
      },
     },
    // `order` is currently @default(0) on every row, so on its own this sorts
    // nothing and the row order is whatever Postgres feels like. id keeps it stable.
    orderBy: [{ order: "asc" }, { id: "asc" }]
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