import type { Metadata } from "next";

import FaqList from "@/components/faq-list";
import GuestSection from "@/components/guest-section";
import RsvpBand from "@/components/rsvp-band";
import Sprig from "@/components/sprig";
import { FAQ } from "@/lib/guest-content";
import { hasPage } from "@/lib/public-nav";
import { formatRsvpDeadline } from "@/lib/rsvp";

export const metadata: Metadata = {
  title: "FAQ · Piper & Nathen",
};

/** Re-render hourly, so the RSVP band disappears once RSVPs close. */
export const revalidate = 3600;

export default function FaqPage() {
  const deadline = formatRsvpDeadline();
  // Fill in the deadline, and drop links to pages that don't exist yet.
  const items = FAQ.items.map((item) => ({
    question: item.question,
    answer: item.answer.replace("{deadline}", deadline),
    link: item.link && hasPage(item.link.href) ? item.link : undefined,
  }));

  return (
    <div>
      <GuestSection className="pt-6 pb-10 text-center md:pt-10 md:pb-14">
        <h1 className="guest-display text-4xl md:text-6xl">{FAQ.title}</h1>
        <Sprig className="mx-auto mt-6" />
        <p className="mx-auto mt-6 max-w-prose leading-relaxed">{FAQ.intro}</p>
      </GuestSection>

      <GuestSection className="pt-0 md:pt-0">
        <div className="mx-auto max-w-2xl">
          <FaqList items={items} />
        </div>
      </GuestSection>

      <RsvpBand variant="slim" />
    </div>
  );
}
