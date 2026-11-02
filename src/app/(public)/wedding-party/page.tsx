import type { Metadata } from "next";
import Image from "next/image";

import GuestSection from "@/components/guest-section";
import PhotoPlaceholder from "@/components/photo-placeholder";
import RsvpBand from "@/components/rsvp-band";
import Sprig from "@/components/sprig";
import { WEDDING_PARTY } from "@/lib/guest-content";

export const metadata: Metadata = {
  title: "Wedding Party · Piper & Nathen",
};

/** Re-render hourly, so the RSVP band disappears once RSVPs close. */
export const revalidate = 3600;

export default function WeddingPartyPage() {
  return (
    <div>
      <GuestSection className="pt-6 pb-10 text-center md:pt-10 md:pb-14">
        <h1 className="guest-display text-5xl md:text-6xl">{WEDDING_PARTY.title}</h1>
        <Sprig className="mx-auto mt-6" />
        <p className="mx-auto mt-6 max-w-prose leading-relaxed">{WEDDING_PARTY.intro}</p>
      </GuestSection>

      <GuestSection className="pt-0 md:pt-0">
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {WEDDING_PARTY.people.map((person, index) => (
            // Placeholder names repeat, so the position is the key.
            <li key={index} className="mx-auto flex w-full max-w-xs flex-col items-center text-center">
              {person.photo.src ? (
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-sm border border-gold/50">
                  <Image src={person.photo.src} alt={person.photo.alt} fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw" className="object-cover" />
                </div>
              ) : (
                <PhotoPlaceholder label={WEDDING_PARTY.photoPlaceholder} className="aspect-3/4 w-full" />
              )}
              <h2 className="guest-display mt-5 text-2xl">{person.name}</h2>
              <p className="guest-label mt-1">{person.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-burg/70">{person.line}</p>
            </li>
          ))}
        </ul>
      </GuestSection>

      <RsvpBand variant="slim" />
    </div>
  );
}
