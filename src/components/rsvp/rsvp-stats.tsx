import { Stat, StatRow } from "@/components/stat";
import type { RsvpStats as Stats } from "@/lib/rsvp";

interface RsvpStatsProps {
  stats: Stats;
}

/** The stat strip across the top of the RSVP tracker. 2×2 on phones, so it draws its own rules. */
export default function RsvpStats ({ stats }: RsvpStatsProps) {
  return (
    <StatRow divided={false} className="grid-cols-2 md:grid-cols-4">
      <Stat value={stats.invited} caption="Invited" className="md:border-e-2 md:border-e-accent" />
      <Stat value={stats.awaitingParties} caption="Parties Awaiting" className="border-s-2 border-s-accent md:border-s-0 md:border-e-2 md:border-e-accent" />
      <Stat value={stats.attending} caption="Attending" tone="success" />
      <Stat value={stats.declined} caption="Declined" tone="danger" className="border-s-2 border-s-accent" />
    </StatRow>
  );
}
