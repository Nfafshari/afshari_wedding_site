// A client component because REGISTRY_LIST_COLUMNS comes from a client module: a server file
// importing it would get a client reference, not the string.
"use client";

import PageHeader from "@/components/page-header";
import { ActionsSkeleton, ListSkeleton, LoadingRegion, StatRowSkeleton } from "@/components/page-skeletons";
import PlannerPage from "@/components/planner-page";
import { REGISTRY_LIST_COLUMNS } from "./components/registry-list";

export default function Loading() {
  return (
    <PlannerPage>
      <PageHeader title="Registry" actions={<ActionsSkeleton widths={["w-28"]} />} />
      <LoadingRegion label="Loading registry">
        <StatRowSkeleton count={3} className="grid-cols-3" />
        <hr className="my-5 bg-accent" />
        <ListSkeleton columns={REGISTRY_LIST_COLUMNS} rows={2} />
      </LoadingRegion>
    </PlannerPage>
  );
}
