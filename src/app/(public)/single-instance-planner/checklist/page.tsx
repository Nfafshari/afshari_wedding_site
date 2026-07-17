import Checklist from "./client";

/**
 * Render per request rather than at build time — the category filter reads
 * `?category` via useSearchParams, which cannot be resolved during a prerender.
 * See the matching note in the budget page.
 */
export const dynamic = 'force-dynamic';

/**
 * Re-exported so consumers keep importing `CategoryWithTasks` from this page, the
 * way they did when it was derived from the Prisma query. The definition moved to
 * demo-types; the address did not. Types are erased at build, so this costs nothing.
 */
export type { CategoryWithTasks } from "../demo-types";

export default function ChecklistWrapper () {
  return (
    <Checklist />
  )
}
