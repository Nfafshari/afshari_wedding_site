import Link from "next/link";
import { CalendarHeart, MapPin, Plane } from "lucide-react";

import ArtSlot from "@/components/art-slot";
import GuestSection from "@/components/guest-section";
import ArchPhoto from "@/components/arch-photo";
import RsvpBand from "@/components/rsvp-band";
import Sprig from "@/components/sprig";
import { HOME, WEDDING } from "@/lib/guest-content";
import { hasPage } from "@/lib/public-nav";
import { getDaysRemaining } from "@/lib/utils";

/** Re-render hourly, so the countdown and the RSVP band's open/closed state stay current. */
export const revalidate = 3600;

const ICONS = { venue: MapPin, schedule: CalendarHeart, travel: Plane } as const;

const TEXT_LINK = "guest-label rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Home() {
  const days = getDaysRemaining(WEDDING.isoDate);

  return (
    <div>
      {/* overflow-x-clip, not overflow-hidden: on desktop the photo rises into the header. */}
      <GuestSection className="relative overflow-x-clip pt-6 md:pt-10 lg:pb-0">
        <ArtSlot className="absolute -top-6 -left-6 size-40 md:size-56" />
        <div className="relative grid items-center gap-12 md:grid-cols-2">
          <div className="text-center lg:py-16">
            <p className="guest-label">{HOME.welcome}</p>
            <h1 className="guest-display mt-5 text-6xl leading-none md:text-7xl">
              <span className="block">{WEDDING.names[0]}</span>
              <span className="guest-script block py-2 text-4xl md:text-5xl">and</span>
              <span className="block">{WEDDING.names[1]}</span>
            </h1>
            <Sprig className="mx-auto mt-6" />
            <p className="guest-display mt-6 text-2xl">{WEDDING.date}</p>
            <p className="guest-label mt-3">{WEDDING.venue}</p>
            <p className="guest-label mt-1">{WEDDING.place}</p>
            {days > 0 && (
              <p className="mt-5 italic text-burg/70">{days === 1 ? "1 day to go" : `${days} days to go`}</p>
            )}
          </div>
          {/* From lg, like the reference: the arch stretches the full height of the hero, its foot
              meets the next band, and a negative top margin (which works because it stretches)
              lifts its top into the header band, below the links and clear of the medallion.
              z above the header. */}
          <ArchPhoto
            {...HOME.heroPhoto}
            priority
            stretch
            sizes="(min-width: 1024px) 448px, (min-width: 768px) 384px, 90vw"
            className="lg:relative lg:z-50 lg:-mt-29 lg:mr-0 lg:max-w-md lg:self-stretch"
          />
        </div>
      </GuestSection>

      <GuestSection tone="olivine" aria-labelledby="home-story" className="relative overflow-hidden text-center">
        <Sprig className="mx-auto" />
        <h2 id="home-story" className="guest-display mt-4 text-3xl md:text-4xl">{HOME.story.title}</h2>
        <p className="mx-auto mt-5 max-w-prose leading-relaxed">{HOME.story.text}</p>
        {hasPage("/our-story") && (
          <Link href="/our-story" className={`${TEXT_LINK} mt-6 inline-block`}>{HOME.story.linkLabel}</Link>
        )}
      </GuestSection>

      <GuestSection aria-labelledby="home-details" className="text-center">
        <Sprig className="mx-auto" />
        <h2 id="home-details" className="guest-display mt-4 text-3xl md:text-4xl">{HOME.details.title}</h2>
        <ul className="mt-10 grid divide-y divide-gold/50 md:grid-cols-3 md:divide-x md:divide-y-0">
          {HOME.details.items.map((item) => {
            const Icon = ICONS[item.key];
            return (
              <li key={item.key} className="flex flex-col items-center py-8 md:px-8 md:py-2">
                <Icon strokeWidth={1} className="size-12 text-gold-ink" aria-hidden />
                <h3 className="guest-display mt-4 text-xl">{item.title}</h3>
                <p className="mt-2 max-w-60 text-sm leading-relaxed text-burg/70">{item.text}</p>
                {hasPage(item.href) && (
                  <Link href={item.href} className={`${TEXT_LINK} mt-4 text-xs`}>{item.linkLabel}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </GuestSection>

      <RsvpBand />
    </div>
  );
}
