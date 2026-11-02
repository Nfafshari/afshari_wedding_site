"use server";
import { prisma } from '@/lib/prisma';
import type { Attendance } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { requireUserAction } from '@/lib/require-user';
import { MAX_SHORT_TEXT, countActivePlusOnes, normalizeName } from '@/lib/rsvp';
import { importGuestParties, parseGuestCsv, type ImportSummary } from '@/lib/guest-import';
import { handleActionError, type ActionResult as SharedActionResult } from '@/lib/action';

/**
 * Which input a failure relates to, so the client can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'partyName' | 'plusOnesAllowed' | 'members' | 'invitation' | 'guest' | 'file';

/** A guest list is a few KB. Anything near this is the wrong file. */
const MAX_CSV_BYTES = 512 * 1024;

/**
 * A member as the party dialog submits it. `id` is set for members already on the
 * invitation and absent for ones added in this edit.
 */
export interface MemberInput {
  id?: number | undefined;
  name: string;
}

export interface InvitationInput {
  partyName: string;
  plusOnesAllowed: number;
  members: MemberInput[];
}

/** The routes these writes invalidate. `(protected)` is a route group, so it is not in the URL. */
const RSVP_PATH = '/planner/rsvp';
const PLANNER_PATH = '/planner';

/** Nobody is bringing a busload. Also keeps the value well inside int4. */
const MAX_PLUS_ONES = 10;

/** See {@link SharedActionResult}; narrowed to this page's fields. */
export type ActionResult = SharedActionResult<ErrorField>;

const PARTY_GONE = 'That party no longer exists, refresh your page and try again.';
const PLUS_ONE_GONE = 'That plus-one no longer exists, refresh your page and try again.';
const GUEST_GONE = 'That guest no longer exists, refresh your page and try again.';

/** ActionResult, with what the import changed attached on success. */
export type ImportResult =
  | { ok: true; summary: ImportSummary }
  | Extract<ActionResult, { ok: false }>;

function revalidateRsvpPages () {
  revalidatePath(RSVP_PATH);
  revalidatePath(PLANNER_PATH);
}

/**
 * Validates and trims the party fields shared by create and update, so the two
 * can't drift apart on what counts as valid.
 * @returns a failing ActionResult, or the cleaned-up input
 */
function validateInvitationInput (input: InvitationInput): { ok: false; error: string; field: ErrorField } | { ok: true; value: InvitationInput } {
  const partyName = input.partyName.trim();
  if (partyName === '') {
    return { ok: false, error: 'Party name cannot be empty.', field: 'partyName' };
  }
  if (partyName.length > MAX_SHORT_TEXT) {
    return { ok: false, error: `Party name must be ${MAX_SHORT_TEXT} characters or less.`, field: 'partyName' };
  }

  // Number(...) can hand us NaN if the client sent something non-numeric.
  if (!Number.isInteger(input.plusOnesAllowed) || input.plusOnesAllowed < 0 || input.plusOnesAllowed > MAX_PLUS_ONES) {
    return { ok: false, error: `Plus-ones must be a whole number from 0 to ${MAX_PLUS_ONES}.`, field: 'plusOnesAllowed' };
  }

  const members = input.members.map((member) => ({ id: member.id, name: member.name.trim() }));
  if (members.length === 0) {
    return { ok: false, error: 'A party needs at least one guest.', field: 'members' };
  }
  if (members.some((member) => member.name === '')) {
    return { ok: false, error: 'Guest names cannot be empty.', field: 'members' };
  }
  if (members.some((member) => member.name.length > MAX_SHORT_TEXT)) {
    return { ok: false, error: `Guest names must be ${MAX_SHORT_TEXT} characters or less.`, field: 'members' };
  }

  // The public lookup finds a party by name, so two identical names in one party
  // are indistinguishable to the guest and almost certainly a typo here.
  const keys = members.map((member) => normalizeName(member.name));
  if (new Set(keys).size !== keys.length) {
    return { ok: false, error: 'The same guest is listed twice.', field: 'members' };
  }

  return { ok: true, value: { partyName, plusOnesAllowed: input.plusOnesAllowed, members } };
}

