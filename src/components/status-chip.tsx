import type { Status } from "@/lib/status";
import { Badge } from "@/components/ui/badge";

/** A status as a pill: `<StatusChip status={BUDGET_STATUS[line.status]} />`. Maps live in lib/status.ts. */
export default function StatusChip({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge variant={status.tone} className={className}>
      {status.label}
    </Badge>
  );
}
