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

/**
 * A registry item plus whoever has called dibs on it.
 *
 * Invariants baked into the data below (worth eyeballing when you review):
 *  - No item is over-claimed: the claim quantities never sum past quantityWanted.
 *    The app refuses to create that state, so the seed shouldn't fabricate it.
 *  - The set covers every state the page renders: nothing claimed, partly claimed,
 *    fully claimed, and an item with no image at all (image: null) so the
 *    placeholder fallback gets exercised.
 */
type SeedClaim = {
  claimedBy: string;
  quantity: number;
  /** When they claimed it. Overrides the `createdAt` default for a realistic spread. */
  claimedAt: string;
};

type SeedRegistryItem = {
  name: string;
  link: string;
  quantityWanted: number;
  /** Stored as-is. null means no image at all, so the client falls back to a placeholder. */
  image: string | null;
  claims: SeedClaim[];
};

const REGISTRY_ITEMS: SeedRegistryItem[] = [
  // --- Nothing claimed yet ---
  {
    name: "Cast Iron Dutch Oven",
    link: "https://www.example.com/dutch-oven",
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400",
    quantityWanted: 1,
    claims: [],
  },
  // --- Partly claimed, several claimants ---
  {
    name: "Linen Bath Towels",
    link: "https://www.example.com/bath-towels",
    image: "https://images.unsplash.com/photo-1620912189875-0dcd4d0d0b7e?w=400",
    quantityWanted: 8,
    claims: [
      { claimedBy: "Aunt Sue", quantity: 2, claimedAt: "2026-07-02" },
      { claimedBy: "The Millers", quantity: 1, claimedAt: "2026-07-09" },
    ],
  },
  // --- Partly claimed, single claimant ---
  {
    name: "Stand Mixer",
    link: "https://www.example.com/stand-mixer",
    image: "https://images.unsplash.com/photo-1594222082006-6bd7f4b1a4b0?w=400",
    quantityWanted: 5,
    claims: [
      { claimedBy: "Grace Okafor", quantity: 3, claimedAt: "2026-07-11" },
    ],
  },
  // --- Fully claimed, and no image so the placeholder shows ---
  {
    name: "Wool Picnic Blanket",
    link: "https://www.example.com/picnic-blanket",
    image: null,
    quantityWanted: 2,
    claims: [
      { claimedBy: "Henry Kim", quantity: 1, claimedAt: "2026-06-28" },
      { claimedBy: "Elena Vasquez", quantity: 1, claimedAt: "2026-07-14" },
    ],
  },
];

async function main() {
  // Wipe existing rows so the seed is repeatable (re-run it any time to reset).
  // Guests first: each Guest holds the rsvpId foreign key, so deleting the Rsvp
  // it points at first would be rejected. Children before parents, always.
  await prisma.guest.deleteMany();
  await prisma.rsvp.deleteMany();

  // Same rule for the registry, and here the DB enforces it: RegistryClaim -> item
  // is onDelete: Restrict, so deleting a claimed item throws instead of cascading.
  await prisma.registryClaim.deleteMany();
  await prisma.registryItem.deleteMany();

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

  // One nested create per item, same shape as the parties above: passing
  // `claimed: { create: [...] }` inserts the item and its claims in a single call
  // and wires each claim's itemId for us.
  for (const registryItem of REGISTRY_ITEMS) {
    await prisma.registryItem.create({
      data: {
        name: registryItem.name,
        link: registryItem.link,
        quantityWanted: registryItem.quantityWanted,
        // Passed straight through, null included. The column default would win if this
        // key were absent, but the point of the null row is to prove the client copes
        // with a genuinely empty image — which a default would paper over.
        image: registryItem.image,
        claimed: {
          create: registryItem.claims.map((claim) => ({
            claimedBy: claim.claimedBy,
            quantity: claim.quantity,
            createdAt: new Date(claim.claimedAt),
          })),
        },
      },
    });
  }

  const rsvpCount = await prisma.rsvp.count();
  const guestCount = await prisma.guest.count();
  const registryItemCount = await prisma.registryItem.count();
  const registryClaimCount = await prisma.registryClaim.count();
  console.log(`Seeded ${rsvpCount} RSVPs and ${guestCount} guests.`);
  console.log(`Seeded ${registryItemCount} registry items and ${registryClaimCount} claims.`);
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
