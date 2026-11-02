import PageHeader from "@/components/page-header";
import { LoadingRegion, StatRowSkeleton } from "@/components/page-skeletons";
import PlannerPage from "@/components/planner-page";
import SummaryCard from "@/components/summary-card";
import { Skeleton } from "@/components/ui/skeleton";

/** The Dashboard's shape: the strip, then the card grid with each card's real title and link. */
export default function Loading() {
  return (
    <PlannerPage>
      <PageHeader title="Dashboard" subtitle="Sept. 11, 2027" subtitlePlacement="end" />
      <LoadingRegion label="Loading dashboard">
        <StatRowSkeleton count={4} className="mb-8 grid-cols-2 md:grid-cols-4" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard title="Up next" href="/planner/checklist" linkLabel="View checklist" className="md:col-span-2">
            {/* Five tasks' worth. */}
            <Skeleton className="h-81" />
          </SummaryCard>
          <SummaryCard title="Budget" href="/planner/budget" linkLabel="View budget">
            <Skeleton className="h-72" />
          </SummaryCard>
          <SummaryCard title="RSVPs" href="/planner/rsvp" linkLabel="View RSVPs">
            <Skeleton className="h-36" />
          </SummaryCard>
          <SummaryCard title="Registry" href="/planner/registry-manager" linkLabel="View registry">
            <Skeleton className="h-36" />
          </SummaryCard>
          <SummaryCard title="Documents" href="/planner/doc-archive" linkLabel="View documents">
            <Skeleton className="h-36" />
          </SummaryCard>
        </div>
      </LoadingRegion>
    </PlannerPage>
  );
}
