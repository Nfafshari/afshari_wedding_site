import { BudgetStatus } from '@/generated/prisma/enums';
import type { DemoStore } from "../demo-store";

/**
 * Demo twin of `(protected)/planner/budget/action.ts`. Same validation, same error
 * strings, same control flow — the database is swapped for React state.
 *
 * `BudgetStatus` still comes from the generated enums, and deliberately: that module
 * is a plain `as const` object with no imports and no Prisma runtime behind it. It
 * already ships to the browser in the real planner's client components. Re-declaring
 * it here would be a second source of truth for no gain.
 */

/**
 * Which input a failure relates to, so the client can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'estimatedCost' | 'paidAmount' | 'budgetCategory' | 'status';

export interface BudgetSubcategoryInput {
  name?: string | undefined;
  estimatedCost?: number | undefined;
  paidAmount?: number | undefined;
  status?: BudgetStatus | undefined;
}

/**
 * Kept from the real action, where estimatedCost/paidAmount are Decimal(10,2) and
 * anything this large overflows the column. Nothing overflows in memory — but the
 * demo's job is to behave like the real planner, and a demo that accepts a number
 * the real app rejects is lying about the app.
 */
const MAX_MONEY = 100_000_000;

/**
 * The shape every action returns: either it worked, or it failed with a reason.
 * The client checks `ok` to decide whether to close the dialog or show an error,
 * and `field` to decide which input to flag.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField };

/**
 * Bounds a money value once, so create and update can't drift apart on what counts
 * as valid — they already had.
 * @returns a failing ActionResult, or null when the value is acceptable
 */
function validateMoney (value: number, field: 'estimatedCost' | 'paidAmount', label: string): ActionResult | null {
  // Number(...) can hand us NaN if the user typed something non-numeric.
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: `${label} must be a number of 0 or more.`, field };
  }

  if (value >= MAX_MONEY) {
    return { ok: false, error: `${label} must be less than $100,000,000.`, field };
  }

  return null;
}

