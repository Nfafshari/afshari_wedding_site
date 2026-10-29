import Rsvp from "./client";

/** Re-exported so consumers keep importing from `../page`, like the real planner. */
export type { Invitations } from "../demo-types";

export default function RsvpPage() {
  return <Rsvp />;
}
