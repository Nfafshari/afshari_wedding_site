import BudgetLimitBar from "@/components/budget-limit-bar";
import { Stat, StatRow } from "@/components/stat";
import { budgetLimitState, type BudgetLimits } from "@/lib/budget";
import { toCompactCurrency, toWholeDollars } from "@/lib/utils";

interface BudgetOverviewProps {
  estimated: number;
  paid: number;
  limits: BudgetLimits;
}

/**
 * The top of the Budget page: the summary strip (whole dollars; the list below keeps
 * the cents), then one bar of paid and estimated against the target and cap.
 */
export default function BudgetOverview ({ estimated, paid, limits }: BudgetOverviewProps) {
  const limit = budgetLimitState(estimated, limits);

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
        <BudgetLimitBar estimated={estimated} paid={paid} limits={limits} />
      </div>
    </section>
  );
}
