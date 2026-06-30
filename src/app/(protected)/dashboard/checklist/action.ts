"use server";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Which input a failure relates to, so the client can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'date' | 'category';

/**
 * The shape every action returns: either it worked, or it failed with a reason.
 * The client checks `ok` to decide whether to close the dialog or show an error,
 * and `field` to decide which input to flag.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField };

/**
 * Creates a new category in the DB.
 * @param name - name of category (cannot be empty)
 * @param icon - name of Lucide icon
 * @returns an ActionResult the client can react to
 */
export async function addNewCategory (name: string, icon: string): Promise<ActionResult> {
  // Validate on the server
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
  }

  // Try the write. The DB's @unique constraint guards against duplicates.
  try {
    await prisma.taskCategory.create({
      data: {
        name: trimmedName,
        icon: icon,
      },
    });
  } catch (error) {
    // P2002 = unique constraint failed (a category with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error creating new category, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath('/dashboard/checklist');
  return { ok: true };
}

export async function addNewTask (taskName: string, date: Date | undefined, categoryId: number | null): Promise<ActionResult> {
  // Validate on the server
  const trimmedName = taskName.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Task name cannot be empty.', field: 'name' };
  }

  if (categoryId === null) {
    return { ok: false, error: 'No category selected.', field: 'category' };
  }

  if (date === undefined) {
    return { ok: false, error: 'Please select a date.', field: 'date' };
  }

  // Try the write. The DB's @unique constraint guards against duplicates.
  try {
    await prisma.task.create({
      data: {
        categoryId: categoryId,
        name: trimmedName,
        goalDate: date
      },
    });
  } catch (error) {
    // Any unexpected results, log it and show a generic message to the user.
    console.error(`*ERROR - error creating new task, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath('/dashboard/checklist');
  return { ok: true };
}