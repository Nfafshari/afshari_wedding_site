import type { Metadata } from "next";

import { formatRsvpDeadline, isRsvpOpen } from "@/lib/rsvp";
import RsvpForm from "./client";

export const metadata: Metadata = {
  title: "RSVP · Piper & Nathen",
};

/** Per request, so the deadline is checked against today rather than the build date. */
export const dynamic = 'force-dynamic';

export default function RsvpPage() {
  return <RsvpForm isOpen={isRsvpOpen()} deadline={formatRsvpDeadline()} />;
}
