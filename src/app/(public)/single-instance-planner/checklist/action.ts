import type { DemoStore } from "../demo-store";

/**
 * Demo twin of `(protected)/planner/checklist/action.ts`.
 *
 * Same validation, same error strings, same control flow — the database is swapped
 * for React state. Worth reading the two side by side: the differences are only
 * ever "where does the data live", never "what does this action decide".
 *
 * Two translations recur throughout:
 *  - Prisma's P2002 (unique violation) becomes an explicit `.some()` check.
 *  - Prisma's P2025 (record not found) becomes an explicit `.find()` miss.
 *
 * These stay `async` even though nothing here awaits: `useDialogSubmit`'s `runAction`
 * types its thunk `() => Promise<ActionResult>`, so a sync function would not satisfy
 * it and every call site would need touching to gain nothing.
 */

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

export function createChecklistActions (store: DemoStore) {
  /**
   * Creates a new category in the store.
   * @param name - name of category (cannot be empty)
   * @param icon - name of Lucide icon
   * @returns an ActionResult the client can react to
   */
  async function createCategory (name: string, icon: string): Promise<ActionResult> {
    // Validate first, exactly as the real action does
    const trimmedName = name.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
    }

    // Stands in for the DB's @unique constraint. Case-sensitive `===` on purpose:
    // Postgres text uniqueness is case-sensitive, so "Venue" and "venue" coexist in
    // the real planner and must coexist here too.
    const isDuplicate = store.getState().taskCategories.some(
      (category) => category.name === trimmedName
    );
    if (isDuplicate) {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }

    // Ids come from the store's counter, not from the array length — see the note
    // on nextId. Taken before setState, because the updater must stay pure.
    const id = store.nextId();

    // Sits where revalidatePath sat in the real action: same position, same job —
    // "the data changed, show the new data". That invalidated a server cache keyed
    // by URL; this invalidates a component.
    store.setState((prev) => ({
      ...prev,
      // Appended rather than sorted in: every category is `order: 0`, so the real
      // query's [{ order: "asc" }, { id: "asc" }] is just insertion order.
      taskCategories: [
        ...prev.taskCategories,
        { id, name: trimmedName, order: 0, icon, tasks: [] },
      ],
    }));

    return { ok: true };
  }

  /**
   * Updates an already existing category's name and icon only using the categories ID.
   * @param categoryId - id of the category to be updated
   * @param newName - name of category (cannot be empty)
   * @param newIcon - name of Lucide icon
   * @returns an ActionResult the client can react to
   */
  async function updateCategory (categoryId: number | undefined, newName: string, newIcon: string): Promise<ActionResult> {
    const trimmedName = newName.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Category name cannot be empty.', field: 'name' };
    }

    if (categoryId === undefined) {
      return { ok: false, error: 'Category could not be found.', field: 'category' };
    }

    const categories = store.getState().taskCategories;

    // Stands in for P2025.
    if (categories.find((category) => category.id === categoryId) === undefined) {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.', field: 'name' };
    }

    // Stands in for P2002 — but excluding the row being edited. The DB gives that
    // for free (updating a row to its own name violates nothing); a bare `.some()`
    // would not, and renaming a category to its current name would fail.
    const isDuplicate = categories.some(
      (category) => category.id !== categoryId && category.name === trimmedName
    );
    if (isDuplicate) {
      return { ok: false, error: 'Category already exists.', field: 'name' };
    }

    store.setState((prev) => ({
      ...prev,
      taskCategories: prev.taskCategories.map((category) =>
        category.id === categoryId
          ? { ...category, name: trimmedName, icon: newIcon }
          : category
      ),
    }));

    return { ok: true };
  }

  /**
   * Deletes a category from the store.
   * @param categoryId - id of the category to be deleted
   * @returns an ActionResult the client can react to
   */
  async function deleteCategory (categoryId: number | undefined): Promise<ActionResult> {
    if (categoryId === undefined) {
      return { ok: false, error: 'Category could not be found.', field: 'category' };
    }

    if (store.getState().taskCategories.find((category) => category.id === categoryId) === undefined) {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.', field: 'name' };
    }

    // Dropping the category drops its tasks with it — they are nested inside it here,
    // which is the in-memory equivalent of the schema's onDelete: Cascade.
    store.setState((prev) => ({
      ...prev,
      taskCategories: prev.taskCategories.filter((category) => category.id !== categoryId),
    }));

    return { ok: true };
  }

  /**
   * Deletes a task from the store.
   * @param taskId - id of the task to be deleted
   * @returns an ActionResult the client can react to
   */
  async function deleteTask (taskId: number | undefined): Promise<ActionResult> {
    if (taskId === undefined) {
      return { ok: false, error: 'Task could not be found.' };
    }

    const taskExists = store.getState().taskCategories.some(
      (category) => category.tasks.some((task) => task.id === taskId)
    );
    if (!taskExists) {
      return { ok: false, error: 'That task no longer exists, refresh your page and try again.' };
    }

    store.setState((prev) => ({
      ...prev,
      taskCategories: prev.taskCategories.map((category) => ({
        ...category,
        tasks: category.tasks.filter((task) => task.id !== taskId),
      })),
    }));

    return { ok: true };
  }

  /**
   * Adds a new task to the selected category.
   * @param taskName - name of task
   * @param date - date to be completed by
   * @param categoryId - id of corresponding category
   * @returns an error response whether the action completed or not see: {@link ActionResult}
   */
  async function createTask (taskName: string, date: Date | undefined, categoryId: number | null): Promise<ActionResult> {
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

    // Stands in for P2003 — the real action leaves this to the DB's foreign key and
    // reports it through the generic catch.
    if (store.getState().taskCategories.find((category) => category.id === categoryId) === undefined) {
      return { ok: false, error: 'That category no longer exists, refresh your page and try again.', field: 'category' };
    }

    const id = store.nextId();
    const createdAt = new Date();

    store.setState((prev) => ({
      ...prev,
      taskCategories: prev.taskCategories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              // Re-sorted rather than appended, standing in for the query's
              // [{ goalDate: "asc" }, { id: "asc" }] — a new task has to land in
              // date order, not at the end.
              tasks: [
                ...category.tasks,
                { id, name: trimmedName, goalDate: date, status: false, categoryId, createdAt },
              ].sort((a, b) => a.goalDate.getTime() - b.goalDate.getTime() || a.id - b.id),
            }
          : category
      ),
    }));

    return { ok: true };
  }

  /**
   * Marks a task as done.
   * @param taskId - name of task
   * @returns an error response whether the action completed or not see: {@link ActionResult}
   */
  async function toggleTaskStatus (taskId: number | undefined, status: boolean): Promise<ActionResult> {
    if (taskId === undefined) {
      return { ok: false, error: 'Task not selected.', field: 'name' };
    }

    const taskExists = store.getState().taskCategories.some(
      (category) => category.tasks.some((task) => task.id === taskId)
    );
    if (!taskExists) {
      return { ok: false, error: 'Something went wrong. Please try again.' };
    }

    store.setState((prev) => ({
      ...prev,
      taskCategories: prev.taskCategories.map((category) => ({
        ...category,
        tasks: category.tasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        ),
      })),
    }));

    return { ok: true };
  }

  return { createCategory, updateCategory, deleteCategory, deleteTask, createTask, toggleTaskStatus };
}
