// A client component because RSVP_LIST_COLUMNS comes from a client module: a server file
// importing it would get a client reference, not the string.
"use client";

import PageHeader from "@/components/page-header";
import { ActionsSkeleton, FilterRowSkeleton, ListSkeleton, LoadingRegion, StatRowSkeleton } from "@/components/page-skeletons";
import PlannerPage from "@/components/planner-page";
import { RSVP_LIST_COLUMNS } from "@/components/rsvp/rsvp-table";
import { formatRsvpDeadline, isRsvpOpen } from "@/lib/rsvp";

export default function Loading() {
  return (
    <PlannerPage>
      <PageHeader
        title="RSVPs"
        subtitle={`${isRsvpOpen() ? 'RSVPs close' : 'RSVPs closed'} ${formatRsvpDeadline()}`}
        actions={<ActionsSkeleton widths={["w-28", "w-24"]} />}
      />
      <LoadingRegion label="Loading RSVPs">
        <StatRowSkeleton count={4} className="grid-cols-2 md:grid-cols-4" />
        <hr className="my-5 bg-accent" />
        {/* The real filter is about 32.5rem on one line and wraps to two whenever it has less room:
            on phones, and from md until lg where it shares the row with the search box. */}
        <FilterRowSkeleton search filterClassName="h-18 w-full sm:h-9.5 sm:w-[32.5rem] md:h-18 md:w-[26rem] lg:h-9.5 lg:w-[32.5rem]" />
        <ListSkeleton columns={RSVP_LIST_COLUMNS} />
      </LoadingRegion>
    </PlannerPage>
  );
}
