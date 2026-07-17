import Rsvp from "./client";

/** Re-exported so consumers keep importing this from the page. See checklist/page.tsx. */
export type { Rsvps } from "../demo-types";

export default function RsvpPage() {
  return <Rsvp />;
}
