import { getBudgetCategories } from "./budget/page";
import { getCategories as getChecklistCategories } from "./checklist/page";
import Planner from "./client";
import { getRsvps } from "./rsvp/page";
import { getRegistryItems } from "./registry-manager/page";
import { getDocumentCount } from "./doc-archive/page";

/** Render per request rather than at build time, matching the checklist and budget pages. */
export const dynamic = 'force-dynamic';

export default async function PlannerWrapper() {
  // get all data needed
  const rsvps = await getRsvps();
  const budgetCategories = await getBudgetCategories();
  const checklistCategories = await getChecklistCategories();
  const registryItems = await getRegistryItems();
  const documentCount = await getDocumentCount();

  return (
    <Planner
      rsvps={rsvps}
      budgetCategories={budgetCategories}
      checklistCategories={checklistCategories}
      registryItems={registryItems}
      documentCount={documentCount}
    />
  );
}