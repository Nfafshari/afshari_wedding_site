import { Stat, StatRow } from "@/components/stat";
import { budgetLimitState, limitBarScale, type BudgetLimits } from "@/lib/budget";
import { cn, toCurrency, toWholeDollars } from "@/lib/utils";

const compactFormatter = new Intl.NumberFormat('en-us', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** $15,000 -> "$15K", for tick labels and the legend. */
function toCompactCurrency (num: number) {
  return compactFormatter.format(num);
}

interface BudgetOverviewProps {
  estimated: number;
  paid: number;
  limits: BudgetLimits;
}

/**
 * The top of the Budget page: the summary strip (whole dollars; the list below keeps
 * the cents), then one bar of paid and estimated
 * against the target and cap. Past the target the warning is gold; past the cap, red.
 */
export default function BudgetOverview ({ estimated, paid, limits }: BudgetOverviewProps) {
  const limit = budgetLimitState(estimated, limits);
  const scale = limitBarScale(estimated, limits.cap);
  const percent = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;

  return (
    <section aria-label="Budget summary" className="flex flex-col gap-8">
      <StatRow className="grid-cols-2 md:grid-cols-4">
        <Stat value={toWholeDollars(estimated)} caption="Estimated" />
        <Stat value={toWholeDollars(paid)} caption="Paid" tone="success" />
        <Stat value={toWholeDollars(estimated - paid)} caption="Balance due" tone="danger" />
        {limit.state === 'over-cap' && (
          <Stat value={toWholeDollars(limit.amount)} caption={`Over the ${toCompactCurrency(limits.cap)} limit`} tone="danger" />
        )}
        {limit.state === 'over-target' && (
          <Stat value={toWholeDollars(limit.amount)} caption={`Over the ${toCompactCurrency(limits.target)} target`} tone="attention" />
        )}
        {limit.state === 'under' && (
          <Stat value={toWholeDollars(limit.amount)} caption={`Left under the ${toCompactCurrency(limits.target)} target`} />
        )}
      </StatRow>

      <div>
        <h2 className="section-title">Against your limits</h2>
        {/* Drawn back to front: the overflow past the cap, the estimate up to the cap, then paid. */}
        <div
          role="img"
          aria-label={`Paid ${toCurrency(paid)} and estimated ${toCurrency(estimated)}, against a ${toCurrency(limits.target)} target and ${toCurrency(limits.cap)} limit`}
          className="relative mt-3 h-3.5 rounded-full bg-olivine-100"
        >
          {limit.state === 'over-cap' && (
            <span className="absolute inset-y-0 left-0 rounded-full bg-destructive" style={{ width: percent(estimated) }} />
          )}
          <span
            className={cn("absolute inset-y-0 left-0 bg-gold-500", limit.state === 'over-cap' ? "rounded-l-full" : "rounded-full")}
            style={{ width: percent(Math.min(estimated, limits.cap)) }}
          />
          <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: percent(paid) }} />
          <LimitTick at={percent(limits.target)} label="Target" amount={limits.target} />
          <LimitTick at={percent(limits.cap)} label="Limit" amount={limits.cap} />
        </div>

        <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-1 text-sm text-burgundy-600">
          <LegendItem swatch="bg-primary">Paid {toCompactCurrency(paid)}</LegendItem>
          <LegendItem swatch="bg-gold-500">Estimated {toCompactCurrency(estimated)}</LegendItem>
          {limit.state === 'over-cap' && (
            <LegendItem swatch="bg-destructive">Over the limit {toCompactCurrency(limit.amount)}</LegendItem>
          )}
        </ul>
      </div>
    </section>
  );
}

/** A mark on the bar with its label underneath; phones drop the word to fit. */
function LimitTick ({ at, label, amount }: { at: string; label: string; amount: number }) {
  return (
    <span aria-hidden className="absolute -top-1 -bottom-1 w-px bg-foreground" style={{ left: at }}>
      <span className="absolute top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs text-burgundy-600">
        <span className="hidden sm:inline">{label} </span>{toCompactCurrency(amount)}
      </span>
    </span>
  );
}

function LegendItem ({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 rounded-full", swatch)} />
      {children}
    </li>
  );
}
