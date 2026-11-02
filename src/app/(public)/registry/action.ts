"use server";
import { revalidatePath } from 'next/cache';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { checkClaimQuantity, getClaimedQuantity } from '@/lib/registry';
import { NAME_NOT_FOUND, toLookupKey } from '@/lib/rsvp';

/**
 * Public action. It runs for anyone on the internet, so like the RSVP actions there
 * is no session guard. The guard is knowing an invited guest's full name, checked on
 * every call, and the result never reveals who else claimed what.
 */

export type ClaimResult =
  | { ok: true; claimedBy: string; quantity: number }
  | { ok: false; error: string; field?: 'name' | 'quantity' };

/** Every page that shows claims. `(protected)` is a route group, so it is not in the URL. */
const REGISTRY_PATHS = ['/registry', '/planner/registry-manager', '/planner'];

const GENERIC = 'Something went wrong. Please try again.';

/**
 * Claims some of a registry item for an invited guest.
 * @param name - the guest's first and last name as they typed it
 * @param itemId - the item being claimed
 * @param quantity - how many (1 up to what's still unclaimed)
 * @returns the name the claim was saved under, or a reason it failed
 */
export async function claimRegistryItem (name: string, itemId: number, quantity: number): Promise<ClaimResult> {
  // Server Actions accept whatever a caller sends, not just what the form would.
  if (typeof name !== 'string' || !Number.isInteger(itemId) || typeof quantity !== 'number') {
    return { ok: false, error: GENERIC };
  }

  const lookup = toLookupKey(name);
  if (!lookup.ok) {
    return lookup;
  }

  try {
    // Any invited guest with that name will do; the claim is saved under the name as it
    // is on the guest list, not as typed. Plus-ones aren't on the printed invitations.
    const guest = await prisma.guest.findFirst({
      where: { nameKey: lookup.key, isPlusOne: false },
      select: { name: true },
      orderBy: { id: 'asc' },
    });
    if (guest === null) {
      return { ok: false, error: NAME_NOT_FOUND, field: 'name' };
    }

    // Serializable, because "how many are left" is a SUM no column constraint can guard:
    // two guests claiming the last one at once must not both succeed. The loser gets P2034.
    const result = await prisma.$transaction(async (tx): Promise<ClaimResult> => {
      const item = await tx.registryItem.findUnique({
        where: { id: itemId },
        select: { quantityWanted: true, claimed: { select: { quantity: true } } },
      });
      if (item === null) {
        return { ok: false, error: 'That gift is no longer on the registry. Please refresh the page.' };
      }

      const problem = checkClaimQuantity(quantity, item.quantityWanted - getClaimedQuantity(item));
      if (problem) {
        return { ok: false, error: problem, field: 'quantity' };
      }

      await tx.registryClaim.create({ data: { itemId, claimedBy: guest.name, quantity } });
      return { ok: true, claimedBy: guest.name, quantity };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (result.ok) {
      REGISTRY_PATHS.forEach((path) => revalidatePath(path));
    }
    return result;
  } catch (error) {
    // P2034 = the Serializable transaction lost a race with another claim.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { ok: false, error: 'Someone else was claiming this at the same moment. Please try again.' };
    }
    // Anything else is unexpected, log it and show a generic message to the guest.
    console.error(`*ERROR - error claiming registry item, see below:\n${error}`);
    return { ok: false, error: GENERIC };
  }
}
