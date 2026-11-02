import Link from "next/link";

import ArtSlot from "@/components/art-slot";
import GuestSection from "@/components/guest-section";
import { RSVP_BAND } from "@/lib/guest-content";
import { formatRsvpDeadline, isRsvpOpen } from "@/lib/rsvp";

const BUTTON = "guest-label inline-block rounded-sm bg-olivine-ink px-10 py-3.5 text-cream hover:bg-olivine-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

interface RsvpBandProps {
  /**
   * `full` (Home): "Kindly RSVP by …", and says when RSVPs have closed.
   * `slim` (other pages): one line and the button, and nothing once RSVPs close.
   */
  variant?: "full" | "slim";
}

/**
 * The burgundy band that sends guests to /rsvp, framed by gold rules. The page using it must
 * re-render regularly (`revalidate`), because whether RSVPs are open is decided at render.
 */
export default function RsvpBand({ variant = "full" }: RsvpBandProps) {
  const isOpen = isRsvpOpen();
  if (variant === "slim" && !isOpen) return null;

  const deadline = formatRsvpDeadline();

  return (
    <GuestSection
      tone="burg"
      aria-labelledby={variant === "full" ? "rsvp-band-title" : undefined}
      className={variant === "slim" ? "relative overflow-hidden py-12 text-center md:py-14" : "relative overflow-hidden text-center"}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-3 bottom-3 border-y border-gold/60 md:top-4 md:bottom-4" />
      {variant === "full" && (
        <>
          <ArtSlot className="absolute -bottom-6 -left-6 size-32 md:size-48" />
          <ArtSlot className="absolute -right-6 -bottom-6 size-32 md:size-48" />
        </>
      )}
      <div className="relative">
        {variant === "slim" ? (
          <>
            <p className="guest-display text-2xl text-cream md:text-3xl">{RSVP_BAND.slimLine}</p>
            <Link href="/rsvp" className={`${BUTTON} mt-6`}>{RSVP_BAND.button}</Link>
          </>
        ) : (
          <>
            <p className="guest-label text-gold">{RSVP_BAND.kicker}</p>
            <h2 id="rsvp-band-title" className="guest-display mt-2 text-5xl text-cream md:text-6xl">{RSVP_BAND.title}</h2>
            {isOpen ? (
              <>
                <p className="guest-label mt-3 text-gold">By {deadline}</p>
                <Link href="/rsvp" className={`${BUTTON} mt-8`}>{RSVP_BAND.button}</Link>
              </>
            ) : (
              <p className="guest-label mt-3 text-gold">RSVPs closed on {deadline}</p>
            )}
          </>
        )}
      </div>
    </GuestSection>
  );
}
