import "dotenv/config";

import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { describeImport, importGuestParties, parseGuestCsv } from "../lib/guest-import";

/**
 * Bulk-loads the guest list from a CSV — the terminal twin of the planner's
 * Import button. Format and merge rules live in src/lib/guest-import.ts.
 *
 *   pnpm import-guests guests.csv
 */

// This script runs as a standalone Node process (via `tsx`), not through Next.js,
// so it can't use the `@/lib/prisma` singleton. Same setup as seed.ts.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main () {
  const file = process.argv[2];
  if (!file) {
    throw new Error('Usage: pnpm import-guests <path-to-csv>');
  }

  const parsed = parseGuestCsv(readFileSync(file, 'utf8'));
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  const summary = await importGuestParties(prisma, parsed.parties);

  console.log(describeImport(summary));
  for (const name of summary.duplicateNames) {
    console.warn(`WARNING: "${name}" is on more than one party.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
