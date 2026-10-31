import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

/** A table-shaped placeholder while a planner page loads. */
export default function TableSkeleton({ columns, rows = 4 }: TableSkeletonProps) {
  const cells = Array.from({ length: columns }, (_, i) => i);

  return (
    <div role="status" aria-label="Loading">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow variant="heading">
            {cells.map((i) => (
              <TableHead key={i} variant="label">
                <Skeleton className="h-3 w-16 max-w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row} variant="static">
              {cells.map((i) => (
                <TableCell key={i} className="py-3">
                  {/* The first column is the widest, like a name. */}
                  <Skeleton className={i === 0 ? "h-4 w-3/4" : "h-4 w-1/2"} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
