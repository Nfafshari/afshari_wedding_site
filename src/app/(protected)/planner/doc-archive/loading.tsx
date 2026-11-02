import PageHeader from "@/components/page-header";
import { ActionsSkeleton, FilterRowSkeleton, LoadingRegion, TileGridSkeleton } from "@/components/page-skeletons";
import PlannerPage from "@/components/planner-page";

export default function Loading() {
  return (
    <PlannerPage>
      <PageHeader title="Documents" actions={<ActionsSkeleton widths={["w-36"]} />} />
      <LoadingRegion label="Loading documents">
        <FilterRowSkeleton search />
        <TileGridSkeleton />
      </LoadingRegion>
    </PlannerPage>
  );
}
