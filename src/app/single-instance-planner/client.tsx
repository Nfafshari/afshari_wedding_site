"use client";

import { LucideIcon } from "lucide-react";
import * as Lucide from "lucide-react"
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field"
import { getDaysRemaining } from "@/lib/utils";
import { DEMO_BASE } from "./constants";
import BudgetCard from "./components/budget-card";
import PlannerStatCard from "@/components/planner-stat-card";
import RegistryCard from "./components/registry-card";
import { useDemoPlanner } from "./demo-store";

const NUMBER_OF_INVITED = 32;

export default function Planner() {
  const {
    rsvps,
    budgetCategories,
    taskCategories: checklistCategories,
    registryItems,
    docs,
  } = useDemoPlanner();

  // The real planner takes a `documentCount` prop instead of the rows, because each
  // doc carries a LucideIcon component and a component cannot cross from a Server
  // Component into a client one. Nothing crosses a server boundary here, so the
  // workaround is gone and the count is just a length.
  const documentCount = docs.length;

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

  // Every Rsvp row is a reply, so these count guests across the rows we have rather
  // than filtering for some "responded" flag — there isn't one, and doesn't need to
  // be. A party that hasn't answered simply has no row yet.
  const attendingGuests = rsvps
    .filter((rsvp) => rsvp.attendance)
    .reduce((sum, rsvp) => sum + rsvp.guests.length, 0);
  const declinedGuests = rsvps
    .filter((rsvp) => !rsvp.attendance)
    .reduce((sum, rsvp) => sum + rsvp.guests.length, 0);
  const respondedGuests = attendingGuests + declinedGuests;



  return (
    <div className="flex flex-col w-full min-h-5/6 items-center font-serif">
      <h1 className="page-title p-2 pb-0"> Sept. 11th 2027 </h1>
      <h2 className="page-subtitle p-2 pt-0"> {daysTilWedding} Days to &ldquo;I Do&rdquo; </h2>
      <div className="flex-col w-full h-auto">
        <div className="flex flex-col items-center w-full h-full pt-2 font-serif">
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
                        className="grid grid-rows-3 w-full h-full justify-center items-center border border-burg/10 bg-olivine/15 rounded-md text-burg/65 cursor-pointer hover:shadow active:bg-olivine/20"
                        href={`${DEMO_BASE}/checklist`}
                        key={task.id}
                      >
                        <p className="text-center text-foreground">{task.name}</p>
                        <div className="flex w-full h-auto justify-center items-center">
                          <Icon
                            className="w-10 h-10 text-gold"
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
                    className="flex col-span-3 w-full h-full justify-center items-center border border-burg/10 bg-olivine/15 rounded-md text-burg/65 cursor-pointer hover:shadow active:bg-olivine/20"
                    href={`${DEMO_BASE}/checklist`}
                  >
                    <NextTaskIcon
                      className="w-10 h-10 mr-5 text-gold"
                      strokeWidth={1}
                    />
                    <div className="mt-1 pr-2 overflow-y-scroll">
                      <h1 className="page-subtitle row-span-2 text-burg text-center">{nextTask.task.name}</h1>
                      <p className="text-center pb-2">{nextTask.task.goalDate.toLocaleDateString()}</p>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-center text-burg/60">
              Nothing due yet —{" "}
              <Link href={`${DEMO_BASE}/checklist`} className="underline hover:text-burg">
                add a task
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col w-full h-1/4 justify-center px-10 py-5 text-burg md:px-20">
        <p className="uppercase tracking-[0.16em]">RSVPs</p>
        <Link 
          href={`${DEMO_BASE}/rsvp`}
          className="w-full h-full border-2 border-s-0 border-e-0 border-gold/50 hover:shadow cursor-pointer"
        >
          <div className="grid grid-cols-2 h-full md:grid-cols-4">
            <div className="hidden flex-col w-full h-auto border-e-2 border-e-gold/50 justify-center pl-5 md:flex">
              <p className="stat-number">{NUMBER_OF_INVITED}</p>
              <p className="muted-caption pt-2">Invited</p>
            </div>
            <div className="hidden flex-col w-full h-auto justify-center pl-5 md:border-e-2 md:border-e-gold/50 md:flex">
              <p className="stat-number">{respondedGuests}</p>
              <p className="muted-caption pt-2">Responded</p>
            </div>
            <div className="flex flex-col w-full h-auto justify-center pl-5">
              <p className="stat-number text-olivine">{attendingGuests}</p>
              <p className="muted-caption pt-2">Attending</p>
            </div>
            <div className="flex flex-col w-full h-auto border-s-2 border-s-gold/50 justify-center pl-5">
              <p className="stat-number text-destructive">{declinedGuests}</p>
              <p className="muted-caption pt-2">Declined</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="w-full mb-10 px-10 py-5 md:px-20 lg:mb-0">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,30rem))] justify-center gap-4">
          <BudgetCard budgetCategories={budgetCategories} />
          <RegistryCard registryItems={registryItems} />
          <PlannerStatCard
            title="Documents Archive"
            href={`${DEMO_BASE}/doc-archive`}
            linkLabel="View documents"
            value={documentCount}
            caption={documentCount === 1 ? 'Document' : 'Documents'}
          />
        </div>
      </div>
    </div>
  );
}