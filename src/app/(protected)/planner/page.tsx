import { getBudgetCategories } from "./budget/page";
import { getCategories as getChecklistCategories } from "./checklist/page";
import Planner from "./client";
import { getRsvps } from "./rsvp/page";

/** Render per request rather than at build time, matching the checklist and budget pages. */
export const dynamic = 'force-dynamic';

export default async function PlannerWrapper() {
  // get all data needed
  const rsvps = await getRsvps();
  const budgetCategories = await getBudgetCategories();
  const checklistCategories = await getChecklistCategories();

  return (
    <Planner 
      rsvps={rsvps}
      budgetCategories={budgetCategories}
      checklistCategories={checklistCategories}
    />
  );
}