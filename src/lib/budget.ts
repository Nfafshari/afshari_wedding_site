/**
 * Pure budget math, shared by the budget page and the planner's budget card.
 *
 * Parameters are structural rather than the `BudgetCategory` type exported from
 * `budget/page.tsx`: keeping `lib/` from importing `app/` avoids dragging a server
 * page module into a client component just to borrow a type.
 */

type SubcategoryLike = {
  estimatedCost: number;
  paidAmount: number;
};

type CategoryLike = {
  name: string;
  budgetSubcategories: SubcategoryLike[];
};

export type CategoryTotals = {
  estimated: number;
  paid: number;
  balance: number;
};

export function getCategoryTotals (category: { budgetSubcategories: SubcategoryLike[] }): CategoryTotals {
  const estimated = category.budgetSubcategories.reduce((sum, sub) => sum + sub.estimatedCost, 0);
  const paid = category.budgetSubcategories.reduce((sum, sub) => sum + sub.paidAmount, 0);

  return { estimated, paid, balance: estimated - paid };
}

export type BudgetSlice = {
  /** Category name, or "Other" for the folded tail. */
  name: string;
  estimated: number;
  isOther: boolean;
};

export const OTHER_SLICE_NAME = 'Other';

/**
 * Rank categories by estimated cost and fold everything past `limit` into a single
 * "Other" slice.
 *
 * The pie this feeds is capped at 6 segments by the viz rules, so the tail folds
 * rather than growing a 7th colour. Categories costing nothing are dropped outright:
 * a zero-value slice draws nothing but still claims a legend row.
 */
export function getTopCategoriesWithOther (categories: CategoryLike[], limit = 5): BudgetSlice[] {
  const ranked = categories
    .map((category) => ({
      name: category.name,
      estimated: getCategoryTotals(category).estimated,
      isOther: false,
    }))
    .filter((slice) => slice.estimated > 0)
    // Ties on cost are common (several categories at the same round number), so break
    // on name — otherwise equal slices can swap places between renders.
    .sort((a, b) => b.estimated - a.estimated || a.name.localeCompare(b.name));

  const top = ranked.slice(0, limit);
  const tail = ranked.slice(limit);

  if (tail.length === 0) return top;

  return [
    ...top,
    {
      name: OTHER_SLICE_NAME,
      estimated: tail.reduce((sum, slice) => sum + slice.estimated, 0),
      isOther: true,
    },
  ];
}
