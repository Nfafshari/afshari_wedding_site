import type { Rsvps } from "../demo-types";

/**
 * Demo RSVP data, transcribed from `src/prisma/seed.ts`'s PARTIES.
 *
 * A transcription rather than a copy, because the seed writes through Prisma and
 * this doesn't: the seed nests `guests: { create: [...] }` and lets Prisma assign
 * every id and wire every foreign key. Here both are written out by hand, and
 * `respondedAt` strings become real Dates.
 *
 * The invariants from the seed still hold: exactly one `isPrimary` guest per party,
 * and declined parties carry only their primary guest.
 *
 * Guests are pre-sorted by name because that is what `getRsvps` did — the query
 * ordered them `[{ name: "asc" }, { id: "asc" }]`. Ids run in creation order, which
 * is why they look shuffled: Elena was created before Diego but sorts after him.
 */
export const DEMO_RSVPS: Rsvps[] = [
  // --- Accepted, various party sizes ---
  {
    id: 1,
    attendance: true,
    createdAt: new Date('2027-05-12'),
    guests: [
      { id: 1, name: 'Marcus Bennett', isPrimary: true, email: 'marcus.bennett@example.com', phoneNumber: '+1 555 218 0142', notes: null, createdAt: new Date('2027-05-12'), rsvpId: 1 },
    ],
  },
  {
    id: 2,
    attendance: true,
    createdAt: new Date('2027-05-18'),
    guests: [
      { id: 3, name: 'Diego Vasquez', isPrimary: false, email: 'diego.vasquez@example.com', phoneNumber: '+1 555 218 0201', notes: null, createdAt: new Date('2027-05-18'), rsvpId: 2 },
      { id: 2, name: 'Elena Vasquez', isPrimary: true, email: 'elena.vasquez@example.com', phoneNumber: '+1 555 218 0177', notes: null, createdAt: new Date('2027-05-18'), rsvpId: 2 },
    ],
  },
  {
    id: 3,
    attendance: true,
    createdAt: new Date('2027-06-01'),
    guests: [
      { id: 4, name: 'Priya Chatterjee', isPrimary: true, email: 'priya.chatterjee@example.com', phoneNumber: null, notes: 'Please seat near the Okafors.', createdAt: new Date('2027-06-01'), rsvpId: 3 },
    ],
  },
  {
    id: 4,
    attendance: true,
    createdAt: new Date('2027-06-03'),
    guests: [
      { id: 8, name: 'Emma Whitfield', isPrimary: false, email: 'emma.whitfield@example.com', phoneNumber: '+1 555 218 0225', notes: null, createdAt: new Date('2027-06-03'), rsvpId: 4 },
      { id: 7, name: 'Lucas Whitfield', isPrimary: false, email: null, phoneNumber: null, notes: 'Peanut allergy.', createdAt: new Date('2027-06-03'), rsvpId: 4 },
      { id: 6, name: 'Sarah Whitfield', isPrimary: false, email: 'sarah.whitfield@example.com', phoneNumber: '+1 555 218 0223', notes: null, createdAt: new Date('2027-06-03'), rsvpId: 4 },
      { id: 5, name: 'Tom Whitfield', isPrimary: true, email: 'tom.whitfield@example.com', phoneNumber: '+1 555 218 0199', notes: null, createdAt: new Date('2027-06-03'), rsvpId: 4 },
    ],
  },
  {
    id: 5,
    attendance: true,
    createdAt: new Date('2027-06-10'),
    guests: [
      { id: 10, name: 'Daniel Okafor', isPrimary: false, email: 'daniel.okafor@example.com', phoneNumber: '+1 555 218 0231', notes: null, createdAt: new Date('2027-06-10'), rsvpId: 5 },
      { id: 9, name: 'Grace Okafor', isPrimary: true, email: 'grace.okafor@example.com', phoneNumber: '+1 555 218 0121', notes: null, createdAt: new Date('2027-06-10'), rsvpId: 5 },
      { id: 11, name: 'Nia Okafor', isPrimary: false, email: null, phoneNumber: '+1 555 218 0232', notes: null, createdAt: new Date('2027-06-10'), rsvpId: 5 },
    ],
  },
  {
    id: 6,
    attendance: true,
    createdAt: new Date('2027-06-15'),
    guests: [
      { id: 12, name: 'Henry Kim', isPrimary: true, email: 'henry.kim@example.com', phoneNumber: '+1 555 218 0188', notes: null, createdAt: new Date('2027-06-15'), rsvpId: 6 },
    ],
  },
  {
    id: 7,
    attendance: true,
    createdAt: new Date('2027-06-20'),
    guests: [
      { id: 13, name: 'Isabella Romano', isPrimary: true, email: 'isabella.romano@example.com', phoneNumber: '+1 555 218 0240', notes: null, createdAt: new Date('2027-06-20'), rsvpId: 7 },
      { id: 14, name: 'Marco Romano', isPrimary: false, email: 'marco.romano@example.com', phoneNumber: '+1 555 218 0241', notes: null, createdAt: new Date('2027-06-20'), rsvpId: 7 },
    ],
  },
  {
    id: 8,
    attendance: true,
    createdAt: new Date('2027-07-02'),
    guests: [
      { id: 17, name: 'Kai Zhang', isPrimary: false, email: 'kai.zhang@example.com', phoneNumber: null, notes: null, createdAt: new Date('2027-07-02'), rsvpId: 8 },
      { id: 16, name: 'Lin Zhang', isPrimary: false, email: null, phoneNumber: '+1 555 218 0251', notes: null, createdAt: new Date('2027-07-02'), rsvpId: 8 },
      { id: 18, name: 'Mei Zhang', isPrimary: false, email: 'mei.zhang@example.com', phoneNumber: '+1 555 218 0253', notes: null, createdAt: new Date('2027-07-02'), rsvpId: 8 },
      { id: 15, name: 'Wei Zhang', isPrimary: true, email: 'wei.zhang@example.com', phoneNumber: '+1 555 218 0164', notes: null, createdAt: new Date('2027-07-02'), rsvpId: 8 },
    ],
  },

  // --- Declined: single primary guest, no plus-ones ---
  {
    id: 9,
    attendance: false,
    createdAt: new Date('2027-05-25'),
    guests: [
      { id: 19, name: 'Robert Fields', isPrimary: true, email: 'robert.fields@example.com', phoneNumber: '+1 555 218 0260', notes: 'So sorry to miss it — congratulations!', createdAt: new Date('2027-05-25'), rsvpId: 9 },
    ],
  },
  {
    id: 10,
    attendance: false,
    createdAt: new Date('2027-06-08'),
    guests: [
      { id: 20, name: 'Amelia Turner', isPrimary: true, email: 'amelia.turner@example.com', phoneNumber: '+1 555 218 0133', notes: null, createdAt: new Date('2027-06-08'), rsvpId: 10 },
    ],
  },
];
