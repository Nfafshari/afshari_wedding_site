import Link from "next/link";
import { CalendarCheck, type LucideIcon } from "lucide-react";
import * as Lucide from "lucide-react";

import EmptyState from "@/components/empty-state";
import StatusChip from "@/components/status-chip";
import SummaryCard from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { getUpNextTasks, isOverdue } from "@/lib/checklist";
import { OVERDUE_STATUS } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { CategoryWithTasks } from "../app/(protected)/planner/checklist/page";

interface UpNextCardProps {
  checklistCategories: CategoryWithTasks[];
  className?: string;
}

/** The next few undone tasks, overdue first. Tasks borrow their category's icon. */
export default function UpNextCard({ checklistCategories, className }: UpNextCardProps) {
  const upNext = getUpNextTasks(checklistCategories);

  return (
    <SummaryCard title="Up next" href="/planner/checklist" linkLabel="View checklist" className={className}>
      {upNext.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Nothing left to do.">
          <Button asChild variant="ghost" size="sm">
            <Link href="/planner/checklist">Go to checklist</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="flex flex-col divide-y">
          {upNext.map(({ task, category }) => {
            // Same lookup and Astroid fallback the checklist uses.
            const Icon = (Lucide[category.icon as keyof typeof Lucide] ?? Lucide.Astroid) as LucideIcon;
            return (
              <li key={task.id} className="flex items-center gap-3 py-2.5">
                <Icon className="size-5 shrink-0 text-gold-ink" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="break-words">{task.name}</p>
                  <p className="text-sm text-burgundy-600">{category.name} · {formatDate(task.goalDate)}</p>
                </div>
                {isOverdue(task) && <StatusChip status={OVERDUE_STATUS} />}
              </li>
            );
          })}
        </ul>
      )}
    </SummaryCard>
  );
}
