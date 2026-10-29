import type { Attendance, PlusOneStatus } from "@/generated/prisma/enums";
import { normalizeName } from "@/lib/rsvp";
import type { Guest, Invitations } from "../demo-types";

/**
 * Demo RSVP data, transcribed from `src/prisma/seed.ts`'s PARTIES.
 *
 * A transcription rather than a copy, because the seed writes through Prisma and
 * this doesn't: the seed nests `guests: { create: [...] }` and lets Prisma assign
 * every id and wire every foreign key. Here the small builders below do that by
 * hand, and `respondedAt` strings become real Dates.
 *
 * The invariants from the seed still hold: every party has an invited member,
 * plus-ones never outnumber the allowance, and a party where nobody is attending
 * has no plus-ones.
 *
 * Guests are listed members first, then plus-ones, each sorted by name, because
 * that is what `getInvitations` does. Parties are sorted by partyName for the same
 * reason.
 */

const CREATED = new Date('2027-03-01');

let guestId = 0;

function member (invitationId: number, name: string, attendance: Attendance = 'PENDING', dietary: string | null = null): Guest {
  guestId += 1;
  return {
    id: guestId, createdAt: CREATED, name, nameKey: normalizeName(name),
    attendance, dietary, isPlusOne: false, plusOneStatus: null, invitationId,
  };
}

function plusOne (invitationId: number, name: string, status: PlusOneStatus, dietary: string | null = null): Guest {
  guestId += 1;
  return {
    id: guestId, createdAt: CREATED, name, nameKey: normalizeName(name),
    attendance: 'ATTENDING', dietary, isPlusOne: true, plusOneStatus: status, invitationId,
  };
}

type Response = Pick<Invitations, 'respondedByName' | 'email' | 'phoneNumber' | 'noteToCouple' | 'songRequest'> & { respondedAt: string };

function party (id: number, partyName: string, plusOnesAllowed: number, guests: Guest[], response?: Partial<Response> & { respondedAt: string; respondedByName: string }): Invitations {
  return {
    id,
    createdAt: CREATED,
    updatedAt: response ? new Date(response.respondedAt) : CREATED,
    partyName,
    plusOnesAllowed,
    respondedAt: response ? new Date(response.respondedAt) : null,
    respondedByName: response?.respondedByName ?? null,
    email: response?.email ?? null,
    phoneNumber: response?.phoneNumber ?? null,
    noteToCouple: response?.noteToCouple ?? null,
    songRequest: response?.songRequest ?? null,
    guests,
  };
}

// Party ids start past every guest id, so the two never collide in getMaxSeededId.
export const DEMO_INVITATIONS: Invitations[] = [
  party(101, 'Amelia Turner', 0, [
    member(101, 'Amelia Turner', 'DECLINED'),
  ], { respondedAt: '2027-06-08', respondedByName: 'Amelia Turner', phoneNumber: '+1 555 218 0133' }),

  party(102, 'Henry Kim', 1, [
    member(102, 'Henry Kim', 'ATTENDING'),
    plusOne(102, 'Chris Doe', 'REJECTED'),
  ], { respondedAt: '2027-06-15', respondedByName: 'Henry Kim', email: 'henry.kim@example.com' }),

  party(103, 'Marcus Bennett', 1, [
    member(103, 'Marcus Bennett', 'ATTENDING'),
    plusOne(103, 'Jordan Lee', 'APPROVED'),
  ], { respondedAt: '2027-05-12', respondedByName: 'Marcus Bennett', email: 'marcus.bennett@example.com', phoneNumber: '+1 555 218 0142', songRequest: 'September — Earth, Wind & Fire' }),

  party(104, 'Priya Chatterjee', 1, [
    member(104, 'Priya Chatterjee', 'ATTENDING'),
    plusOne(104, 'Sam Patel', 'PENDING', 'Gluten free'),
  ], { respondedAt: '2027-06-01', respondedByName: 'Priya Chatterjee', email: 'priya.chatterjee@example.com', noteToCouple: 'Please seat near the Okafors.' }),

  party(105, 'Robert Fields', 1, [
    member(105, 'Robert Fields', 'DECLINED'),
  ], { respondedAt: '2027-05-25', respondedByName: 'Robert Fields', email: 'robert.fields@example.com', noteToCouple: 'So sorry to miss it — congratulations!' }),

  party(106, 'The Okafors', 0, [
    member(106, 'Daniel Okafor', 'ATTENDING'),
    member(106, 'Grace Okafor', 'ATTENDING'),
    member(106, 'Nia Okafor', 'DECLINED'),
  ], { respondedAt: '2027-06-10', respondedByName: 'Grace Okafor', phoneNumber: '+1 555 218 0121', noteToCouple: 'Nia is away at school, sends her love!' }),

  party(107, 'The Romanos', 0, [
    member(107, 'Isabella Romano'),
    member(107, 'Marco Romano'),
  ]),

  party(108, 'The Vasquezes', 0, [
    member(108, 'Diego Vasquez', 'ATTENDING', 'Vegetarian'),
    member(108, 'Elena Vasquez', 'ATTENDING'),
  ], { respondedAt: '2027-05-18', respondedByName: 'Elena Vasquez', email: 'elena.vasquez@example.com', phoneNumber: '+1 555 218 0177' }),

  party(109, 'The Whitfields', 0, [
    member(109, 'Emma Whitfield', 'ATTENDING'),
    member(109, 'Lucas Whitfield', 'ATTENDING', 'Peanut allergy'),
    member(109, 'Sarah Whitfield', 'ATTENDING'),
    member(109, 'Tom Whitfield', 'ATTENDING'),
  ], { respondedAt: '2027-06-03', respondedByName: 'Tom Whitfield', email: 'tom.whitfield@example.com', phoneNumber: '+1 555 218 0199' }),

  party(110, 'The Zhangs', 2, [
    member(110, 'Lin Zhang'),
    member(110, 'Wei Zhang'),
  ]),
];
