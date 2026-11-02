"use server";
import { prisma } from '@/lib/prisma';
import { BudgetStatus } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';
import { requireUserAction } from '@/lib/require-user';
import { handleActionError, validateMoney, type ActionResult as SharedActionResult } from '@/lib/action';

/**
 * Which input a failure relates to, so the client can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'estimatedCost' | 'paidAmount' | 'budgetCategory' | 'status';

/** See {@link SharedActionResult}; narrowed to this page's fields. */
export type ActionResult = SharedActionResult<ErrorField>;

export interface BudgetSubcategoryInput {
  name?: string | undefined;
  /** Moves the line item to another category. */
  budgetCategoryId?: number | undefined;
  estimatedCost?: number | undefined;
  paidAmount?: number | undefined;
  status?: BudgetStatus | undefined;
}

const BUDGET_PATH = '/planner/budget';

const CATEGORY_GONE = 'That category no longer exists, refresh your page and try again.';
const LINE_ITEM_GONE = 'That line item no longer exists, refresh your page and try again.';
/** One message for a name clash, whether the line item was renamed or moved. */
const LINE_ITEM_TAKEN = 'A line item with that name already exists in this category.';

/**
 * Creates a new budget category in the DB.
 * @param name - name of category (cannot be empty)
 * @returns an ActionResult the client can react to
 */
export async function createBudgetCategory (name: string): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // Validate on the server
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
  }

  // Try the write. The DB's @unique constraint guards against duplicates.
  try {
    await prisma.budgetCategory.create({
      data: {
        name: trimmedName,
      },
    });
  } catch (error) {
    return handleActionError(error, 'creating new budget category', {
      P2002: { error: 'A category with that name already exists.', field: 'name' },
    });
  }

  revalidatePath(BUDGET_PATH);
  return { ok: true };
}

/**
 * Renames an existing budget category.
 * @param budgetCategoryId - id of the category to update
 * @param newName - new name (cannot be empty)
 * @returns an ActionResult the client can react to
 */
export async function updateBudgetCategory (budgetCategoryId: number | undefined, newName: string): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // Validate on the server
  const trimmedName = newName.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
  }

  if (budgetCategoryId === undefined) {
    return { ok: false, error: 'Category could not be found.', field: 'budgetCategory' };
  }

  // Try the write. The DB's @unique constraint guards against duplicates.
  try {
    await prisma.budgetCategory.update({
      where: { id: budgetCategoryId },
      data: { name: trimmedName },
    });
  } catch (error) {
    return handleActionError(error, 'updating budget category', {
      P2002: { error: 'A category with that name already exists.', field: 'name' },
      // The category was deleted while the dialog was open.
      P2025: { error: CATEGORY_GONE, field: 'name' },
    });
  }

  revalidatePath(BUDGET_PATH);
  return { ok: true };
}

/**
 * Deletes a budget category. Its line items go with it via the DB's
 * onDelete: Cascade relation, so we only delete the category here.
 * @param budgetCategoryId - id of the category to delete
 * @returns an ActionResult the client can react to
 */
export async function deleteBudgetCategory (budgetCategoryId: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (budgetCategoryId === undefined) {
    return { ok: false, error: 'Category could not be found.', field: 'budgetCategory' };
  }

  // Try to delete the category (line items cascade automatically).
  try {
    await prisma.budgetCategory.delete({
      where: { id: budgetCategoryId },
    });
  } catch (error) {
    return handleActionError(error, 'deleting budget category', {
      // Already removed.
      P2025: { error: CATEGORY_GONE },
    });
  }

  revalidatePath(BUDGET_PATH);
  return { ok: true };
}

/**
 * Creates a new line item (a BudgetSubcategory row) under a category.
 * @param name - name of the line item (cannot be empty)
 * @param estimatedCost - estimated cost, in dollars (>= 0)
 * @param paidAmount - amount already paid, in dollars (>= 0)
 * @param budgetCategoryId - id of the parent category
 * @param status - payment status; the column defaults to DUE
 * @returns an ActionResult the client can react to
 */
