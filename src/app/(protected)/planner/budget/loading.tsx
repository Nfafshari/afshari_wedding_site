// A client component because BUDGET_LIST_COLUMNS comes from a client module: a server file
// importing it would get a client reference, not the string.
"use client";

import PageHeader from "@/components/page-header";
import { ActionsSkeleton, ListSkeleton, LoadingRegion, StatRowSkeleton } from "@/components/page-skeletons";
import PlannerPage from "@/components/planner-page";
import { Skeleton } from "@/components/ui/skeleton";
import { BUDGET_LIMITS } from "@/lib/budget";
import { toCompactCurrency, toWholeDollars } from "@/lib/utils";
import { BUDGET_LIST_COLUMNS } from "./components/category-table";

/** Follows BudgetOverview: the strip, the limit bar and its legend, then the list. */
export default function Loading() {
  return (
    <PlannerPage>
      <PageHeader
        title="Budget"
        subtitle={`Target ${toWholeDollars(BUDGET_LIMITS.target)} · limit ${toWholeDollars(BUDGET_LIMITS.cap)}`}
        actions={<ActionsSkeleton widths={["w-36"]} />}
      />
      <LoadingRegion label="Loading budget">
        <div className="flex flex-col gap-8">
          {/* The last caption assumes the estimate is under the target, the usual case. */}
          <StatRowSkeleton
            count={4}
            captions={["Estimated", "Paid", "Balance due", `Left under the ${toCompactCurrency(BUDGET_LIMITS.target)} target`]}
            className="grid-cols-2 md:grid-cols-4"
          />
          <div>
            <h2 className="section-title">Against your limits</h2>
            <Skeleton className="mt-3 h-3.5 rounded-full" />
            <Skeleton className="mt-9 h-5 w-56" />
          </div>
        </div>
        <div className="mt-12 w-full">
          <h2 className="section-title mb-3">By category</h2>
          <ListSkeleton columns={BUDGET_LIST_COLUMNS} />
        </div>
      </LoadingRegion>
    </PlannerPage>
  );
}
