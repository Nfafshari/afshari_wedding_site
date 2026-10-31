import { Skeleton } from "@/components/ui/skeleton";
import TableSkeleton from "@/components/table-skeleton";

export default function Loading() {
  return (
    <div className="w-full px-6 py-2 md:px-12 lg:px-16">
      <Skeleton className="mt-3 h-10 w-56" />
      <hr className="my-5 bg-accent" />
      <TableSkeleton columns={6} />
    </div>
  );
}
