import type { Attendance, PlusOneStatus } from "@/generated/prisma/enums";

/**
 * The shapes the shared RSVP components render.
 *
 * Structural rather than the `Invitations` type from `planner/rsvp/page.tsx`, so
 * the real planner (Prisma rows) and the demo (hand-written data) both satisfy
 * them without either importing the other.
 */
export type RsvpGuestRow = {
  id: number;
  name: string;
  attendance: Attendance;
  dietary: string | null;
  isPlusOne: boolean;
  plusOneStatus: PlusOneStatus | null;
};

export type RsvpPartyRow = {
  id: number;
  partyName: string;
  plusOnesAllowed: number;
  respondedAt: Date | null;
  respondedByName: string | null;
  email: string | null;
  phoneNumber: string | null;
  noteToCouple: string | null;
  songRequest: string | null;
  guests: RsvpGuestRow[];
};

/**
 * What the table and approval list can ask the page to do. Every handler is
 * optional: leave them out and the components render read-only, which is how the
 * demo uses them.
 */
export type RsvpHandlers = {
  onEditParty?: (party: RsvpPartyRow) => void;
  onRemoveParty?: (party: RsvpPartyRow) => void;
  onSetAttendance?: (guest: RsvpGuestRow, attendance: Attendance) => void;
  onSetPlusOneStatus?: (guest: RsvpGuestRow, status: 'APPROVED' | 'REJECTED') => void;
};
