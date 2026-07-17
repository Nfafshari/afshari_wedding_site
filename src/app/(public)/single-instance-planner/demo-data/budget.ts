import type { BudgetCategory } from "../demo-types";

/**
 * Demo budget data. Authored rather than transcribed — the repo has no budget seed.
 *
 * Sized deliberately to exercise the code that renders it:
 *  - SEVEN categories carry a nonzero estimate. `getTopCategoriesWithOther` folds
 *    everything past `limit = 5`, so Music and Rentals land in the "Other" slice.
 *    With five or fewer the fold never fires and that branch never runs.
 *  - Honeymoon totals zero, so the `estimated > 0` filter drops it from the pie
 *    while it still shows on the budget table.
 *  - All three BudgetStatus values appear, so every badge variant renders.
 *
 * Vendor names match the archive's mock documents, so the demo reads as one wedding.
 *
 * Subcategories are pre-sorted by estimatedCost ascending, matching what
 * `getBudgetCategories` used to return.
 */
export const DEMO_BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: 1,
    name: 'Venue',
    budgetSubcategories: [
      { id: 1, name: 'Bridal suite', estimatedCost: 1000, paidAmount: 0, status: 'DUE', budgetCategoryId: 1 },
      { id: 2, name: 'Ceremony site fee', estimatedCost: 4000, paidAmount: 4000, status: 'PAID', budgetCategoryId: 1 },
      { id: 3, name: 'Reception hall', estimatedCost: 7000, paidAmount: 3500, status: 'DEPOSIT', budgetCategoryId: 1 },
    ],
  },
  {
    id: 2,
    name: 'Catering',
    budgetSubcategories: [
      { id: 4, name: 'Cake', estimatedCost: 600, paidAmount: 0, status: 'DUE', budgetCategoryId: 2 },
      { id: 5, name: 'Bar service', estimatedCost: 2200, paidAmount: 1100, status: 'DEPOSIT', budgetCategoryId: 2 },
      { id: 6, name: 'Dinner service', estimatedCost: 6800, paidAmount: 2000, status: 'DEPOSIT', budgetCategoryId: 2 },
    ],
  },
  {
    id: 3,
    name: 'Photography',
    budgetSubcategories: [
      { id: 7, name: 'Engagement session', estimatedCost: 500, paidAmount: 500, status: 'PAID', budgetCategoryId: 3 },
      { id: 8, name: 'Videographer', estimatedCost: 1800, paidAmount: 0, status: 'DUE', budgetCategoryId: 3 },
      { id: 9, name: 'Day-of coverage', estimatedCost: 2500, paidAmount: 1250, status: 'DEPOSIT', budgetCategoryId: 3 },
    ],
  },
  {
    id: 4,
    name: 'Flowers',
    budgetSubcategories: [
      { id: 10, name: 'Boutonnieres', estimatedCost: 300, paidAmount: 0, status: 'DUE', budgetCategoryId: 4 },
      { id: 11, name: 'Bouquets', estimatedCost: 700, paidAmount: 700, status: 'PAID', budgetCategoryId: 4 },
      { id: 12, name: 'Ceremony arch', estimatedCost: 900, paidAmount: 0, status: 'DUE', budgetCategoryId: 4 },
      { id: 13, name: 'Centerpieces', estimatedCost: 1300, paidAmount: 650, status: 'DEPOSIT', budgetCategoryId: 4 },
    ],
  },
  {
    id: 5,
    name: 'Attire',
    budgetSubcategories: [
      { id: 14, name: 'Alterations', estimatedCost: 400, paidAmount: 400, status: 'PAID', budgetCategoryId: 5 },
      { id: 15, name: 'Suit', estimatedCost: 900, paidAmount: 900, status: 'PAID', budgetCategoryId: 5 },
      { id: 16, name: 'Wedding dress', estimatedCost: 1600, paidAmount: 1600, status: 'PAID', budgetCategoryId: 5 },
    ],
  },
  // Music and Rentals rank 6th and 7th by estimate — these two are the "Other" slice.
  {
    id: 6,
    name: 'Music',
    budgetSubcategories: [
      { id: 17, name: 'Ceremony strings', estimatedCost: 600, paidAmount: 0, status: 'DUE', budgetCategoryId: 6 },
      { id: 18, name: 'DJ / reception', estimatedCost: 1800, paidAmount: 900, status: 'DEPOSIT', budgetCategoryId: 6 },
    ],
  },
  {
    id: 7,
    name: 'Rentals',
    budgetSubcategories: [
      { id: 19, name: 'Linens', estimatedCost: 450, paidAmount: 450, status: 'PAID', budgetCategoryId: 7 },
      { id: 20, name: 'Tables & chairs', estimatedCost: 1400, paidAmount: 0, status: 'DUE', budgetCategoryId: 7 },
    ],
  },
  // Budgeted but not yet priced — totals zero, so the pie drops it and the table keeps it.
  {
    id: 8,
    name: 'Honeymoon',
    budgetSubcategories: [
      { id: 21, name: 'Flights', estimatedCost: 0, paidAmount: 0, status: 'DUE', budgetCategoryId: 8 },
      { id: 22, name: 'Hotel', estimatedCost: 0, paidAmount: 0, status: 'DUE', budgetCategoryId: 8 },
    ],
  },
];
