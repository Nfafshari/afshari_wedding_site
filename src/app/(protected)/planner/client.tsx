"use client";

import { LucideIcon } from "lucide-react";
import * as Lucide from "lucide-react"
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field"
import { getDaysRemaining } from "@/lib/utils";
import { getRsvpStats } from "@/lib/rsvp";
import { CategoryWithTasks } from "./checklist/page";
import { BudgetCategory } from "./budget/page";
import { Invitations } from "./rsvp/page";
import { RegistryItem } from "./registry-manager/page";
import BudgetCard from "../../../components/budget-card";
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
    .map(({ task, category }) => ({ task, icon: resolveIcon(category.icon) }));

  const nextTask = upNextTasks[0];
  const NextTaskIcon = nextTask?.icon;

  const rsvpStats = getRsvpStats(invitations);



  return (
    <PlannerPage>
      <PageHeader title="Dashboard" subtitle={`Sept. 11, 2027 · ${daysTilWedding} days to go`} subtitlePlacement="end" />
      <div className="flex-col w-full h-auto">
        <div className="flex flex-col items-center w-full h-full pt-2">
          <Field className="w-2/3">
            <FieldLabel htmlFor="task-progress" className="text-burg/70 font-bold">
              <span className="section-title">Checklist Progress</span>
              <span className="ml-auto">{Math.round(progress)}%</span>
            </FieldLabel>
            <Progress
              id="task-progress"
              value={progress}
            />
          </Field>
          {nextTask && NextTaskIcon ? (
            <>
              <div className="flex w-1/2">
                <p className="section-title hidden mt-3 md:flex">Next Tasks:</p>
              </div>
              <div className="hidden w-full h-full justify-center items-center md:flex">
                <div className="w-1/2 h-full pt-2 m-1 grid grid-cols-3 gap-3 mt-1">
                  {upNextTasks.map(({task, icon}) => {
                    const Icon = icon;
                    return (
                      <Link
                        className="grid grid-rows-3 w-full h-full justify-center items-center border border-burg/10 bg-olivine/15 rounded-md text-burg/70 cursor-pointer hover:shadow-sm active:bg-olivine/20"
                        href={'/planner/checklist'}
                        key={task.id}
                      >
                        <p className="text-center text-foreground">{task.name}</p>
                        <div className="flex w-full h-auto justify-center items-center">
                          <Icon
                            className="w-10 h-10 text-gold-ink"
                            strokeWidth={1}
                          />
                        </div>
                        <p className="text-center">{task.goalDate.toLocaleDateString()}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col w-full h-full justify-center items-center md:hidden">
                <p className="section-title mt-3">Next Tasks:</p>
                <div className="w-1/2 h-full pt-2 m-1 grid grid-cols-3 gap-3 mt-1">
                  <Link
                    className="flex col-span-3 w-full h-full justify-center items-center border border-burg/10 bg-olivine/15 rounded-md text-burg/70 cursor-pointer hover:shadow-sm active:bg-olivine/20"
                    href={'/planner/checklist'}
                  >
                    <NextTaskIcon
                      className="w-10 h-10 mr-5 text-gold-ink"
                      strokeWidth={1}
                    />
                    <div className="mt-1 pr-2">
                      <p className="page-subtitle row-span-2 text-burg text-center">{nextTask.task.name}</p>
                      <p className="text-center pb-2">{nextTask.task.goalDate.toLocaleDateString()}</p>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-center text-burg/70">
              Nothing due yet —{" "}
              <Link href={'/planner/checklist'} className="underline hover:text-burg">
                add a task
              </Link>
              .
            </p>
          )}
        </div>
      </div>

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