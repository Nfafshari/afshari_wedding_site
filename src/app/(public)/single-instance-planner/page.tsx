import Planner from "./client";

/** Render per request rather than at build time, matching the checklist and budget pages. */
export const dynamic = 'force-dynamic';

export default function PlannerWrapper() {
  return <Planner />;
}