export async function createBudgetSubcategory (name: string, estimatedCost: number, paidAmount: number, budgetCategoryId: number | null, status: BudgetStatus = BudgetStatus.DUE): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // Validate on the server (the client re-checks these too, for instant feedback).
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Line item name cannot be empty.', field: 'name' };
  }

  if (budgetCategoryId === null) {
    return { ok: false, error: 'No category selected.', field: 'budgetCategory' };
  }

  const invalid = validateMoney(estimatedCost, 'estimatedCost', 'Estimated cost')
    ?? validateMoney(paidAmount, 'paidAmount', 'Amount paid');
  if (invalid) {
    return invalid;
  }

  if (!Object.values(BudgetStatus).includes(status)) {
    return { ok: false, error: 'Line item status is incorrect. Please try again.', field: 'status' };
  }

  // Try the write. The DB's @@unique([budgetCategoryId, name]) guards duplicates.
  try {
    await prisma.budgetSubcategory.create({
      data: {
        name: trimmedName,
        estimatedCost,
        paidAmount,
        budgetCategoryId,
        status,
      },
    });
  } catch (error) {
    return handleActionError(error, 'creating new budget subcategory', {
      P2002: { error: LINE_ITEM_TAKEN, field: 'name' },
      // The parent category was deleted while the dialog was open.
      P2003: { error: CATEGORY_GONE, field: 'budgetCategory' },
    });
  }

  revalidatePath(BUDGET_PATH);
  return { ok: true };
}

/**
 * Deletes a budget subcategory from the DB.
 * @param subcategoryId - id of the subcategory to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteBudgetSubcategory (subcategoryId: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // check if the id is undefined
  if (subcategoryId === undefined) {
    return { ok: false, error: 'Line item could not be found.' };
  }

  // Try to delete the subcategory
  try {
    await prisma.budgetSubcategory.delete({
      where: { id: subcategoryId },
    });
  } catch (error) {
    return handleActionError(error, 'deleting budget subcategory', {
      // Already removed.
      P2025: { error: LINE_ITEM_GONE },
    });
  }

  revalidatePath(BUDGET_PATH);
  return { ok: true };
}

/**
 * Updates the subcategory with the passed parameters.
 * if any of the optional parameters are undefined, that value is left untouched
 * @param budgetSubcategoryId - id of the category to update
 * @param data - an object of all optional inputs that can be updated:
 * - name
 * - budgetCategoryId (moves it to another category)
 * - estimated cost
 * - paid amount
 * - status
 *
 * see {@link BudgetSubcategoryInput}
 * @returns an ActionResult the client can react to
 */
export async function updateBudgetSubcategory (budgetSubcategoryId: number | undefined, data: BudgetSubcategoryInput): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (budgetSubcategoryId === undefined) {
    return { ok: false, error: 'Line item could not be found.', field: 'budgetCategory' };
  }

  // Nothing was passed, so there is nothing to do.
  if (Object.values(data).every((value) => value === undefined)) {
    return { ok: true }
  }

  // validate all parameters
  const trimmedName = data.name?.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Line item name cannot be empty.', field: 'name' }
  }

  const invalid = (data.estimatedCost === undefined ? null : validateMoney(data.estimatedCost, 'estimatedCost', 'Estimated cost'))
    ?? (data.paidAmount === undefined ? null : validateMoney(data.paidAmount, 'paidAmount', 'Amount paid'));
  if (invalid) {
    return invalid;
  }

  if (data.status !== undefined && !Object.values(BudgetStatus).includes(data.status)) {
    return { ok: false, error: 'Line item status is incorrect. Please try again.', field: 'status'}
  }

  // Spread rather than mutating `data` — it belongs to the caller. Prisma skips any
  // key that is undefined, so absent fields are left untouched.
  try {
    await prisma.budgetSubcategory.update({
      where: { id: budgetSubcategoryId },
      data: { ...data, name: trimmedName },
    });
  } catch (error) {
    return handleActionError(error, 'updating budget subcategory', {
      // The category (its own, or the one it moved to) already has a line item with that name.
      P2002: { error: LINE_ITEM_TAKEN, field: 'name' },
      // It was moved to a category deleted while the dialog was open.
      P2003: { error: CATEGORY_GONE, field: 'budgetCategory' },
      // The line item was deleted while the dialog was open.
      P2025: { error: LINE_ITEM_GONE, field: 'name' },
    });
  }

  revalidatePath(BUDGET_PATH);
  return { ok: true };
}
