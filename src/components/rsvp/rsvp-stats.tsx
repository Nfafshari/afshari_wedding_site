import type { RsvpStats as Stats } from "@/lib/rsvp";

interface RsvpStatsProps {
  stats: Stats;
}

/** The stat strip across the top of the RSVP tracker. */
export default function RsvpStats ({ stats }: RsvpStatsProps) {
  return (
    <div className="flex w-full justify-center">
      <div className="grid grid-cols-2 w-full h-full gap-y-4 md:grid-cols-4">
        <div className="flex flex-col w-full h-auto items-center md:border-e-2 md:border-e-accent">
          <p className="stat-number">{stats.invited}</p>
          <p className="muted-caption pt-2">Invited</p>
        </div>
        <div className="flex flex-col w-full h-auto items-center border-s-2 border-s-accent md:border-s-0 md:border-e-2 md:border-e-accent">
          <p className="stat-number">{stats.awaitingParties}</p>
          <p className="muted-caption pt-2">Parties Awaiting</p>
        </div>
        <div className="flex flex-col w-full h-auto items-center">
          <p className="stat-number text-olivine">{stats.attending}</p>
          <p className="muted-caption pt-2">Attending</p>
        </div>
        <div className="flex flex-col w-full h-auto items-center border-s-2 border-s-accent">
          <p className="stat-number text-destructive">{stats.declined}</p>
          <p className="muted-caption pt-2">Declined</p>
        </div>
      </div>
    </div>
  );
}
