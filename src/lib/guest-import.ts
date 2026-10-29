import type { PrismaClient } from "../generated/prisma/client";
import { normalizeName } from "./rsvp";

/**
 * Guest-list CSV import, shared by the planner's Import button and the
 * `pnpm import-guests` script. The parser is pure so the dialog can also run it in
 * the browser, to flag a bad row before anything is uploaded.
 *
 * Relative imports, not `@/`, because the script runs under plain `tsx`.
 *
 * Format, one row per invited person, header row required:
 *
 *   party,name,plus_ones
 *   The Okafors,Grace Okafor,0
 *   The Okafors,Daniel Okafor,
 *   Henry Kim,Henry Kim,1
 *
 * `plus_ones` is read from each party's first row; later rows may leave it blank.
 * Names containing commas are not supported (no quoting), and aren't expected.
 */

export const GUEST_CSV_HEADER = 'party,name,plus_ones';

export const GUEST_CSV_TEMPLATE = [
  GUEST_CSV_HEADER,
  'The Okafors,Grace Okafor,0',
  'The Okafors,Daniel Okafor,',
  'Henry Kim,Henry Kim,1',
].join('\n');

export type CsvParty = { partyName: string; plusOnesAllowed: number; members: string[] };

export type ParseResult =
  | { ok: true; parties: CsvParty[] }
  | { ok: false; error: string };

export type ImportSummary = {
  partiesCreated: number;
  partiesUpdated: number;
  membersAdded: number;
  /** Normalized names that appear on more than one party, after the import. */
  duplicateNames: string[];
};

/**
 * Parses the CSV into parties, in file order.
 * @returns the parties, or the first malformed row, named by line so it can be fixed
 */
export function parseGuestCsv (text: string): ParseResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const header = lines[0]?.split(',').map((cell) => cell.trim().toLowerCase());
  if (header?.join(',') !== GUEST_CSV_HEADER) {
    return { ok: false, error: `First line must be the header: ${GUEST_CSV_HEADER}` };
  }

  const parties = new Map<string, CsvParty>();

  for (const [idx, line] of lines.slice(1).entries()) {
    const lineNumber = idx + 2;
    if (line.trim() === '') {
      continue;
    }

    const cells = line.split(',').map((cell) => cell.trim());
    if (cells.length < 2 || cells.length > 3) {
      return { ok: false, error: `Line ${lineNumber}: expected 3 columns, found ${cells.length}. Is there a comma in a name?` };
    }

    const [partyName, name, plusOnesCell = ''] = cells;
    if (partyName === '' || name === '') {
      return { ok: false, error: `Line ${lineNumber}: party and name are required.` };
    }
    if (normalizeName(name).split(' ').length < 2) {
      return { ok: false, error: `Line ${lineNumber}: "${name}" needs a first and last name, or the guest can't look themselves up.` };
    }

    let party = parties.get(partyName);
    if (party === undefined) {
      const plusOnesAllowed = plusOnesCell === '' ? 0 : Number(plusOnesCell);
      if (!Number.isInteger(plusOnesAllowed) || plusOnesAllowed < 0 || plusOnesAllowed > 10) {
        return { ok: false, error: `Line ${lineNumber}: plus_ones must be a whole number from 0 to 10.` };
      }
      party = { partyName, plusOnesAllowed, members: [] };
      parties.set(partyName, party);
    }

    if (party.members.some((member) => normalizeName(member) === normalizeName(name))) {
      return { ok: false, error: `Line ${lineNumber}: "${name}" is already listed in ${partyName}.` };
    }

    party.members.push(name);
  }

  if (parties.size === 0) {
    return { ok: false, error: 'The file has a header but no guests.' };
  }

  return { ok: true, parties: [...parties.values()] };
}

/**
 * Writes parsed parties to the DB.
 *
 * Idempotent and additive: a party is matched by its name, a member by their
 * normalized name within that party. Re-running only adds what's new and updates
 * plus-one allowances. It never deletes a guest and never touches a response, so
 * it's safe to run after RSVPs start coming in. Removals go through the planner.
 *
 * Not one transaction: a long guest list would outlast the interactive transaction
 * timeout. Being idempotent covers it instead — if it fails partway, run it again.
 */
export async function importGuestParties (prisma: PrismaClient, parties: CsvParty[]): Promise<ImportSummary> {
  const summary: ImportSummary = { partiesCreated: 0, partiesUpdated: 0, membersAdded: 0, duplicateNames: [] };

  // One read for every party up front, rather than one per CSV party.
  const existingParties = await prisma.invitation.findMany({
    where: { partyName: { in: parties.map((party) => party.partyName) } },
    include: { guests: { where: { isPlusOne: false } } },
  });
  const existingByName = new Map(existingParties.map((invitation) => [invitation.partyName, invitation]));

  for (const party of parties) {
    const existing = existingByName.get(party.partyName);

    if (existing === undefined) {
      await prisma.invitation.create({
        data: {
          partyName: party.partyName,
          plusOnesAllowed: party.plusOnesAllowed,
          guests: {
            create: party.members.map((name) => ({ name, nameKey: normalizeName(name) })),
          },
        },
      });
      summary.partiesCreated += 1;
      summary.membersAdded += party.members.length;
      continue;
    }

    const knownKeys = new Set(existing.guests.map((guest) => guest.nameKey));
    const newMembers = party.members.filter((name) => !knownKeys.has(normalizeName(name)));

    if (newMembers.length > 0) {
      await prisma.guest.createMany({
        data: newMembers.map((name) => ({ invitationId: existing.id, name, nameKey: normalizeName(name) })),
      });
      summary.membersAdded += newMembers.length;
    }

    const allowanceChanged = existing.plusOnesAllowed !== party.plusOnesAllowed;
    if (allowanceChanged) {
      await prisma.invitation.update({
        where: { id: existing.id },
        data: { plusOnesAllowed: party.plusOnesAllowed },
      });
    }

    if (allowanceChanged || newMembers.length > 0) {
      summary.partiesUpdated += 1;
    }
  }

  // The same name on two parties makes the public lookup ask "which party are
  // you with?" Sometimes right (two real people), usually a copy-paste slip.
  const duplicates = await prisma.guest.groupBy({
    by: ['nameKey'],
    where: { isPlusOne: false },
    _count: { invitationId: true },
    having: { invitationId: { _count: { gt: 1 } } },
  });
  summary.duplicateNames = duplicates.map((duplicate) => duplicate.nameKey);

  return summary;
}

/** One line for a toast or the terminal, e.g. "3 parties added, 1 updated, 8 guests added." */
export function describeImport (summary: ImportSummary): string {
  const { partiesCreated, partiesUpdated, membersAdded } = summary;
  if (partiesCreated === 0 && partiesUpdated === 0) {
    return 'Nothing new — everyone in the file is already on the list.';
  }

  const parties = partiesCreated === 1 ? '1 party' : `${partiesCreated} parties`;
  const guests = membersAdded === 1 ? '1 guest' : `${membersAdded} guests`;
  return `${parties} added, ${partiesUpdated} updated, ${guests} added.`;
}
