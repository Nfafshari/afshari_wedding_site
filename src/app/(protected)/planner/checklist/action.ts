"use server";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireUserAction } from '@/lib/require-user';
import { handleActionError, type ActionResult as SharedActionResult } from '@/lib/action';

/**
 * Which input a failure relates to, so the client can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'date' | 'category';

/** See {@link SharedActionResult}; narrowed to this page's fields. */
export type ActionResult = SharedActionResult<ErrorField>;

/** The route these writes invalidate. `(protected)` is a route group, so it is not in the URL. */
const CHECKLIST_PATH = '/planner/checklist';

const CATEGORY_GONE = 'That category no longer exists, refresh your page and try again.';

/**
 * Creates a new category in the DB.
 * @param name - name of category (cannot be empty)
 * @param icon - name of Lucide icon
 * @returns an ActionResult the client can react to
 */
export async function createCategory (name: string, icon: string): Promise<ActionResult> {
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
    await prisma.taskCategory.create({
      data: {
        name: trimmedName,
        icon: icon,
      },
    });
  } catch (error) {
    return handleActionError(error, 'creating new category', {
      P2002: { error: 'Category already exists.', field: 'name' },
    });
  }

  revalidatePath(CHECKLIST_PATH);
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
    return handleActionError(error, 'updating category', {
      P2002: { error: 'Category already exists.', field: 'name' },
      // The category was deleted while the dialog was open.
      P2025: { error: CATEGORY_GONE, field: 'name' },
    });
  }

  revalidatePath(CHECKLIST_PATH);
  return { ok: true };
}

/**
 * Deletes a category from the DB.
 * @param categoryId - id of the category to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteCategory (categoryId: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

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
    return handleActionError(error, 'deleting category', {
      // Already removed.
      P2025: { error: CATEGORY_GONE, field: 'name' },
    });
  }

  revalidatePath(CHECKLIST_PATH);
  return { ok: true };
}

/**
 * Deletes a task from the DB.
 * @param taskId - id of the task to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteTask (taskId: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

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
    return handleActionError(error, 'deleting task', {
      // Already removed.
      P2025: { error: 'That task no longer exists, refresh your page and try again.' },
    });
  }

  revalidatePath(CHECKLIST_PATH);
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
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

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

  // Try the write. Task names don't have to be unique, so no known codes to map.
  try {
    await prisma.task.create({
      data: {
        categoryId: categoryId,
        name: trimmedName,
        goalDate: date
      },
    });
  } catch (error) {
    return handleActionError(error, 'creating new task', {});
  }

  revalidatePath(CHECKLIST_PATH);
  return { ok: true };
}

/**
 * Marks a task as done and saves it to the DB
 * @param taskId - name of task
 * @returns an error response whether the action completed or not see: {@link ActionResult}
 */
export async function toggleTaskStatus (taskId: number | undefined, status: boolean): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // Validate on the server
  if (taskId === undefined) {
    return { ok: false, error: 'Task not selected.', field: 'name' };
  }

  // Try to update
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: status,
      }
    });
  } catch (error) {
    return handleActionError(error, 'marking task as done', {});
  }

  revalidatePath(CHECKLIST_PATH);
  return { ok: true };
}
