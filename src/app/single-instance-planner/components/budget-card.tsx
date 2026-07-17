"use client";

/**
 * Demo fork of `src/components/budget-card.tsx`. Identical rendering; the only
 * differences are the type source (demo-types, not the real budget page) and the
 * links, which stay inside the demo tree. Fixes to the real card do not reach
 * this one — keep the two in step by hand.
 */

import Link from "next/link";
import { Cell, Pie, PieChart } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getTopCategoriesWithOther } from "@/lib/budget";
import { toCurrency } from "@/lib/utils";
import type { BudgetCategory } from "../demo-types";
import { DEMO_BASE } from "../constants";

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

export default function BudgetCard ({ budgetCategories }: BudgetCardProps) {
  const slices = getTopCategoriesWithOther(budgetCategories).map((slice, idx) => ({
    ...slice,
    fill: slice.isOther ? OTHER_COLOR : SLICE_COLORS[idx],
  }));

  const totalEstimated = slices.reduce((sum, slice) => sum + slice.estimated, 0);

  return (
    <div className="flex flex-col gap-3 p-4 border border-burg/8 rounded-lg bg-olivine/15">
      <div className="flex items-baseline justify-between gap-2">
        <p className="section-title">Budget Breakdown</p>
        <Link
          href={`${DEMO_BASE}/budget`}
          className="text-sm text-burg/60 underline whitespace-nowrap hover:text-burg"
        >
          View budget
        </Link>
      </div>

      {/* Covers both "no categories" and "categories that all cost nothing" — Recharts
          draws nothing for all-zero data, which would leave a silently blank card. */}
      {totalEstimated <= 0 ? (
        <div className="flex flex-col flex-1 gap-3 items-center justify-center py-6">
          <div className="size-24 rounded-full border-8 border-(--budget-slice-other)/40" />
          <p className="text-center text-sm text-burg/60">Nothing budgeted yet.</p>
          <Link href={`${DEMO_BASE}/budget`} className="text-sm underline text-burg/60 hover:text-burg">
            Add to your budget
          </Link>
        </div>
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
                          className="size-2.5 shrink-0 rounded-[2px]"
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
                  className="size-2.5 shrink-0 rounded-[2px]"
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
    </div>
  );
}