export function createBudgetActions (store: DemoStore) {
  /**
   * Creates a new budget category.
   * @param name - name of category (cannot be empty)
   * @returns an ActionResult the client can react to
   */
  async function createBudgetCategory (name: string): Promise<ActionResult> {
    const trimmedName = name.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
    }

    // Stands in for the DB's @unique constraint (P2002). Case-sensitive, as Postgres is.
    const isDuplicate = store.getState().budgetCategories.some(
      (category) => category.name === trimmedName
    );
    if (isDuplicate) {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }

    const id = store.nextId();

    store.setState((prev) => ({
      ...prev,
      // Appended: every category is `order: 0`, so the real query's
      // [{ order: "asc" }, { id: "asc" }] amounts to insertion order.
      budgetCategories: [
        ...prev.budgetCategories,
        { id, name: trimmedName, budgetSubcategories: [] },
      ],
    }));

    return { ok: true };
  }

  /**
   * Renames an existing budget category.
   * @param budgetCategoryId - id of the category to update
   * @param newName - new name (cannot be empty)
   * @returns an ActionResult the client can react to
   */
  async function updateBudgetCategory (budgetCategoryId: number | undefined, newName: string): Promise<ActionResult> {
    const trimmedName = newName.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
    }

    if (budgetCategoryId === undefined) {
      return { ok: false, error: 'Category could not be found.', field: 'budgetCategory' };
    }

    const categories = store.getState().budgetCategories;

    // Stands in for P2025.
    if (categories.find((category) => category.id === budgetCategoryId) === undefined) {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.', field: 'name' };
    }

    // Stands in for P2002, excluding the row being edited — otherwise renaming a
    // category to the name it already has would fail.
    const isDuplicate = categories.some(
      (category) => category.id !== budgetCategoryId && category.name === trimmedName
    );
    if (isDuplicate) {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }

    store.setState((prev) => ({
      ...prev,
      budgetCategories: prev.budgetCategories.map((category) =>
        category.id === budgetCategoryId ? { ...category, name: trimmedName } : category
      ),
    }));

    return { ok: true };
  }

  /**
   * Deletes a budget category. Its subcategories go with it — they are nested inside
   * it here, which is the in-memory equivalent of the schema's onDelete: Cascade.
   * @param budgetCategoryId - id of the category to delete
   * @returns an ActionResult the client can react to
   */
  async function deleteBudgetCategory (budgetCategoryId: number | undefined): Promise<ActionResult> {
    if (budgetCategoryId === undefined) {
      return { ok: false, error: 'Category could not be found.', field: 'budgetCategory' };
    }

    if (store.getState().budgetCategories.find((category) => category.id === budgetCategoryId) === undefined) {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.' };
    }

    store.setState((prev) => ({
      ...prev,
      budgetCategories: prev.budgetCategories.filter((category) => category.id !== budgetCategoryId),
    }));

    return { ok: true };
  }

  /**
   * Creates a new budget subcategory (line item) under a category.
   * @param name - name of the subcategory (cannot be empty)
   * @param estimatedCost - estimated cost, in dollars (>= 0)
   * @param paidAmount - amount already paid, in dollars (>= 0)
   * @param budgetCategoryId - id of the parent category
   * @returns an ActionResult the client can react to
   */
  async function createBudgetSubcategory (name: string, estimatedCost: number, paidAmount: number, budgetCategoryId: number | null): Promise<ActionResult> {
    const trimmedName = name.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Subcategory name cannot be empty.', field: 'name' };
    }

    if (budgetCategoryId === null) {
      return { ok: false, error: 'No category selected.', field: 'budgetCategory' };
    }

    const estimatedCostError = validateMoney(estimatedCost, 'estimatedCost', 'Estimated cost');
    if (estimatedCostError) {
      return estimatedCostError;
    }

    const paidAmountError = validateMoney(paidAmount, 'paidAmount', 'Amount paid');
    if (paidAmountError) {
      return paidAmountError;
    }

    const parent = store.getState().budgetCategories.find((category) => category.id === budgetCategoryId);

    // Stands in for P2003 (the parent category no longer exists).
    if (parent === undefined) {
      return { ok: false, error: 'That category no longer exists, refresh and try again.', field: 'budgetCategory' };
    }

    // Stands in for @@unique([budgetCategoryId, name]) — a COMPOSITE unique, unlike
    // every other unique in this schema. Scoped to the parent, so two categories can
    // each have a "Deposit" line.
    const isDuplicate = parent.budgetSubcategories.some((sub) => sub.name === trimmedName);
    if (isDuplicate) {
      return { ok: false, error: 'A subcategory with that name already exists in this category.', field: 'name' };
    }

    const id = store.nextId();

    store.setState((prev) => ({
      ...prev,
      budgetCategories: prev.budgetCategories.map((category) =>
        category.id === budgetCategoryId
          ? {
              ...category,
              // Re-sorted rather than appended, standing in for the query's
              // [{ estimatedCost: "asc" }, { id: "asc" }].
              budgetSubcategories: [
                ...category.budgetSubcategories,
                { id, name: trimmedName, estimatedCost, paidAmount, status: BudgetStatus.DUE, budgetCategoryId },
              ].sort((a, b) => a.estimatedCost - b.estimatedCost || a.id - b.id),
            }
          : category
      ),
    }));

    return { ok: true };
  }

  /**
   * Deletes a budget subcategory.
   * @param subcategoryId - id of the subcategory to be deleted
   * @returns an ActionResult the client can react to
   */
  async function deleteBudgetSubcategory (subcategoryId: number | undefined): Promise<ActionResult> {
    if (subcategoryId === undefined) {
      return { ok: false, error: 'Subcategory could not be found.' };
    }

    const subcategoryExists = store.getState().budgetCategories.some(
      (category) => category.budgetSubcategories.some((sub) => sub.id === subcategoryId)
    );
    if (!subcategoryExists) {
      return { ok: false, error: 'That subcategory no longer exists, refresh your page and try again.' };
    }

    store.setState((prev) => ({
      ...prev,
      budgetCategories: prev.budgetCategories.map((category) => ({
        ...category,
        budgetSubcategories: category.budgetSubcategories.filter((sub) => sub.id !== subcategoryId),
      })),
    }));

    return { ok: true };
  }

  /**
   * Updates the subcategory with the passed parameters.
   * if any of the optional parameters are undefined, that value is left untouched
   * @param budgetSubcategoryId - id of the category to update
   * @param data - an object of all optional inputs that can be updated:
   * - name
   * - estimated cost
   * - paid amount
   * - status
   *
   * see {@link BudgetSubcategoryInput}
   * @returns an ActionResult the client can react to
   */
  async function updateBudgetSubcategory (budgetSubcategoryId: number | undefined, data: BudgetSubcategoryInput): Promise<ActionResult> {
    if (budgetSubcategoryId === undefined) {
      return { ok: false, error: 'Subcategory could not be found.', field: 'budgetCategory' };
    }

    // return the function worked since now values were passed (all undefined)
    if (data.name === undefined && data.estimatedCost === undefined && data.paidAmount === undefined && data.status === undefined) {
      return { ok: true }
    }

    // validate all parameters
    const trimmedName = data.name?.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Subcategory name can not be empty', field: 'name' }
    }

    if (data.estimatedCost !== undefined) {
      const estimatedCostError = validateMoney(data.estimatedCost, 'estimatedCost', 'Estimated cost');
      if (estimatedCostError) {
        return estimatedCostError;
      }
    }

    if (data.paidAmount !== undefined) {
      const paidAmountError = validateMoney(data.paidAmount, 'paidAmount', 'Amount paid');
      if (paidAmountError) {
        return paidAmountError;
      }
    }

    if (data.status !== undefined && !Object.values(BudgetStatus).includes(data.status)) {
      return { ok: false, error: 'Subcategory status is incorrect. Please try again.', field: 'status'}
    }

    const parent = store.getState().budgetCategories.find(
      (category) => category.budgetSubcategories.some((sub) => sub.id === budgetSubcategoryId)
    );

    // Stands in for P2025.
    if (parent === undefined) {
      return { ok: false, error: 'That subcategory no longer exists, refresh your page and try again.', field: 'name' };
    }

    // Stands in for the composite unique, scoped to the parent and excluding the row
    // being edited.
    if (trimmedName !== undefined) {
      const isDuplicate = parent.budgetSubcategories.some(
        (sub) => sub.id !== budgetSubcategoryId && sub.name === trimmedName
      );
      if (isDuplicate) {
        return { ok: false, error: 'Subcategory already exists.', field: 'name' };
      }
    }

    store.setState((prev) => ({
      ...prev,
      budgetCategories: prev.budgetCategories.map((category) => {
        if (category.id !== parent.id) return category;

        return {
          ...category,
          budgetSubcategories: category.budgetSubcategories
            .map((sub) => {
              if (sub.id !== budgetSubcategoryId) return sub;

              // Spread rather than mutating `data` — it belongs to the caller. Each
              // key is applied only when present, which is what Prisma's "skip
              // undefined" behaviour did for the real action.
              return {
                ...sub,
                ...(trimmedName !== undefined && { name: trimmedName }),
                ...(data.estimatedCost !== undefined && { estimatedCost: data.estimatedCost }),
                ...(data.paidAmount !== undefined && { paidAmount: data.paidAmount }),
                ...(data.status !== undefined && { status: data.status }),
              };
            })
            // estimatedCost may have changed, so the query's sort has to be reapplied.
            .sort((a, b) => a.estimatedCost - b.estimatedCost || a.id - b.id),
        };
      }),
    }));

    return { ok: true };
  }

  return {
    createBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    createBudgetSubcategory,
    deleteBudgetSubcategory,
    updateBudgetSubcategory,
  };
}
