import Budget from "./client";

/**
 * Render per request rather than at build time.
 *
 * This is NOT about the data source — it never was. The sort controls read
 * `?sort`/`?dir` via useSearchParams, which forces a client-side bailout and fails
 * `next build` unless the subtree sits in a <Suspense> boundary. Dropping the Prisma
 * query made this line matter more, not less: with no query left, nothing else stops
 * Next from trying to prerender the page at build time, where no search params exist.
 */
export const dynamic = 'force-dynamic';

/** Re-exported so consumers keep importing these from the page. See checklist/page.tsx. */
export type { BudgetCategory, BudgetSubcategory } from "../demo-types";

export default function BudgetWrapper () {
  return (
    <Budget />
  );
}
