/**
 * Pure budget math, shared by the budget page and the planner's budget card.
 *
 * Parameters are structural rather than the `BudgetCategory` type exported from
 * `budget/page.tsx`: keeping `lib/` from importing `app/` avoids dragging a server
 * page module into a client component just to borrow a type.
 */

import type { BudgetStatus } from '@/generated/prisma/enums';

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

/**
 * A category's status from its line items: paid once every one is paid, deposit paid
 * once anything has been paid, otherwise due. An empty category is due.
 */
export function getCategoryStatus (lineItems: { status: BudgetStatus; paidAmount: number }[]): BudgetStatus {
  if (lineItems.length > 0 && lineItems.every((item) => item.status === 'PAID')) return 'PAID';
  if (lineItems.some((item) => item.status !== 'DUE' || item.paidAmount > 0)) return 'DEPOSIT';
  return 'DUE';
}

export type BudgetLimits = { target: number; cap: number };

/** The couple's limits: what they aim to spend, and what they won't go past. Read by the Budget page and the Dashboard. */
export const BUDGET_LIMITS: BudgetLimits = { target: 15000, cap: 20000 };

/**
 * Where the estimate sits against the couple's limits, and by how much: over the cap,
 * over the target only, or under the target (amount = what's left). Landing exactly on
 * a limit is not over it.
 */
export function budgetLimitState (estimated: number, { target, cap }: BudgetLimits) {
  if (estimated > cap) return { state: 'over-cap', amount: estimated - cap } as const;
  if (estimated > target) return { state: 'over-target', amount: estimated - target } as const;
  return { state: 'under', amount: target - estimated } as const;
}

/**
 * The bar's full width in dollars: a little past the larger of the estimate and the cap,
 * so an estimate over the cap still shows its overflow and the cap tick never sits on the edge.
 */
export function limitBarScale (estimated: number, cap: number) {
  return Math.max(estimated, cap) * 1.05;
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
 * The Dashboard's budget card shows at most 6 bars, so the tail folds rather than
 * growing the card. Categories costing nothing are dropped outright: a zero-value
 * bar draws nothing but still claims a row.
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
