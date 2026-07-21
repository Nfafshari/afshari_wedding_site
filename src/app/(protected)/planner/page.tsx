import { getBudgetCategories } from "./budget/page";
import { getCategories as getChecklistCategories } from "./checklist/page";
import Planner from "./client";
import { getRsvps } from "./rsvp/page";
import { getRegistryItems } from "./registry-manager/page";
import { EXAMPLE_DOCS_DATA } from "./doc-archive/data";

/** Render per request rather than at build time, matching the checklist and budget pages. */
export const dynamic = 'force-dynamic';

export default async function PlannerWrapper() {
  // get all data needed
  const rsvps = await getRsvps();
  const budgetCategories = await getBudgetCategories();
  const checklistCategories = await getChecklistCategories();
  const registryItems = await getRegistryItems();

  // There is no Document table yet, so the archive's count comes off its mock array.
  // The length is taken here rather than passing the rows: each doc carries a
  // LucideIcon component, which cannot cross into a client component. Swap this for a
  // real query and the card below never notices.
  const documentCount = EXAMPLE_DOCS_DATA.length;

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