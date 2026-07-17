"use client";

import { DemoPlannerProvider } from "./demo-store";
import DemoBanner from "./components/demo-banner";

/**
 * Mounts the demo's store around every demo route.
 *
 * It lives in a layout rather than in each page because Next preserves layouts
 * across navigations within a segment — the provider never unmounts, so edits
 * survive moving between the checklist, the budget and the dashboard. A hard
 * refresh remounts it and the seed comes back, which is the point.
 *
 * A client layout can still receive Server Component `children`: they arrive as an
 * already-rendered prop. Context reaches any *client* descendant regardless of who
 * rendered it.
 */
export default function SingleInstancePlannerLayout ({ children }: { children: React.ReactNode }) {

  return (
    <DemoPlannerProvider>
      <DemoBanner />
      {children}
    </DemoPlannerProvider>
  );
}
