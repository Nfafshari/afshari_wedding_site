"use server";
import { prisma } from '@/lib/prisma';
import type { Attendance, PlusOneStatus } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { MAX_LONG_TEXT, MAX_SHORT_TEXT, NAME_NOT_FOUND as NOT_FOUND, isRsvpOpen, normalizeName, toLookupKey } from '@/lib/rsvp';

/**
 * Public actions. These run for anyone on the internet, so unlike the planner's
 * actions there is no session guard. The guard is knowing a guest's full name,
 * re-checked on every call, and the payloads leave out anything a stranger
 * shouldn't be able to read back (stored email and phone).
 */

/**
 * Which input a failure relates to, so the form can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'members' | 'plusOnes' | 'contact' | 'noteToCouple' | 'songRequest';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField };

/** What a guest sees of their own party. */
export type PublicParty = {
  invitationId: number;
  partyName: string;
  plusOnesAllowed: number;
  respondedAt: Date | null;
  respondedByName: string | null;
  noteToCouple: string | null;
  songRequest: string | null;
  /** Whether contact info is on file, without revealing it. */
  hasContact: boolean;
  members: { id: number; name: string; attendance: Attendance; dietary: string | null }[];
  plusOnes: { id: number; name: string; dietary: string | null; plusOneStatus: PlusOneStatus }[];
};

export type LookupResult =
  | { ok: true; kind: 'party'; party: PublicParty }
  | { ok: true; kind: 'choose'; options: { invitationId: number; partyName: string }[] }
  | { ok: false; error: string; field?: ErrorField };

export type RsvpSubmission = {
  members: { id: number; attending: boolean; dietary: string }[];
  /** Blank names are empty slots and are ignored. `id` is set for plus-ones already saved. */
  plusOnes: { id?: number | undefined; name: string; dietary: string }[];
  email: string;
  phoneNumber: string;
  noteToCouple: string;
  songRequest: string;
};

const RSVP_PATHS = ['/planner/rsvp', '/planner'];

const STALE = 'Your invitation changed since you opened it. Please look up your name again.';

/** Loose on purpose: catches typos like a missing @, not every RFC edge case. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits plus the punctuation people actually type: +1 (555) 218-0142. */
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;

/**
 * Finds the party a guest belongs to by their full name.
 * @param name - the guest's name as they typed it
 * @param invitationId - set when the guest picked one of several matching parties
 * @returns their party, a list of parties to choose from, or a reason it failed
 */
