import type { BudgetStatus } from "@/generated/prisma/enums";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const LABEL: Record<BudgetStatus, string> = {
  DUE: "Due",
  DEPOSIT: "Deposit",
  PAID: "Paid",
};

// Nothing paid yet is neutral, part paid is in between, fully paid is done.
const TONE: Record<BudgetStatus, BadgeTone> = {
  DUE: "neutral",
  DEPOSIT: "warning",
  PAID: "success",
};

/** A budget line's payment status as a pill. */
export default function BudgetStatusBadge({ status, className }: { status: BudgetStatus; className?: string }) {
  return (
    <Badge variant={TONE[status]} className={className}>
      {LABEL[status]}
    </Badge>
  );
}
