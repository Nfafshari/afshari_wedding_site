"use client";

import { CalendarCheck, LucideIcon } from "lucide-react";
import * as Lucide from "lucide-react"
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field"
import { formatDate, getDaysRemaining } from "@/lib/utils";
import { getRsvpStats } from "@/lib/rsvp";
import { CategoryWithTasks } from "./checklist/page";
import { BudgetCategory } from "./budget/page";
import { Invitations } from "./rsvp/page";
import { RegistryItem } from "./registry-manager/page";
import BudgetCard from "../../../components/budget-card";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import RegistryCard from "@/components/registry-card";
import { Stat, StatRow } from "@/components/stat";
import SummaryCard from "@/components/summary-card";

interface PlannerProps {
  invitations: Invitations[];
  budgetCategories: BudgetCategory[];
  checklistCategories: CategoryWithTasks[];
  registryItems: RegistryItem[];
  /** A count, not rows: the archive's mock docs carry LucideIcons, which don't serialize. */
  documentCount: number;
}

export default function Planner({
  invitations,
  budgetCategories,
  checklistCategories,
  registryItems,
  documentCount,
}: PlannerProps) {
  // days until our wedding date
  const daysTilWedding = getDaysRemaining('2027-09-11');


  // Tasks have no icon of their own — they borrow their category's. Same lookup
  // and Astroid fallback the checklist uses, since both read the string the
  // category icon picker wrote.
  const resolveIcon = (iconName: string | null) =>
    (Lucide[iconName as keyof typeof Lucide] ?? Lucide.Astroid) as LucideIcon;

  const allTasks = checklistCategories.flatMap((category) => category.tasks);
  const tasksDone = allTasks.filter((task) => task.status).length;
  const progress = allTasks.length === 0 ? 0 : (tasksDone / allTasks.length) * 100;

  // A task due today is still up next; only dates strictly before today drop off.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // getCategories orders tasks only *within* a category, so flattening across
  // categories throws that order away — hence the sort. Ties break on id for the
  // same reason the query does it: otherwise equal goal dates can swap places.
  const upNextTasks = checklistCategories
    .flatMap((category) => category.tasks.map((task) => ({ task, category })))
    .filter(({ task }) => !task.status && task.goalDate >= startOfToday)
    .sort((a, b) =>
      a.task.goalDate.getTime() - b.task.goalDate.getTime() || a.task.id - b.task.id
    )
    .slice(0, 3)
    .map(({ task, category }) => ({ task, categoryName: category.name, icon: resolveIcon(category.icon) }));

  const rsvpStats = getRsvpStats(invitations);



  return (
    <PlannerPage>
      <PageHeader title="Dashboard" subtitle={`Sept. 11, 2027 · ${daysTilWedding} days to go`} subtitlePlacement="end" />
      <Field>
        <FieldLabel htmlFor="task-progress" className="text-burg/70 font-bold">
          <span className="section-title">Checklist Progress</span>
          <span className="ml-auto">{Math.round(progress)}%</span>
        </FieldLabel>
        <Progress
          id="task-progress"
          value={progress}
        />
      </Field>

      <section aria-labelledby="next-tasks-title" className="mt-6">
        <h2 id="next-tasks-title" className="section-title mb-2">Next Tasks</h2>
        {upNextTasks.length > 0 ? (
          // One layout at every width: stacked on phones, three across from md.
          <ul className="grid gap-3 md:grid-cols-3">
            {upNextTasks.map(({ task, categoryName, icon: Icon }) => (
              <li key={task.id}>
                <Link
                  href={`/planner/checklist?category=${encodeURIComponent(categoryName)}`}
                  className="flex h-full items-center gap-3 rounded-lg border border-burg/8 bg-olivine/15 p-3 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Icon className="size-8 shrink-0 text-gold-ink" strokeWidth={1} aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{task.name}</p>
                    <p className="text-sm text-burg/70">{formatDate(task.goalDate)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarCheck} title="Nothing due yet.">
            <Button asChild variant="ghost" size="sm">
              <Link href="/planner/checklist">Go to checklist</Link>
            </Button>
          </EmptyState>
        )}
      </section>

      <div className="flex flex-col w-full justify-center py-5">
        <p className="uppercase tracking-[0.16em]">RSVPs</p>
        <Link
          href={'/planner/rsvp'}
          className="w-full border-2 border-s-0 border-e-0 border-gold/50 hover:shadow-sm cursor-pointer"
        >
          {/* Phones show only the two answers; the first two stats join from md. */}
          <StatRow className="grid-cols-2 md:grid-cols-4">
            <Stat value={rsvpStats.invited} caption="Invited" className="hidden md:flex" />
            <Stat value={rsvpStats.respondedParties} caption="Parties Responded" className="hidden md:flex" />
            <Stat value={rsvpStats.attending} caption="Attending" tone="success" />
            <Stat value={rsvpStats.declined} caption="Declined" tone="danger" />
          </StatRow>
        </Link>
      </div>

      <div className="w-full py-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,30rem))] justify-center gap-4">
          <BudgetCard budgetCategories={budgetCategories} />
          <RegistryCard registryItems={registryItems} />
          <SummaryCard title="Documents" href="/planner/doc-archive" linkLabel="View documents">
            <Stat value={documentCount} caption={documentCount === 1 ? 'Document' : 'Documents'} className="flex-1 justify-center py-6" />
          </SummaryCard>
        </div>
      </div>
    </PlannerPage>
  );
}