export async function findInvitation (name: string, invitationId?: number): Promise<LookupResult> {
  const lookup = toLookupKey(name);
  if (!lookup.ok) {
    return lookup;
  }

  try {
    const matches = await prisma.guest.findMany({
      where: {
        nameKey: lookup.key,
        isPlusOne: false,
        ...(invitationId === undefined ? {} : { invitationId }),
      },
      select: { invitation: { select: { id: true, partyName: true } } },
      orderBy: { invitation: { partyName: 'asc' } },
    });

    if (matches.length === 0) {
      return { ok: false, error: NOT_FOUND, field: 'name' };
    }

    // Two guests can share a name. Let them say which party is theirs rather
    // than guessing, and never merge the two.
    const options = [...new Map(matches.map(({ invitation }) => [invitation.id, invitation])).values()];
    if (options.length > 1) {
      return {
        ok: true,
        kind: 'choose',
        options: options.map((option) => ({ invitationId: option.id, partyName: option.partyName })),
      };
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: options[0].id },
      include: { guests: { orderBy: [{ name: 'asc' }, { id: 'asc' }] } },
    });
    if (invitation === null) {
      return { ok: false, error: NOT_FOUND, field: 'name' };
    }

    return {
      ok: true,
      kind: 'party',
      party: {
        invitationId: invitation.id,
        partyName: invitation.partyName,
        plusOnesAllowed: invitation.plusOnesAllowed,
        respondedAt: invitation.respondedAt,
        respondedByName: invitation.respondedByName,
        noteToCouple: invitation.noteToCouple,
        songRequest: invitation.songRequest,
        hasContact: invitation.email !== null || invitation.phoneNumber !== null,
        members: invitation.guests
          .filter((guest) => !guest.isPlusOne)
          .map(({ id, name, attendance, dietary }) => ({ id, name, attendance, dietary })),
        plusOnes: invitation.guests
          .filter((guest) => guest.isPlusOne)
          .map(({ id, name, dietary, plusOneStatus }) => ({ id, name, dietary, plusOneStatus: plusOneStatus ?? 'PENDING' })),
      },
    };
  } catch (error) {
    // Anything else is unexpected, log it and show a generic message to the guest.
    console.error(`*ERROR - error looking up invitation, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

/** Trims an optional text field and caps its length. @returns the value, '' for blank, or null if too long */
function cleanText (value: string, max: number): string | null {
  const trimmed = value.trim();
  return trimmed.length > max ? null : trimmed;
}

/**
 * Saves a party's response: who is coming, dietary notes, plus-ones, and contact.
 * Safe to call again — a second submit edits the first, which is how guests
 * change their answer before the deadline.
 * @param lookupName - the name the guest looked themselves up by, re-verified here
 * @param invitationId - the party being answered for
 * @param input - the form (see {@link RsvpSubmission})
 * @returns an ActionResult the form can react to
 */
export async function submitRsvp (lookupName: string, invitationId: number, input: RsvpSubmission): Promise<ActionResult> {
  // Checked on the server even though the form hides itself after the deadline:
  // a tab left open from before it would otherwise still submit.
  if (!isRsvpOpen()) {
    return { ok: false, error: 'RSVPs are closed. Please reach out to us directly to make changes.' };
  }

  const lookup = toLookupKey(lookupName);
  if (!lookup.ok) {
    return { ok: false, error: STALE };
  }

  // -- Validate the parts that don't need the database --
  const memberAnswers = new Map<number, { attending: boolean; dietary: string }>();
  for (const member of input.members) {
    const dietary = cleanText(member.dietary, MAX_SHORT_TEXT);
    if (dietary === null) {
      return { ok: false, error: `Dietary notes must be ${MAX_SHORT_TEXT} characters or less.`, field: 'members' };
    }
    memberAnswers.set(member.id, { attending: member.attending === true, dietary });
  }

  const plusOnes: { id?: number; name: string; dietary: string }[] = [];
  for (const slot of input.plusOnes) {
    const name = cleanText(slot.name, MAX_SHORT_TEXT);
    const dietary = cleanText(slot.dietary, MAX_SHORT_TEXT);
    if (name === null || dietary === null) {
      return { ok: false, error: `Guest names and dietary notes must be ${MAX_SHORT_TEXT} characters or less.`, field: 'plusOnes' };
    }
    // A blank slot is a plus-one they chose not to bring.
    if (name !== '') {
      plusOnes.push({ id: slot.id, name, dietary });
    }
  }

  const email = cleanText(input.email, MAX_SHORT_TEXT);
  const phoneNumber = cleanText(input.phoneNumber, MAX_SHORT_TEXT);
  if (email === null || (email !== '' && !EMAIL_PATTERN.test(email))) {
    return { ok: false, error: 'Please enter a valid email address.', field: 'contact' };
  }
  if (phoneNumber === null || (phoneNumber !== '' && !PHONE_PATTERN.test(phoneNumber))) {
    return { ok: false, error: 'Please enter a valid phone number.', field: 'contact' };
  }

  const noteToCouple = cleanText(input.noteToCouple, MAX_LONG_TEXT);
  if (noteToCouple === null) {
    return { ok: false, error: `Notes must be ${MAX_LONG_TEXT} characters or less.`, field: 'noteToCouple' };
  }

  const songRequest = cleanText(input.songRequest, MAX_SHORT_TEXT);
  if (songRequest === null) {
    return { ok: false, error: `Song requests must be ${MAX_SHORT_TEXT} characters or less.`, field: 'songRequest' };
  }

  try {
    const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: { guests: true },
      });
      if (invitation === null) {
        return { ok: false, error: STALE };
      }

      // The real guard: the name they looked up must be on *this* invitation.
      // Without it anyone could post a guessed id and overwrite a stranger's RSVP.
      const members = invitation.guests.filter((guest) => !guest.isPlusOne);
      const responder = members.find((guest) => guest.nameKey === lookup.key);
      if (responder === undefined) {
        return { ok: false, error: STALE };
      }

      // Every invited member must be answered for, and only them.
      if (memberAnswers.size !== members.length || members.some((guest) => !memberAnswers.has(guest.id))) {
        return { ok: false, error: STALE, field: 'members' };
      }

      // Contact is required, but a returning guest doesn't have to retype it:
      // blank both means "keep what you have".
      const hasNewContact = email !== '' || phoneNumber !== '';
      const hasStoredContact = invitation.email !== null || invitation.phoneNumber !== null;
      if (!hasNewContact && !hasStoredContact) {
        return { ok: false, error: 'Please leave an email or phone number so we can reach you.', field: 'contact' };
      }

      const anyAttending = [...memberAnswers.values()].some((answer) => answer.attending);
      const existingPlusOnes = invitation.guests.filter((guest) => guest.isPlusOne);
      const existingById = new Map(existingPlusOnes.map((guest) => [guest.id, guest]));

      // Nobody coming means nobody to bring.
      const keptPlusOnes = anyAttending ? plusOnes : [];

      if (keptPlusOnes.length > invitation.plusOnesAllowed) {
        return {
          ok: false,
          error: invitation.plusOnesAllowed === 0
            ? 'This invitation does not include additional guests.'
            : `This invitation includes up to ${invitation.plusOnesAllowed} additional guest${invitation.plusOnesAllowed === 1 ? '' : 's'}.`,
          field: 'plusOnes',
        };
      }
      if (keptPlusOnes.some((slot) => slot.id !== undefined && !existingById.has(slot.id))) {
        return { ok: false, error: STALE, field: 'plusOnes' };
      }

      for (const [guestId, answer] of memberAnswers) {
        await tx.guest.update({
          where: { id: guestId },
          data: {
            attendance: answer.attending ? 'ATTENDING' : 'DECLINED',
            dietary: answer.dietary === '' ? null : answer.dietary,
          },
        });
      }

      // Reconcile plus-ones by id. A name that normalizes the same keeps its
      // status, so fixing a typo or a dietary note doesn't undo an approval. A
      // different name is a different person, and goes back for approval.
      const keptIds = new Set(keptPlusOnes.flatMap((slot) => (slot.id === undefined ? [] : [slot.id])));
      await tx.guest.deleteMany({
        where: { id: { in: existingPlusOnes.filter((guest) => !keptIds.has(guest.id)).map((guest) => guest.id) } },
      });

      for (const slot of keptPlusOnes) {
        const nameKey = normalizeName(slot.name);
        const dietary = slot.dietary === '' ? null : slot.dietary;
        const existing = slot.id === undefined ? undefined : existingById.get(slot.id);

        if (existing === undefined) {
          await tx.guest.create({
            data: {
              invitationId,
              name: slot.name,
              nameKey,
              attendance: 'ATTENDING',
              dietary,
              isPlusOne: true,
              plusOneStatus: 'PENDING',
            },
          });
        } else {
          await tx.guest.update({
            where: { id: existing.id },
            data: {
              name: slot.name,
              nameKey,
              dietary,
              plusOneStatus: existing.nameKey === nameKey ? existing.plusOneStatus : 'PENDING',
            },
          });
        }
      }

      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          respondedAt: new Date(),
          respondedByName: responder.name,
          // undefined leaves the stored value alone (see the contact rule above).
          email: hasNewContact ? (email === '' ? null : email) : undefined,
          phoneNumber: hasNewContact ? (phoneNumber === '' ? null : phoneNumber) : undefined,
          noteToCouple: noteToCouple === '' ? null : noteToCouple,
          songRequest: songRequest === '' ? null : songRequest,
        },
      });

      return { ok: true };
    });

    if (!result.ok) {
      return result;
    }
  } catch (error) {
    // Anything else is unexpected, log it and show a generic message to the guest.
    console.error(`*ERROR - error submitting rsvp, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the couple's tracker after a successful write
  for (const path of RSVP_PATHS) {
    revalidatePath(path);
  }
  return { ok: true };
}
