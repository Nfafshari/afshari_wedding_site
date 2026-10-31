"use client";

import Link from "next/link";
import { Cell, Pie, PieChart } from "recharts";
import { Receipt } from "lucide-react";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getTopCategoriesWithOther } from "@/lib/budget";
import { toCurrency } from "@/lib/utils";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import SummaryCard from "@/components/summary-card";
import type { BudgetCategory } from "../app/(protected)/planner/budget/page";

interface BudgetCardProps {
  budgetCategories: BudgetCategory[];
}

const SLICE_COLORS = [
  'var(--budget-slice-1)',
  'var(--budget-slice-2)',
  'var(--budget-slice-3)',
  'var(--budget-slice-4)',
  'var(--budget-slice-5)',
];

const OTHER_COLOR = 'var(--budget-slice-other)';

/**
 * ChartContainer requires a config, but ours deliberately carries no colours: ChartStyle
 * emits a `--color-<key>` custom property for every entry that has one, and these keys
 * would be user-written category names — spaces and all — which is invalid CSS. The Cells
 * carry the paint instead, and ChartTooltipContent reads it back off `payload.fill`.
 */
const chartConfig = {
  estimated: { label: 'Estimated' },
} satisfies ChartConfig;

export default function BudgetCard({ budgetCategories }: BudgetCardProps) {
  const slices = getTopCategoriesWithOther(budgetCategories).map((slice, idx) => ({
    ...slice,
    fill: slice.isOther ? OTHER_COLOR : SLICE_COLORS[idx],
  }));

  const totalEstimated = slices.reduce((sum, slice) => sum + slice.estimated, 0);

  return (
    <SummaryCard title="Budget" href="/planner/budget" linkLabel="View budget">

      {/* Covers both "no categories" and "categories that all cost nothing" — Recharts
          draws nothing for all-zero data, which would leave a silently blank card. */}
      {totalEstimated <= 0 ? (
        <EmptyState icon={Receipt} title="Nothing budgeted yet.">
          <Button asChild variant="ghost" size="sm">
            <Link href="/planner/budget">Add to your budget</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="w-full max-h-44 aspect-square">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => (
                      <div className="flex w-full items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-xs"
                          style={{ background: item.payload?.fill }}
                        />
                        <span className="text-muted-foreground">{name}</span>
                        <span className="ml-auto font-mono tabular-nums text-foreground">
                          {toCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              {/* paddingAngle leaves the card surface showing between slices, rather than
                  drawing a border around each one. */}
              <Pie data={slices} dataKey="estimated" nameKey="name" paddingAngle={2} isAnimationActive={false}>
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Two columns: six slices in a single column makes this card tall enough to
              drag its grid row-mates with it. */}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {slices.map((slice) => (
              <li key={slice.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-xs"
                  style={{ background: slice.fill }}
                />
                <span className="truncate text-burg/70">{slice.name}</span>
                <span className="ml-auto font-mono tabular-nums text-burg">
                  {toCurrency(slice.estimated)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </SummaryCard>
  );
}
