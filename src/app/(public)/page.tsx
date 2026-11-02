import Image from "next/image";
import Link from "next/link";
import { CalendarHeart, MapPin, Plane } from "lucide-react";

import ArtSlot from "@/components/art-slot";
import GuestSection from "@/components/guest-section";
import LogoSvg from "@/components/logo-svg";
import Sprig from "@/components/sprig";
import { HOME, WEDDING } from "@/lib/guest-content";
import { hasPage } from "@/lib/public-nav";
import { formatRsvpDeadline, isRsvpOpen } from "@/lib/rsvp";
import { cn, getDaysRemaining } from "@/lib/utils";

/** Re-render hourly, so the countdown and the RSVP band's open/closed state stay current. */
export const revalidate = 3600;

const ICONS = { venue: MapPin, schedule: CalendarHeart, travel: Plane } as const;

const TEXT_LINK = "guest-label rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function HeroPhoto({ className }: { className?: string }) {
  const { src, alt, placeholder } = HOME.heroPhoto;

  return (
    <div className={cn("mx-auto w-full max-w-sm rounded-t-full border border-gold/70 p-2.5", className)}>
      <div className="relative aspect-4/5 overflow-hidden rounded-t-full border border-gold/70 bg-olivine-100 lg:aspect-auto lg:flex-1">
        {src ? (
          <Image src={src} alt={alt} fill priority sizes="(min-width: 1024px) 448px, (min-width: 768px) 384px, 90vw" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <LogoSvg aria-hidden className="h-auto w-20 opacity-40" />
            <p className="guest-label">{placeholder}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const days = getDaysRemaining(WEDDING.isoDate);
  const deadline = formatRsvpDeadline();

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
          <HeroPhoto className="lg:relative lg:z-50 lg:-mt-29 lg:mr-0 lg:flex lg:max-w-md lg:flex-col lg:self-stretch" />
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

      <GuestSection tone="burg" aria-labelledby="home-rsvp" className="relative overflow-hidden text-center">
        {/* The gold rules framing the band. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-3 bottom-3 border-y border-gold/60 md:top-4 md:bottom-4" />
        <ArtSlot className="absolute -bottom-6 -left-6 size-32 md:size-48" />
        <ArtSlot className="absolute -right-6 -bottom-6 size-32 md:size-48" />
        <div className="relative">
          <p className="guest-label text-gold">{HOME.rsvp.kicker}</p>
          <h2 id="home-rsvp" className="guest-display mt-2 text-5xl text-cream md:text-6xl">{HOME.rsvp.title}</h2>
          {isRsvpOpen() ? (
            <>
              <p className="guest-label mt-3 text-gold">By {deadline}</p>
              <Link
                href="/rsvp"
                className="guest-label mt-8 inline-block rounded-sm bg-olivine-ink px-10 py-3.5 text-cream hover:bg-olivine-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {HOME.rsvp.button}
              </Link>
            </>
          ) : (
            <p className="guest-label mt-3 text-gold">RSVPs closed on {deadline}</p>
          )}
        </div>
      </GuestSection>
    </div>
  );
}
