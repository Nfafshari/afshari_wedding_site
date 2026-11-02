"use client";

import { getCategoryTotals } from "@/lib/budget";
import { getChecklistStats } from "@/lib/checklist";
import { getRsvpStats } from "@/lib/rsvp";
import { getDaysRemaining, toWholeDollars } from "@/lib/utils";
import { CategoryWithTasks } from "./checklist/page";
import { BudgetCategory } from "./budget/page";
import { Invitations } from "./rsvp/page";
import { RegistryItem } from "./registry-manager/page";
import BudgetCard from "@/components/budget-card";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import RegistryCard from "@/components/registry-card";
import RsvpCard from "@/components/rsvp-card";
import { Stat, StatRow } from "@/components/stat";
import SummaryCard from "@/components/summary-card";
import UpNextCard from "@/components/up-next-card";

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

  const rsvpStats = getRsvpStats(invitations);
  const checklistStats = getChecklistStats(checklistCategories);
  const budgetTotals = budgetCategories.map(getCategoryTotals);
  const budgetEstimated = budgetTotals.reduce((sum, total) => sum + total.estimated, 0);
  const budgetPaid = budgetTotals.reduce((sum, total) => sum + total.paid, 0);

  return (
    <PlannerPage>
      <PageHeader title="Dashboard" subtitle="Sept. 11, 2027" subtitlePlacement="end" />

      <StatRow className="mb-8 grid-cols-2 md:grid-cols-4">
        <Stat value={daysTilWedding} caption="Days to go" />
        <Stat value={`${rsvpStats.respondedParties} of ${invitations.length}`} caption="Parties responded" />
        <Stat value={toWholeDollars(budgetPaid)} caption={`Paid of ${toWholeDollars(budgetEstimated)}`} tone="success" />
        <Stat value={`${checklistStats.done} of ${checklistStats.total}`} caption="Tasks done" />
      </StatRow>

      {/* One grid: rows stretch their cards to one height. Up next takes two columns from md. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UpNextCard checklistCategories={checklistCategories} className="md:col-span-2" />
        <BudgetCard budgetCategories={budgetCategories} />
        <RsvpCard stats={rsvpStats} partyCount={invitations.length} />
        <RegistryCard registryItems={registryItems} />
        <SummaryCard title="Documents" href="/planner/doc-archive" linkLabel="View documents">
          <Stat value={documentCount} caption={documentCount === 1 ? 'Document' : 'Documents'} className="flex-1 justify-center py-6" />
        </SummaryCard>
      </div>
    </PlannerPage>
  );
}
