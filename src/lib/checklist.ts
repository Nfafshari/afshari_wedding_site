/**
 * Checklist rules, shared by the checklist page and its tests.
 *
 * Due dates are calendar days. Every date on the site is shown in Central time (see
 * `formatDate`), so "today" and "overdue" are counted in Central days too: a task due
 * Nov 1 is overdue from midnight Central on Nov 2, whatever the server's clock zone.
 */

type TaskLike = { goalDate: Date; status: boolean };

/** How far ahead "due soon" looks, in days. */
export const DUE_SOON_DAYS = 30;

// en-CA formats as YYYY-MM-DD, which sorts and compares as a string.
const centralDay = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Chicago',
});

/** The Central-time calendar day of an instant, as "2026-11-02". */
function dayKey (date: Date): string {
  return centralDay.format(date);
}

/** A calendar day `days` after `key`. Done on the date itself, so a DST change can't shift it. */
function addDays (key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Not done, and due before today. A task due today is not overdue yet. */
export function isOverdue (task: TaskLike, now: Date = new Date()): boolean {
  return !task.status && dayKey(task.goalDate) < dayKey(now);
}

/** Not done, and due today or within the next DUE_SOON_DAYS days. Overdue tasks are counted separately. */
export function isDueSoon (task: TaskLike, now: Date = new Date()): boolean {
  if (task.status) return false;
  const due = dayKey(task.goalDate);
  const today = dayKey(now);
  return due >= today && due <= addDays(today, DUE_SOON_DAYS);
}

export type ChecklistStats = { total: number; done: number; overdue: number; dueSoon: number };

export function getChecklistStats (categories: { tasks: TaskLike[] }[], now: Date = new Date()): ChecklistStats {
  const tasks = categories.flatMap((category) => category.tasks);
  return {
    total: tasks.length,
    done: tasks.filter((task) => task.status).length,
    overdue: tasks.filter((task) => isOverdue(task, now)).length,
    dueSoon: tasks.filter((task) => isDueSoon(task, now)).length,
  };
}

/** The checklist's task filter, kept in `?show=`. */
export const TASK_FILTERS = ['all', 'todo', 'done'] as const;
export type TaskFilter = typeof TASK_FILTERS[number];

export function isTaskFilter (value: string | null): value is TaskFilter {
  return TASK_FILTERS.some((filter) => filter === value);
}

export function matchesTaskFilter (task: TaskLike, filter: TaskFilter): boolean {
  if (filter === 'todo') return !task.status;
  if (filter === 'done') return task.status;
  return true;
}

/**
 * The dashboard's "Up next": undone tasks from every category by due date, so overdue
 * ones come first (oldest first), then the upcoming ones. Ties break on id so equal
 * dates can't swap places between renders. Each task keeps its category for display.
 */
export function getUpNextTasks<C extends { tasks: (TaskLike & { id: number })[] }> (
  categories: C[],
  limit = 5,
): { task: C['tasks'][number]; category: C }[] {
  return categories
    .flatMap((category) => category.tasks.map((task) => ({ task, category })))
    .filter(({ task }) => !task.status)
    .toSorted((a, b) => a.task.goalDate.getTime() - b.task.goalDate.getTime() || a.task.id - b.task.id)
    .slice(0, limit);
}
