/**
 * RSVP rules and math, shared by the planner, the public RSVP form, the CSV import
 * and the seed.
 *
 * Parameters are structural rather than the `Invitations` type exported from
 * `planner/rsvp/page.tsx`, for the same reason as lib/registry.ts: keeping `lib/`
 * from importing `app/`. String literals stand in for the Prisma enums for the same
 * reason — `seed.ts` and `import-guests.ts` run outside Next and import this too.
 */

/**
 * Last day guests can submit or change their response, inclusive. Stored as the
 * instant the day ends on the US west coast, so nobody loses their last evening.
 */
export const RSVP_DEADLINE = new Date('2027-08-01T23:59:59-07:00');

/** Whether the public form still accepts responses. */
export function isRsvpOpen (now: Date = new Date()): boolean {
  return now.getTime() <= RSVP_DEADLINE.getTime();
}

/** The deadline as guests read it, e.g. "August 1, 2027". */
export function formatRsvpDeadline (): string {
  return RSVP_DEADLINE.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

/** Cap for names and dietary notes. */
export const MAX_SHORT_TEXT = 200;
/** Cap for the note to the couple. */
export const MAX_LONG_TEXT = 1000;

/**
 * Folds a name down to what the lookup compares, so "José  O'Neil" and "jose oneil"
 * find the same guest. Accents go, case goes, punctuation other than hyphens goes,
 * and runs of whitespace collapse.
 *
 * Every write of `Guest.nameKey` and every lookup must go through this one function.
 * If the two ever normalize differently, guests get "we couldn't find that name"
 * for no reason they can see.
 */
export function normalizeName (value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type GuestLike = {
  attendance: 'PENDING' | 'ATTENDING' | 'DECLINED';
  isPlusOne: boolean;
  plusOneStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

type InvitationLike = {
  respondedAt: Date | null;
  guests: GuestLike[];
};

/** Invited members only. Plus-ones are not on the guest list. */
export function getMembers<T extends GuestLike> (invitation: { guests: T[] }): T[] {
  return invitation.guests.filter((guest) => !guest.isPlusOne);
}

export function getPlusOnes<T extends GuestLike> (invitation: { guests: T[] }): T[] {
  return invitation.guests.filter((guest) => guest.isPlusOne);
}

/**
 * Whether this guest counts toward the headcount. A plus-one counts only once the
 * couple approves it. That is the whole point of the approval step.
 */
export function isCountedAttending (guest: GuestLike): boolean {
  if (guest.isPlusOne) {
    return guest.plusOneStatus === 'APPROVED';
  }

  return guest.attendance === 'ATTENDING';
}

/** Plus-ones that still take up one of the party's slots. A rejected name frees its slot. */
export function countActivePlusOnes (invitation: { guests: GuestLike[] }): number {
  return getPlusOnes(invitation).filter((guest) => guest.plusOneStatus !== 'REJECTED').length;
}

export type RsvpStats = {
  /** Invited members across every party, excluding plus-ones. */
  invited: number;
  /** Parties that have submitted the form. */
  respondedParties: number;
  /** Parties still to hear from. */
  awaitingParties: number;
  /** Members attending plus approved plus-ones. */
  attending: number;
  /** Members who declined. */
  declined: number;
  /** Plus-ones waiting on the couple. */
  pendingPlusOnes: number;
};

export function getRsvpStats (invitations: InvitationLike[]): RsvpStats {
  const guests = invitations.flatMap((invitation) => invitation.guests);
  const respondedParties = invitations.filter((invitation) => invitation.respondedAt !== null).length;

  return {
    invited: guests.filter((guest) => !guest.isPlusOne).length,
    respondedParties,
    awaitingParties: invitations.length - respondedParties,
    attending: guests.filter(isCountedAttending).length,
    declined: guests.filter((guest) => !guest.isPlusOne && guest.attendance === 'DECLINED').length,
    pendingPlusOnes: guests.filter((guest) => guest.isPlusOne && guest.plusOneStatus === 'PENDING').length,
  };
}

/** Which planner section a party lands in. */
export type PartyGroup = 'attending' | 'declined' | 'awaiting';

/**
 * A party that has not responded is awaiting, even if the couple marked a member
 * by hand. Once responded, one attending member is enough to count the party as
 * attending. A mixed party belongs with the people who are coming, and the
 * per-guest chips show who is not.
 */
export function getPartyGroup (invitation: InvitationLike): PartyGroup {
  if (invitation.respondedAt === null) {
    return 'awaiting';
  }

  const anyAttending = getMembers(invitation).some((guest) => guest.attendance === 'ATTENDING');
  return anyAttending ? 'attending' : 'declined';
}
