import { budgetLimitState, limitBarScale, type BudgetLimits } from "@/lib/budget";
import { cn, toCompactCurrency, toCurrency } from "@/lib/utils";

interface BudgetLimitBarProps {
  estimated: number;
  paid: number;
  limits: BudgetLimits;
}

/**
 * One bar of paid and estimated against the target and cap, with its legend. Past the
 * target the warning is gold; past the cap, red. Shared by the Budget page and the Dashboard.
 */
export default function BudgetLimitBar ({ estimated, paid, limits }: BudgetLimitBarProps) {
  const limit = budgetLimitState(estimated, limits);
  const scale = limitBarScale(estimated, limits.cap);
  const percent = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;

  return (
    <div>
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
