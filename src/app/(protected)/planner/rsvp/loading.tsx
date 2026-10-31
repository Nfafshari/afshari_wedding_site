import { Skeleton } from "@/components/ui/skeleton";
import PlannerPage from "@/components/planner-page";
import TableSkeleton from "@/components/table-skeleton";

export default function Loading() {
  return (
    <PlannerPage>
      <Skeleton className="h-10 w-56" />
      <hr className="my-6 bg-accent" />
      <TableSkeleton columns={4} />
    </PlannerPage>
  );
}
