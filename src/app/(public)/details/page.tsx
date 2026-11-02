import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

import GuestSection from "@/components/guest-section";
import PhotoPlaceholder from "@/components/photo-placeholder";
import RsvpBand from "@/components/rsvp-band";
import Sprig from "@/components/sprig";
import { DETAILS, WEDDING } from "@/lib/guest-content";

export const metadata: Metadata = {
  title: "Details · Piper & Nathen",
};

/** Re-render hourly, so the RSVP band disappears once RSVPs close. */
export const revalidate = 3600;

/** Home links to these anchors; the margin keeps a heading off the window's top edge. */
const ANCHOR = "scroll-mt-6";

/** A link that opens in a new tab, and says so. */
function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="guest-label inline-flex items-center gap-1.5 rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ExternalLink className="size-3.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <Sprig className="mx-auto" />
      <h2 id={id} className="guest-display mt-4 text-3xl md:text-4xl">{children}</h2>
    </div>
  );
}

export default function DetailsPage() {
  const { venue, schedule, travel } = DETAILS;

  return (
    <div>
      <GuestSection className="pt-6 pb-4 text-center md:pt-10 md:pb-6">
        <h1 className="guest-display text-5xl md:text-6xl">{DETAILS.title}</h1>
      </GuestSection>

      <GuestSection id="venue" aria-labelledby="venue-title" className={ANCHOR}>
        <SectionHeading id="venue-title">{venue.title}</SectionHeading>
        <div className="mt-10 grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {venue.photo.src ? (
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm border border-gold/50">
              <Image src={venue.photo.src} alt={venue.photo.alt} fill sizes="(min-width: 768px) 480px, 90vw" className="object-cover" />
            </div>
          ) : (
            <PhotoPlaceholder label={DETAILS.photoPlaceholder} className="aspect-4/3 w-full" />
          )}
          <div className="text-center md:text-left">
            <p className="guest-display text-2xl">{WEDDING.venue}</p>
            <p className="guest-label mt-2">{WEDDING.place}</p>
            <p className="mt-4 text-burg/70">{venue.address}</p>
            <p className="mt-4 leading-relaxed">{venue.note}</p>
            <div className="mt-6">
              <OutLink href={venue.mapUrl}>{venue.mapLabel}</OutLink>
            </div>
          </div>
        </div>
      </GuestSection>

      <GuestSection id="schedule" tone="olivine" aria-labelledby="schedule-title" className={ANCHOR}>
        <SectionHeading id="schedule-title">{schedule.title}</SectionHeading>
        {schedule.days.map((day) => (
          <div key={day.label} className="mx-auto mt-10 max-w-xl">
            <h3 className="guest-label text-center">{day.label}</h3>
            {/* The gold line down the left, with a dot per event. */}
            <ol className="mt-6 border-l border-gold/70 pl-8">
              {day.events.map((event) => (
                <li key={event.name} className="relative pb-10 last:pb-0">
                  <span aria-hidden className="absolute top-2 -left-[37.5px] size-2.5 rounded-full bg-gold" />
                  <div className="grid gap-1 sm:grid-cols-[6.5rem_1fr] sm:gap-6">
                    <p className="guest-display text-xl">{event.time}</p>
                    <div>
                      <h4 className="guest-display text-2xl">{event.name}</h4>
                      <p className="mt-1">{event.place}</p>
                      <p className="mt-1 text-sm italic text-burg/70">{event.note}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </GuestSection>

      <GuestSection id="travel" aria-labelledby="travel-title" className={ANCHOR}>
        <SectionHeading id="travel-title">{travel.title}</SectionHeading>
        <p className="mx-auto mt-6 max-w-prose text-center leading-relaxed">{travel.intro}</p>
        <h3 className="guest-label mt-12 text-center">{travel.hotelsTitle}</h3>
        <ul className="mx-auto mt-6 grid max-w-3xl gap-6 md:grid-cols-2">
          {travel.hotels.map((hotel) => (
            <li key={hotel.name} className="flex flex-col items-center rounded-sm border border-gold/50 px-6 py-8 text-center">
              <p className="guest-display text-2xl">{hotel.name}</p>
              <p className="mt-1 text-burg/70">{hotel.town}</p>
              {hotel.blockCode && (
                <p className="mt-3 text-sm">
                  Room block code: <span className="font-semibold">{hotel.blockCode}</span>
                </p>
              )}
              <div className="mt-5">
                <OutLink href={hotel.url}>{travel.bookLabel}</OutLink>
              </div>
            </li>
          ))}
        </ul>
      </GuestSection>

      <RsvpBand variant="slim" />
    </div>
  );
}
