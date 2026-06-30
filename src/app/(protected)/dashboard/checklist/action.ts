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
export async function createCategory (name: string, icon: string): Promise<ActionResult> {
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

/**
 * Updates an already existing category's name and icon only using the categories ID.
 * @param categoryId - id of the category to be updated
 * @param newName - name of category (cannot be empty)
 * @param newIcon - name of Lucide icon
 * @returns an ActionResult the client can react to
 */
export async function updateCategory (categoryId: number | undefined, newName: string, newIcon: string): Promise<ActionResult> {
  // Validate on the server
  const trimmedName = newName.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
  }

  // check if category id is undefined
  if (categoryId === undefined) {
    return { ok: false, error: 'Category could not be found.', field: 'category' };
  }  

  // Try the write. The DB's @unique constraint guards against duplicates.
  try {
    await prisma.taskCategory.update({
      where: { id: categoryId },
      data: {
        name: trimmedName,
        icon: newIcon
      }
    });
  } catch (error) {
    // P2002 = unique constraint failed (a category with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }
    // P2025 = id could not be found (a category with this ID does not exist)
    else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error updating category, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath('/dashboard/checklist');
  return { ok: true };
}

/**
 * Deletes a category from the DB.
 * @param categoryId - id of the category to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteCategory (categoryId: number | undefined): Promise<ActionResult> {
  // check if category id is undefined
  if (categoryId === undefined) {
    return { ok: false, error: 'Category could not be found.', field: 'category' };
  }  

  // Try to delete category
  try {
    await prisma.taskCategory.delete({
      where: { id: categoryId },
    });
  } catch (error) {
    // P2025 = id could not be found (a category with this ID does not exist)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error deleting category, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath('/dashboard/checklist');
  return { ok: true };
}

/**
 * Deletes a task from the DB.
 * @param taskId - id of the task to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteTask (taskId: number | undefined): Promise<ActionResult> {
  // check if task id is undefined
  if (taskId === undefined) {
    return { ok: false, error: 'Task could not be found.' };
  }

  // Try to delete the task
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
  } catch (error) {
    // P2025 = record to delete does not exist (task already removed)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That task no longer exists, refresh your page and try again.' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error deleting task, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath('/dashboard/checklist');
  return { ok: true };
}

/**
 * Adds a new task to the selected category and saves it to the DB.
 * @param taskName - name of task
 * @param date - date to be completed by
 * @param categoryId - id of corresponding category
 * @returns an error response whether the action completed or not see: {@link ActionResult}
 */
export async function createTask (taskName: string, date: Date | undefined, categoryId: number | null): Promise<ActionResult> {
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
