import { Stat, StatRow } from "@/components/stat";
import type { RsvpStats as Stats } from "@/lib/rsvp";

interface RsvpStatsProps {
  stats: Stats;
}

/**
 * The summary strip across the top of the RSVP tracker. 2×2 on phones. Plus-ones to
 * review joins the row only while there is one, since it is a to-do, not a total.
 */
export default function RsvpStats ({ stats }: RsvpStatsProps) {
  const hasPlusOnesToReview = stats.pendingPlusOnes > 0;

  return (
    <StatRow className={hasPlusOnesToReview ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"}>
      <Stat value={stats.invited} caption="Invited" />
      <Stat value={stats.attending} caption="Attending" tone="success" />
      <Stat value={stats.declined} caption="Declined" tone="danger" />
      <Stat value={stats.awaitingParties} caption="Parties waiting" />
      {hasPlusOnesToReview && <Stat value={stats.pendingPlusOnes} caption="Plus-ones to review" tone="attention" />}
    </StatRow>
  );
}
