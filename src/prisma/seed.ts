import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// This script runs as a standalone Node process (via `tsx`), not through Next.js,
// so it can't use the `@/lib/prisma` singleton. We build our own client the same
// way lib/prisma.ts does: a pg driver adapter pointed at DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * A "party" is one Rsvp row plus its Guest rows.
 *
 * Invariants baked into the data below (worth eyeballing when you review):
 *  - Exactly ONE guest per party has `isPrimary: true` — the person who scanned
 *    the invite and responded. Everyone else is a plus-one (`false`).
 *  - Every guest carries their own email and phone.
 *  - Declined parties (`attendance: false`) still have their single primary guest
 *    so we know who said no, but no plus-ones.
 */
type SeedGuest = {
  name: string;
  isPrimary: boolean;
  email?: string;
  phoneNumber?: string;
  notes?: string;
};

type SeedParty = {
  attendance: boolean;
  /** When the party responded. Overrides the `createdAt` default so the data has a realistic spread. */
  respondedAt: string;
  guests: SeedGuest[];
};

const PARTIES: SeedParty[] = [
  // --- Accepted, various party sizes ---
  {
    attendance: true,
    respondedAt: "2027-05-12",
    guests: [
      { name: "Marcus Bennett", isPrimary: true, email: "marcus.bennett@example.com", phoneNumber: "+1 555 218 0142" },
    ],
  },
  {
    attendance: true,
    respondedAt: "2027-05-18",
    guests: [
      { name: "Elena Vasquez", isPrimary: true, email: "elena.vasquez@example.com", phoneNumber: "+1 555 218 0177" },
      { name: "Diego Vasquez", isPrimary: false, email: "diego.vasquez@example.com", phoneNumber: "+1 555 218 0201" },
    ],
  },
  {
    attendance: true,
    respondedAt: "2027-06-01",
    guests: [
      { name: "Priya Chatterjee", isPrimary: true, email: "priya.chatterjee@example.com", phoneNumber: "+1 555 218 0210", notes: "Please seat near the Okafors." },
    ],
  },
  {
    attendance: true,
    respondedAt: "2027-06-03",
    guests: [
      { name: "Tom Whitfield", isPrimary: true, email: "tom.whitfield@example.com", phoneNumber: "+1 555 218 0199" },
      { name: "Sarah Whitfield", isPrimary: false, email: "sarah.whitfield@example.com", phoneNumber: "+1 555 218 0223" },
      { name: "Lucas Whitfield", isPrimary: false, email: "lucas.whitfield@example.com", phoneNumber: "+1 555 218 0224", notes: "Peanut allergy." },
      { name: "Emma Whitfield", isPrimary: false, email: "emma.whitfield@example.com", phoneNumber: "+1 555 218 0225" },
    ],
  },
  {
    attendance: true,
    respondedAt: "2027-06-10",
    guests: [
      { name: "Grace Okafor", isPrimary: true, email: "grace.okafor@example.com", phoneNumber: "+1 555 218 0121" },
      { name: "Daniel Okafor", isPrimary: false, email: "daniel.okafor@example.com", phoneNumber: "+1 555 218 0231" },
      { name: "Nia Okafor", isPrimary: false, email: "nia.okafor@example.com", phoneNumber: "+1 555 218 0232" },
    ],
  },
  {
    attendance: true,
    respondedAt: "2027-06-15",
    guests: [
      { name: "Henry Kim", isPrimary: true, email: "henry.kim@example.com", phoneNumber: "+1 555 218 0188" },
    ],
  },
  {
    attendance: true,
    respondedAt: "2027-06-20",
    guests: [
      { name: "Isabella Romano", isPrimary: true, email: "isabella.romano@example.com", phoneNumber: "+1 555 218 0240" },
      { name: "Marco Romano", isPrimary: false, email: "marco.romano@example.com", phoneNumber: "+1 555 218 0241" },
    ],
  },
  {
    attendance: true,
    respondedAt: "2027-07-02",
    guests: [
      { name: "Wei Zhang", isPrimary: true, email: "wei.zhang@example.com", phoneNumber: "+1 555 218 0164" },
      { name: "Lin Zhang", isPrimary: false, email: "lin.zhang@example.com", phoneNumber: "+1 555 218 0251" },
      { name: "Kai Zhang", isPrimary: false, email: "kai.zhang@example.com", phoneNumber: "+1 555 218 0252" },
      { name: "Mei Zhang", isPrimary: false, email: "mei.zhang@example.com", phoneNumber: "+1 555 218 0253" },
    ],
  },

  // --- Declined: single primary guest, no plus-ones ---
  {
    attendance: false,
    respondedAt: "2027-05-25",
    guests: [
      { name: "Robert Fields", isPrimary: true, email: "robert.fields@example.com", phoneNumber: "+1 555 218 0260", notes: "So sorry to miss it — congratulations!" },
    ],
  },
  {
    attendance: false,
    respondedAt: "2027-06-08",
    guests: [
      { name: "Amelia Turner", isPrimary: true, email: "amelia.turner@example.com", phoneNumber: "+1 555 218 0133" },
    ],
  },
];

async function main() {
  // Wipe existing rows so the seed is repeatable (re-run it any time to reset).
  // Guests first: each Guest holds the rsvpId foreign key, so deleting the Rsvp
  // it points at first would be rejected. Children before parents, always.
  await prisma.guest.deleteMany();
  await prisma.rsvp.deleteMany();

  // One nested create per party. Passing `guests: { create: [...] }` inserts the
  // Rsvp and all its Guests in a single call, and Prisma wires each Guest's
  // rsvpId for us — notice we never set the foreign key by hand.
  for (const party of PARTIES) {
    await prisma.rsvp.create({
      data: {
        attendance: party.attendance,
        createdAt: new Date(party.respondedAt),
        guests: {
          create: party.guests.map((guest) => ({
            name: guest.name,
            isPrimary: guest.isPrimary,
            email: guest.email,
            phoneNumber: guest.phoneNumber,
            notes: guest.notes,
            createdAt: new Date(party.respondedAt),
          })),
        },
      },
    });
  }

  const rsvpCount = await prisma.rsvp.count();
  const guestCount = await prisma.guest.count();
  console.log(`Seeded ${rsvpCount} RSVPs and ${guestCount} guests.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
