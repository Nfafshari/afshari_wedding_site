import Link from "next/link";
import { Users } from "lucide-react";

import EmptyState from "@/components/empty-state";
import { Stat, StatRow } from "@/components/stat";
import SummaryCard from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import type { RsvpStats } from "@/lib/rsvp";

interface RsvpCardProps {
  /** From getRsvpStats, which the Dashboard also uses for its strip. */
  stats: RsvpStats;
  partyCount: number;
  className?: string;
}

/** Who's coming, who isn't and how many parties haven't answered, plus plus-ones waiting on you. */
export default function RsvpCard({ stats, partyCount, className }: RsvpCardProps) {
  return (
    <SummaryCard title="RSVPs" href="/planner/rsvp" linkLabel="View RSVPs" className={className}>
      {partyCount === 0 ? (
        <EmptyState icon={Users} title="No one on the guest list yet.">
          <Button asChild variant="ghost" size="sm">
            <Link href="/planner/rsvp">Add a party</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <StatRow className="grid-cols-3">
            <Stat value={stats.attending} caption="Attending" tone="success" />
            <Stat value={stats.declined} caption="Declined" tone="danger" />
            <Stat value={stats.awaitingParties} caption="Parties awaiting" />
          </StatRow>
          {stats.pendingPlusOnes > 0 && (
            <p className="text-sm text-gold-ink">
              {stats.pendingPlusOnes} {stats.pendingPlusOnes === 1 ? 'plus-one' : 'plus-ones'} to review
            </p>
          )}
        </div>
      )}
    </SummaryCard>
  );
}
