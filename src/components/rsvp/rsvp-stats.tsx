import { Stat, StatRow } from "@/components/stat";
import type { RsvpStats as Stats } from "@/lib/rsvp";

interface RsvpStatsProps {
  stats: Stats;
}

/** The summary strip across the top of the RSVP tracker. 2×2 on phones. */
export default function RsvpStats ({ stats }: RsvpStatsProps) {
  return (
    <StatRow className="grid-cols-2 md:grid-cols-4">
      <Stat value={stats.invited} caption="Invited" />
      <Stat value={stats.awaitingParties} caption="Parties awaiting" />
      <Stat value={stats.attending} caption="Attending" tone="success" />
      <Stat value={stats.declined} caption="Declined" tone="danger" />
    </StatRow>
  );
}
