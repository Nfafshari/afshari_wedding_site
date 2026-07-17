import Link from "next/link";

interface PlannerStatCardProps {
  title: string;
  /** Where the card's header link goes. */
  href: string;
  linkLabel: string;
  value: number;
  /** What the number counts, e.g. "Documents". */
  caption: string;
}

/**
 * A dashboard card whose content is a single number.
 *
 * Shares its shell with BudgetCard so the planner's card row reads as one set. The
 * header link rather than a link-wrapped card is BudgetCard's pattern — it has a
 * chart inside it and cannot be wrapped — and matching it keeps the row consistent.
 */
export default function PlannerStatCard ({
  title,
  href,
  linkLabel,
  value,
  caption,
}: PlannerStatCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4 border border-burg/8 rounded-lg bg-olivine/15">
      <div className="flex items-baseline justify-between gap-2">
        <p className="section-title pr-2">{title}</p>
        <Link
          href={href}
          className="text-sm text-burg/60 underline whitespace-nowrap hover:text-burg"
        >
          {linkLabel}
        </Link>
      </div>

      <div className="flex flex-col flex-1 gap-2 items-center justify-center py-6">
        <p className="stat-number">{value}</p>
        <p className="muted-caption text-base">{caption}</p>
      </div>
    </div>
  );
}
