import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { normalizeName } from "../lib/rsvp";

// This script runs as a standalone Node process (via `tsx`), not through Next.js,
// so it can't use the `@/lib/prisma` singleton. We build our own client the same
// way lib/prisma.ts does: a pg driver adapter pointed at DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * One Invitation row plus its Guest rows.
 *
 * Invariants baked into the data below (worth eyeballing when you review):
 *  - Every party has at least one invited member (`isPlusOne` false).
 *  - Plus-ones never outnumber `plusOnesAllowed`, rejected ones aside. The app
 *    refuses to create that state, so the seed shouldn't fabricate it.
 *  - Unresponded parties have no response fields and every member PENDING.
 *  - A party where nobody is attending has no plus-ones. Submitting the form
 *    deletes them in that case.
 *  - The set covers every state the planner renders: awaiting, fully attending,
 *    mixed, declined, and a plus-one in each of PENDING / APPROVED / REJECTED.
 */
type SeedAttendance = "PENDING" | "ATTENDING" | "DECLINED";

type SeedMember = {
  name: string;
  attendance?: SeedAttendance;
  dietary?: string;
};

type SeedPlusOne = {
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  dietary?: string;
};

type SeedParty = {
  partyName: string;
  plusOnesAllowed: number;
  members: SeedMember[];
  plusOnes?: SeedPlusOne[];
  /** Absent for parties that have not responded yet. */
  response?: {
    /** Overrides `createdAt` too, so the data has a realistic spread. */
    respondedAt: string;
    respondedByName: string;
    email?: string;
    phoneNumber?: string;
    noteToCouple?: string;
    songRequest?: string;
  };
};

