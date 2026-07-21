"use server";
import { prisma } from '@/lib/prisma';
import { BudgetStatus, Prisma } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';
import { requireUserAction } from '@/lib/require-user';

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

const BUDGET_PATH = '/planner/budget';

/** estimatedCost/paidAmount are Decimal(10,2), so anything this large overflows the column. */
const MAX_MONEY = 100_000_000;

/**
 * The shape every action returns: either it worked, or it failed with a reason.
 * The client checks `ok` to decide whether to close the dialog or show an error,
 * and `field` to decide which input to flag.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField; authRequired?: true };

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

  // Past this the DB write throws and the user only sees "Something went wrong".
  if (value >= MAX_MONEY) {
    return { ok: false, error: `${label} must be less than $100,000,000.`, field };
  }

  return null;
}

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
    // P2002 = unique constraint failed (a category with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error creating new budget category, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
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
    // P2002 = unique constraint (a category with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }
    // P2025 = record to update not found (category was deleted).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error updating budget category, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(BUDGET_PATH);
  return { ok: true };
}

/**
 * Deletes a budget category. Its subcategories go with it via the DB's
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

  // Try to delete the category (subcategories cascade automatically).
  try {
    await prisma.budgetCategory.delete({
      where: { id: budgetCategoryId },
    });
  } catch (error) {
    // P2025 = record to delete does not exist (already removed).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error deleting budget category, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(BUDGET_PATH);
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
export async function createBudgetSubcategory (name: string, estimatedCost: number, paidAmount: number, budgetCategoryId: number | null): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // Validate on the server (the client re-checks these too, for instant feedback).
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

  // Try the write. The DB's @@unique([budgetCategoryId, name]) guards duplicates.
  try {
    await prisma.budgetSubcategory.create({
      data: {
        name: trimmedName,
        estimatedCost,
        paidAmount,
        budgetCategoryId,
      },
    });
  } catch (error) {
    // P2002 = unique constraint (this category already has a subcategory with that name).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'A subcategory with that name already exists in this category.', field: 'name' };
    }
    // P2003 = foreign key constraint (the parent category no longer exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return { ok: false, error: 'That category no longer exists, refresh and try again.', field: 'budgetCategory' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error creating new budget subcategory, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
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
    return { ok: false, error: 'Subcategory could not be found.' };
  }

  // Try to delete the subcategory
  try {
    await prisma.budgetSubcategory.delete({
      where: { id: subcategoryId },
    });
  } catch (error) {
    // P2025 = record to delete does not exist (already removed).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That subcategory no longer exists, refresh your page and try again.' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error deleting budget subcategory, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(BUDGET_PATH);
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
export async function updateBudgetSubcategory (budgetSubcategoryId: number | undefined, data: BudgetSubcategoryInput): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

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

  // Spread rather than mutating `data` — it belongs to the caller. Prisma skips any
  // key that is undefined, so absent fields are left untouched.
  try {
    await prisma.budgetSubcategory.update({
      where: { id: budgetSubcategoryId },
      data: { ...data, name: trimmedName },
    });
  } catch (error) {
    // P2002 = unique constraint (a category with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Subcategory already exists.', field: 'name' };
    }
    // P2025 = record to update not found (category was deleted).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That subcategory no longer exists, refresh your page and try again.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error updating budget subcategory, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }


  // refresh the page data after a successful write
  revalidatePath(BUDGET_PATH);
  return { ok: true };
}
