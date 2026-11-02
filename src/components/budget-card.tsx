import Link from "next/link";
import { Receipt } from "lucide-react";

import BudgetLimitBar from "@/components/budget-limit-bar";
import EmptyState from "@/components/empty-state";
import SummaryCard from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { BUDGET_LIMITS, getCategoryTotals, getTopCategoriesWithOther } from "@/lib/budget";
import { cn, toWholeDollars } from "@/lib/utils";
import type { BudgetCategory } from "../app/(protected)/planner/budget/page";

interface BudgetCardProps {
  budgetCategories: BudgetCategory[];
  className?: string;
}

/** Paid and estimated against the limits, then the biggest categories as bars against the largest. */
export default function BudgetCard({ budgetCategories, className }: BudgetCardProps) {
  const totals = budgetCategories.map(getCategoryTotals);
  const estimated = totals.reduce((sum, total) => sum + total.estimated, 0);
  const paid = totals.reduce((sum, total) => sum + total.paid, 0);
  const rows = getTopCategoriesWithOther(budgetCategories);
  const largest = Math.max(...rows.map((row) => row.estimated));

  return (
    <SummaryCard title="Budget" href="/planner/budget" linkLabel="View budget" className={className}>
      {/* Covers both "no categories" and "categories that all cost nothing". */}
      {estimated <= 0 ? (
        <EmptyState icon={Receipt} title="Nothing budgeted yet.">
          <Button asChild variant="ghost" size="sm">
            <Link href="/planner/budget">Add to your budget</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <BudgetLimitBar estimated={estimated} paid={paid} limits={BUDGET_LIMITS} />

          <ul aria-label="Biggest categories" className="mt-2 flex flex-col gap-2.5">
            {rows.map((row) => (
              <li key={row.name} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 truncate text-burgundy-600">{row.name}</span>
                  <span className="ml-auto tabular-nums lining-nums text-burg">{toWholeDollars(row.estimated)}</span>
                </div>
                <div aria-hidden className="mt-1 h-1.5 rounded-full bg-olivine-100">
                  <div
                    className={cn("h-full rounded-full", row.isOther ? "bg-stone-300" : "bg-gold-500")}
                    style={{ width: `${(row.estimated / largest) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </SummaryCard>
  );
}