const PARTIES: SeedParty[] = [
  // --- Attending, with each plus-one state ---
  {
    partyName: "Marcus Bennett",
    plusOnesAllowed: 1,
    members: [{ name: "Marcus Bennett", attendance: "ATTENDING" }],
    plusOnes: [{ name: "Jordan Lee", status: "APPROVED" }],
    response: { respondedAt: "2027-05-12", respondedByName: "Marcus Bennett", email: "marcus.bennett@example.com", phoneNumber: "+1 555 218 0142", songRequest: "September — Earth, Wind & Fire" },
  },
  {
    partyName: "The Vasquezes",
    plusOnesAllowed: 0,
    members: [
      { name: "Elena Vasquez", attendance: "ATTENDING" },
      { name: "Diego Vasquez", attendance: "ATTENDING", dietary: "Vegetarian" },
    ],
    response: { respondedAt: "2027-05-18", respondedByName: "Elena Vasquez", email: "elena.vasquez@example.com", phoneNumber: "+1 555 218 0177" },
  },
  {
    partyName: "Priya Chatterjee",
    plusOnesAllowed: 1,
    members: [{ name: "Priya Chatterjee", attendance: "ATTENDING" }],
    plusOnes: [{ name: "Sam Patel", status: "PENDING", dietary: "Gluten free" }],
    response: { respondedAt: "2027-06-01", respondedByName: "Priya Chatterjee", email: "priya.chatterjee@example.com", noteToCouple: "Please seat near the Okafors." },
  },
  {
    partyName: "The Whitfields",
    plusOnesAllowed: 0,
    members: [
      { name: "Tom Whitfield", attendance: "ATTENDING" },
      { name: "Sarah Whitfield", attendance: "ATTENDING" },
      { name: "Lucas Whitfield", attendance: "ATTENDING", dietary: "Peanut allergy" },
      { name: "Emma Whitfield", attendance: "ATTENDING" },
    ],
    response: { respondedAt: "2027-06-03", respondedByName: "Tom Whitfield", email: "tom.whitfield@example.com", phoneNumber: "+1 555 218 0199" },
  },
  // --- Mixed: one member coming, one not ---
  {
    partyName: "The Okafors",
    plusOnesAllowed: 0,
    members: [
      { name: "Grace Okafor", attendance: "ATTENDING" },
      { name: "Daniel Okafor", attendance: "ATTENDING" },
      { name: "Nia Okafor", attendance: "DECLINED" },
    ],
    response: { respondedAt: "2027-06-10", respondedByName: "Grace Okafor", phoneNumber: "+1 555 218 0121", noteToCouple: "Nia is away at school, sends her love!" },
  },
  {
    partyName: "Henry Kim",
    plusOnesAllowed: 1,
    members: [{ name: "Henry Kim", attendance: "ATTENDING" }],
    plusOnes: [{ name: "Chris Doe", status: "REJECTED" }],
    response: { respondedAt: "2027-06-15", respondedByName: "Henry Kim", email: "henry.kim@example.com" },
  },

  // --- Declined ---
  {
    partyName: "Robert Fields",
    plusOnesAllowed: 1,
    members: [{ name: "Robert Fields", attendance: "DECLINED" }],
    response: { respondedAt: "2027-05-25", respondedByName: "Robert Fields", email: "robert.fields@example.com", noteToCouple: "So sorry to miss it — congratulations!" },
  },
  {
    partyName: "Amelia Turner",
    plusOnesAllowed: 0,
    members: [{ name: "Amelia Turner", attendance: "DECLINED" }],
    response: { respondedAt: "2027-06-08", respondedByName: "Amelia Turner", phoneNumber: "+1 555 218 0133" },
  },

  // --- Awaiting a response ---
  {
    partyName: "The Romanos",
    plusOnesAllowed: 0,
    members: [{ name: "Isabella Romano" }, { name: "Marco Romano" }],
  },
  {
    partyName: "The Zhangs",
    plusOnesAllowed: 2,
    members: [{ name: "Wei Zhang" }, { name: "Lin Zhang" }],
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
  // Guest -> Invitation cascades, but children before parents is the habit that
  // keeps working when a relation is later switched to Restrict.
  await prisma.guest.deleteMany();
  await prisma.invitation.deleteMany();

  // Same rule for the registry, and here the DB enforces it: RegistryClaim -> item
  // is onDelete: Restrict, so deleting a claimed item throws instead of cascading.
  await prisma.registryClaim.deleteMany();
  await prisma.registryItem.deleteMany();

  // One nested create per party. Passing `guests: { create: [...] }` inserts the
  // Invitation and all its Guests in a single call, and Prisma wires each Guest's
  // invitationId for us — notice we never set the foreign key by hand.
  for (const party of PARTIES) {
    const respondedAt = party.response ? new Date(party.response.respondedAt) : null;

    await prisma.invitation.create({
      data: {
        partyName: party.partyName,
        plusOnesAllowed: party.plusOnesAllowed,
        respondedAt,
        respondedByName: party.response?.respondedByName,
        email: party.response?.email,
        phoneNumber: party.response?.phoneNumber,
        noteToCouple: party.response?.noteToCouple,
        songRequest: party.response?.songRequest,
        guests: {
          create: [
            ...party.members.map((member) => ({
              name: member.name,
              nameKey: normalizeName(member.name),
              attendance: member.attendance ?? "PENDING",
              dietary: member.dietary,
            })),
            ...(party.plusOnes ?? []).map((plusOne) => ({
              name: plusOne.name,
              nameKey: normalizeName(plusOne.name),
              // A plus-one only exists because their host is coming.
              attendance: "ATTENDING" as const,
              dietary: plusOne.dietary,
              isPlusOne: true,
              plusOneStatus: plusOne.status,
              createdAt: respondedAt ?? undefined,
            })),
          ],
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

  const invitationCount = await prisma.invitation.count();
  const guestCount = await prisma.guest.count();
  const registryItemCount = await prisma.registryItem.count();
  const registryClaimCount = await prisma.registryClaim.count();
  console.log(`Seeded ${invitationCount} invitations and ${guestCount} guests.`);
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