/**
 * Creates a new party on the guest list.
 * @param input - party name, plus-one allowance and member names (see {@link InvitationInput})
 * @returns an ActionResult the client can react to
 */
export async function createInvitation (input: InvitationInput): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  const validated = validateInvitationInput(input);
  if (!validated.ok) {
    return validated;
  }
  const { partyName, plusOnesAllowed, members } = validated.value;

  // Try the write. The DB's @unique constraint guards against duplicate parties.
  try {
    await prisma.invitation.create({
      data: {
        partyName,
        plusOnesAllowed,
        guests: {
          create: members.map((member) => ({
            name: member.name,
            nameKey: normalizeName(member.name),
          })),
        },
      },
    });
  } catch (error) {
    return handleActionError(error, 'creating new invitation', {
      P2002: { error: 'A party with that name already exists.', field: 'partyName' },
    });
  }

  revalidateRsvpPages();
  return { ok: true };
}

/**
 * Updates a party and reconciles its member list in one transaction: members with
 * an id are renamed, members without one are added, and existing members missing
 * from the list are removed. Plus-ones are never touched here — those belong to
 * the guest's response.
 * @param invitationId - id of the party to update
 * @param input - the full desired state of the party (see {@link InvitationInput})
 * @returns an ActionResult the client can react to
 */
export async function updateInvitation (invitationId: number | undefined, input: InvitationInput): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (invitationId === undefined) {
    return { ok: false, error: 'Party could not be found.', field: 'invitation' };
  }

  const validated = validateInvitationInput(input);
  if (!validated.ok) {
    return validated;
  }
  const { partyName, plusOnesAllowed, members } = validated.value;

  try {
    const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: { guests: true },
      });
      if (invitation === null) {
        return { ok: false, error: PARTY_GONE, field: 'invitation' };
      }

      // Guests have already named plus-ones against the old allowance, and we
      // cannot quietly un-invite someone. Reject them first, then lower it.
      const activePlusOnes = countActivePlusOnes(invitation);
      if (plusOnesAllowed < activePlusOnes) {
        return {
          ok: false,
          error: `${activePlusOnes} plus-${activePlusOnes === 1 ? 'one is' : 'ones are'} already named, so you cannot allow fewer than ${activePlusOnes}. Reject one first.`,
          field: 'plusOnesAllowed',
        };
      }

      const existingMemberIds = new Set(invitation.guests.filter((guest) => !guest.isPlusOne).map((guest) => guest.id));
      if (members.some((member) => member.id !== undefined && !existingMemberIds.has(member.id))) {
        return { ok: false, error: 'A guest in this party no longer exists, refresh your page and try again.', field: 'members' };
      }

      const keptIds = new Set(members.flatMap((member) => (member.id === undefined ? [] : [member.id])));
      const removedIds = [...existingMemberIds].filter((id) => !keptIds.has(id));

      await tx.guest.deleteMany({ where: { id: { in: removedIds } } });

      for (const member of members) {
        if (member.id === undefined) {
          await tx.guest.create({
            data: { invitationId, name: member.name, nameKey: normalizeName(member.name) },
          });
        } else {
          await tx.guest.update({
            where: { id: member.id },
            data: { name: member.name, nameKey: normalizeName(member.name) },
          });
        }
      }

      await tx.invitation.update({
        where: { id: invitationId },
        data: { partyName, plusOnesAllowed },
      });

      return { ok: true };
    });

    if (!result.ok) {
      return result;
    }
  } catch (error) {
    return handleActionError(error, 'updating invitation', {
      P2002: { error: 'A party with that name already exists.', field: 'partyName' },
      // Deleted mid-edit.
      P2025: { error: PARTY_GONE, field: 'invitation' },
    });
  }

  revalidateRsvpPages();
  return { ok: true };
}

/**
 * Deletes a party and, by cascade, its guests and their response.
 * @param invitationId - id of the party to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteInvitation (invitationId: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (invitationId === undefined) {
    return { ok: false, error: 'Party could not be found.', field: 'invitation' };
  }

  try {
    await prisma.invitation.delete({
      where: { id: invitationId },
    });
  } catch (error) {
    return handleActionError(error, 'deleting invitation', {
      // Already removed.
      P2025: { error: PARTY_GONE },
    });
  }

  revalidateRsvpPages();
  return { ok: true };
}

/**
 * Approves or rejects a plus-one a guest named on their response.
 * @param guestId - id of the plus-one
 * @param status - the couple's decision
 * @returns an ActionResult the client can react to
 */
