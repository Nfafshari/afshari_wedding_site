import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-user';

import Checklist from "./client";

/**
 * Render per request rather than at build time — the category filter reads
 * `?category` via useSearchParams, which cannot be resolved during a prerender.
 * See the matching note in the budget page.
 */
export const dynamic = 'force-dynamic';

export async function getCategories () {
  // Guarded here rather than only in the layout: Next renders layouts and pages in
  // parallel, so this query would otherwise fire before the layout's redirect wins.
  await requireUser();

  const categories = prisma.taskCategory.findMany({
    include: {
      tasks: {
        // Two tasks can share a goal date, so break the tie on id — otherwise
        // Postgres is free to return them in a different order each query.
        orderBy: [{ goalDate: "asc" }, { id: "asc" }]
      },
     },
    // `order` is currently @default(0) on every row, so on its own this sorts
    // nothing and the row order is whatever Postgres feels like. id keeps it stable.
    orderBy: [{ order: "asc" }, { id: "asc" }]
  });

  return categories;
}

export type CategoryWithTasks = Awaited<ReturnType<typeof getCategories>>[number]

export default async function ChecklistWrapper () {
  const categories = await getCategories();

  return (
    <Checklist categories={categories} />
  )
}