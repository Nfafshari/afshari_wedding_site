// A client component because TASK_LIST_COLUMNS comes from a client module: a server file
// importing it would get a client reference, not the string.
"use client";

import PageHeader from "@/components/page-header";
import { ActionsSkeleton, FilterRowSkeleton, ListSkeleton, LoadingRegion, StatRowSkeleton } from "@/components/page-skeletons";
import PlannerPage from "@/components/planner-page";
import { getDaysRemaining } from "@/lib/utils";
import { TASK_LIST_COLUMNS } from "./components/task-list";

export default function Loading() {
  return (
    <PlannerPage>
      <PageHeader
        title="Checklist"
        subtitle={`${getDaysRemaining('2027-09-11')} days to go`}
        actions={<ActionsSkeleton widths={["w-36"]} />}
      />
      <LoadingRegion label="Loading checklist">
        <StatRowSkeleton count={3} className="grid-cols-3" />
        <hr className="my-5 bg-accent" />
        <FilterRowSkeleton />
        <ListSkeleton columns={TASK_LIST_COLUMNS} />
      </LoadingRegion>
    </PlannerPage>
  );
}