export async function setPlusOneStatus (guestId: number | undefined, status: 'APPROVED' | 'REJECTED'): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (guestId === undefined) {
    return { ok: false, error: 'Guest could not be found.', field: 'guest' };
  }

  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return { ok: false, error: 'Unknown plus-one status.', field: 'guest' };
  }

  try {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { invitation: { include: { guests: true } } },
    });
    if (guest === null || !guest.isPlusOne) {
      return { ok: false, error: PLUS_ONE_GONE, field: 'guest' };
    }

    // Un-rejecting takes a slot back. Make sure there still is one, since the
    // allowance may have been lowered after this plus-one was rejected.
    if (status === 'APPROVED' && guest.plusOneStatus === 'REJECTED') {
      const activePlusOnes = countActivePlusOnes(guest.invitation);
      if (activePlusOnes >= guest.invitation.plusOnesAllowed) {
        return { ok: false, error: 'This party has no plus-one slots left. Raise their allowance first.', field: 'guest' };
      }
    }

    await prisma.guest.update({
      where: { id: guestId },
      data: { plusOneStatus: status },
    });
  } catch (error) {
    return handleActionError(error, 'updating plus-one status', {
      // The guest re-submitted their response and replaced it.
      P2025: { error: PLUS_ONE_GONE, field: 'guest' },
    });
  }

  revalidateRsvpPages();
  return { ok: true };
}

/**
 * Records an invited member's answer by hand, for responses that came in by phone
 * or text instead of the website. Marks the party as responded if it wasn't yet,
 * so it moves out of "awaiting".
 * @param guestId - id of the invited member
 * @param attendance - their answer
 * @returns an ActionResult the client can react to
 */
export async function setAttendance (guestId: number | undefined, attendance: Attendance): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (guestId === undefined) {
    return { ok: false, error: 'Guest could not be found.', field: 'guest' };
  }

  if (attendance !== 'PENDING' && attendance !== 'ATTENDING' && attendance !== 'DECLINED') {
    return { ok: false, error: 'Unknown attendance.', field: 'guest' };
  }

  try {
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (guest === null || guest.isPlusOne) {
      return { ok: false, error: GUEST_GONE, field: 'guest' };
    }

    await prisma.$transaction([
      prisma.guest.update({
        where: { id: guestId },
        data: { attendance },
      }),
      // updateMany so the "only if not yet responded" condition sits in the WHERE
      // clause instead of needing a read first.
      prisma.invitation.updateMany({
        where: { id: guest.invitationId, respondedAt: null },
        data: { respondedAt: new Date() },
      }),
    ]);
  } catch (error) {
    return handleActionError(error, 'updating attendance', {
      // The guest was removed.
      P2025: { error: GUEST_GONE, field: 'guest' },
    });
  }

  revalidateRsvpPages();
  return { ok: true };
}

/**
 * Bulk-adds parties from a guest-list CSV. Additive and safe to repeat — see
 * importGuestParties in src/lib/guest-import.ts for the merge rules.
 * @param csvText - the file's contents, read in the browser
 * @returns an ActionResult, plus what changed on success
 */
export async function importGuestList (csvText: string): Promise<ImportResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (typeof csvText !== 'string' || csvText.length > MAX_CSV_BYTES) {
    return { ok: false, error: 'That file is too large to be a guest list.', field: 'file' };
  }

  // Parsed again here even though the dialog already did: the client's check is
  // for instant feedback, this one is the one that counts.
  const parsed = parseGuestCsv(csvText);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, field: 'file' };
  }

  let summary: ImportSummary;
  try {
    summary = await importGuestParties(prisma, parsed.parties);
  } catch (error) {
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error importing guest list, see below:\n${error}`);
    return {
      ok: false,
      error: 'The import stopped partway. Importing the same file again is safe and will pick up where it left off.',
    };
  } finally {
    // Some parties may have been written even if a later one failed.
    revalidateRsvpPages();
  }

  return { ok: true, summary };
}
