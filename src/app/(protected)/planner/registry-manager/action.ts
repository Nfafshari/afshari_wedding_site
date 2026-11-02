"use server";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireUserAction } from '@/lib/require-user';
import { handleActionError, validateHttpUrl, validateWholeNumber, type ActionResult as SharedActionResult } from '@/lib/action';

/**
 * Which input a failure relates to, so the client can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'link' | 'quantityWanted' | 'image' | 'claimedBy' | 'quantity' | 'item';

/** See {@link SharedActionResult}; narrowed to this page's fields. */
export type ActionResult = SharedActionResult<ErrorField>;

export interface RegistryItemInput {
  name?: string | undefined;
  link?: string | undefined;
  quantityWanted?: number | undefined;
  image?: string | null | undefined;
}

/** The route these writes invalidate. `(protected)` is a route group, so it is not in the URL. */
const REGISTRY_MANAGER_PATH = '/planner/registry-manager';
/** The guest site's registry, which shows the same items and claim counts. */
const PUBLIC_REGISTRY_PATH = '/registry';

/** quantityWanted is Int; 4 digits keeps it well inside Postgres' int4 range. */
const MAX_QUANTITY = 9999;

const ITEM_GONE = 'That item no longer exists, refresh your page and try again.';

/** Refreshes every page that shows registry items, after a successful write. */
function refresh (): void {
  revalidatePath(REGISTRY_MANAGER_PATH);
  revalidatePath(PUBLIC_REGISTRY_PATH);
}

/**
 * Sums what has already been claimed against an item.
 * @param itemId - id of the item to total up
 * @returns the claimed total, or null if the item no longer exists
 */
async function getClaimedTotal (itemId: number): Promise<{ claimedTotal: number, quantityWanted: number } | null> {
  const item = await prisma.registryItem.findUnique({
    where: { id: itemId },
    include: { claimed: true },
  });

  if (item === null) {
    return null;
  }

  return {
    claimedTotal: item.claimed.reduce((sum, claim) => sum + claim.quantity, 0),
    quantityWanted: item.quantityWanted,
  };
}

/**
 * Creates a new registry item in the DB.
 * @param name - name of the item (cannot be empty)
 * @param link - where to buy it (http(s) only)
 * @param quantityWanted - how many the couple wants (1 or more)
 * @param image - picture of the item (http(s) only), or empty to use the default
 * @returns an ActionResult the client can react to
 */
export async function createRegistryItem (name: string, link: string, quantityWanted: number, image: string): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // Validate on the server (the client re-checks these too, for instant feedback).
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Item name cannot be empty.', field: 'name' };
  }

  // An empty image is allowed — the column default fills in the placeholder.
  const trimmedImage = image.trim();
  const invalid = validateHttpUrl(link, 'link', 'Product link')
    ?? validateWholeNumber(quantityWanted, 'quantityWanted', 'Quantity wanted', MAX_QUANTITY)
    ?? (trimmedImage === '' ? null : validateHttpUrl(trimmedImage, 'image', 'Image link'));
  if (invalid) {
    return invalid;
  }

  // Try the write. The DB's @unique constraint guards against duplicates.
  try {
    await prisma.registryItem.create({
      data: {
        name: trimmedName,
        link: link.trim(),
        quantityWanted,
        // Passing undefined lets the column default apply; null would override it.
        image: trimmedImage === '' ? undefined : trimmedImage,
      },
    });
  } catch (error) {
    return handleActionError(error, 'creating new registry item', {
      P2002: { error: 'An item with that name already exists.', field: 'name' },
    });
  }

  refresh();
  return { ok: true };
}

/**
 * Updates the registry item with the passed parameters.
 * If any of the optional parameters are undefined, that value is left untouched.
 * @param registryItemId - id of the item to update
 * @param data - an object of all optional inputs that can be updated:
 * - name
 * - link
 * - quantityWanted
 * - image
 *
 * see {@link RegistryItemInput}
 * @returns an ActionResult the client can react to
 */
export async function updateRegistryItem (registryItemId: number | undefined, data: RegistryItemInput): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (registryItemId === undefined) {
    return { ok: false, error: 'Item could not be found.', field: 'item' };
  }

  // Nothing was passed, so there is nothing to do.
  if (data.name === undefined && data.link === undefined && data.quantityWanted === undefined && data.image === undefined) {
    return { ok: true };
  }

  // validate all parameters
  const trimmedName = data.name?.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Item name cannot be empty.', field: 'name' };
  }

  const trimmedImage = data.image?.trim();
  const invalid = (data.link === undefined ? null : validateHttpUrl(data.link, 'link', 'Product link'))
    ?? (trimmedImage === undefined || trimmedImage === '' ? null : validateHttpUrl(trimmedImage, 'image', 'Image link'))
    ?? (data.quantityWanted === undefined ? null : validateWholeNumber(data.quantityWanted, 'quantityWanted', 'Quantity wanted', MAX_QUANTITY));
  if (invalid) {
    return invalid;
  }

  if (data.quantityWanted !== undefined) {
    // Guests have already called dibs on some of these, and we cannot un-promise a
    // gift someone is already buying. This needs no concurrency to hit — one person
    // with the edit dialog open is enough — so it matters more than the claim race.
    const totals = await getClaimedTotal(registryItemId);
    if (totals === null) {
      return { ok: false, error: ITEM_GONE, field: 'item' };
    }

    if (data.quantityWanted < totals.claimedTotal) {
      return {
        ok: false,
        error: `${totals.claimedTotal} of these are already claimed, so you cannot ask for fewer than ${totals.claimedTotal}.`,
        field: 'quantityWanted',
      };
    }
  }

  // Spread rather than mutating `data` — it belongs to the caller. Prisma skips any
  // key that is undefined, so absent fields are left untouched.
  try {
    await prisma.registryItem.update({
      where: { id: registryItemId },
      data: {
        ...data,
        name: trimmedName,
        link: data.link?.trim(),
        // Clearing the image falls back to the placeholder rather than a broken src.
        image: trimmedImage === '' ? '/window.svg' : trimmedImage,
      },
    });
  } catch (error) {
    return handleActionError(error, 'updating registry item', {
      P2002: { error: 'An item with that name already exists.', field: 'name' },
      // The item was deleted while the dialog was open.
      P2025: { error: ITEM_GONE, field: 'name' },
    });
  }

  refresh();
  return { ok: true };
}

/**
 * Deletes a registry item from the DB, but only once nobody has claimed it.
 *
 * Unlike Task or BudgetSubcategory, the children here are not ours to throw away:
 * a claim is a record of a real person buying a real gift. So this refuses rather
 * than cascades, and the couple removes the claims deliberately first.
 * @param registryItemId - id of the item to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteRegistryItem (registryItemId: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (registryItemId === undefined) {
    return { ok: false, error: 'Item could not be found.', field: 'item' };
  }

  try {
    const claimCount = await prisma.registryClaim.count({
      where: { itemId: registryItemId },
    });

    if (claimCount > 0) {
      return {
        ok: false,
        error: `${claimCount} ${claimCount === 1 ? 'guest has' : 'guests have'} already claimed this item. Remove their claims first.`,
        field: 'item',
      };
    }

    await prisma.registryItem.delete({
      where: { id: registryItemId },
    });
  } catch (error) {
    return handleActionError(error, 'deleting registry item', {
      // Already removed.
      P2025: { error: ITEM_GONE },
      // The count above should have caught this, but a claim landing between the count
      // and the delete would still trip the DB's onDelete: Restrict — which is exactly
      // what that rule is there for.
      P2003: { error: 'Someone claimed this item just now. Refresh your page and try again.', field: 'item' },
    });
  }

  refresh();
  return { ok: true };
}

/**
 * Records that someone has claimed some quantity of a registry item.
 * @param itemId - id of the item being claimed
 * @param claimedBy - who is buying it (cannot be empty)
 * @param quantity - how many they are buying (1 or more, and no more than remain)
 * @returns an ActionResult the client can react to
 */
export async function createRegistryClaim (itemId: number | undefined, claimedBy: string, quantity: number): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (itemId === undefined) {
    return { ok: false, error: 'Item could not be found.', field: 'item' };
  }

  const trimmedClaimedBy = claimedBy.trim();
  if (trimmedClaimedBy === '') {
    return { ok: false, error: 'Please say who claimed this.', field: 'claimedBy' };
  }

  const quantityError = validateWholeNumber(quantity, 'quantity', 'Quantity', MAX_QUANTITY);
  if (quantityError) {
    return quantityError;
  }

  try {
    const totals = await getClaimedTotal(itemId);
    if (totals === null) {
      return { ok: false, error: ITEM_GONE, field: 'item' };
    }

    const remaining = totals.quantityWanted - totals.claimedTotal;
    if (quantity > remaining) {
      return {
        ok: false,
        error: remaining === 0
          ? 'This item is already fully claimed.'
          : `Only ${remaining} left to claim.`,
        field: 'quantity',
      };
    }

    // Race: two claims submitted in the same instant could both pass the check above
    // and over-claim the item. Accepted — claims are typed in by hand by two people,
    // and the worst case (one extra gravy boat) is visible on the page and undone by
    // deleting a claim. `remaining` is derived from a SUM, so no column constraint can
    // catch it. The public /registry claim (where guests do race) uses a Serializable
    // transaction; this hand-entered path doesn't need one.
    await prisma.registryClaim.create({
      data: {
        itemId,
        claimedBy: trimmedClaimedBy,
        quantity,
      },
    });
  } catch (error) {
    return handleActionError(error, 'creating new registry claim', {
      // The item was deleted mid-claim.
      P2003: { error: ITEM_GONE, field: 'item' },
    });
  }

  refresh();
  return { ok: true };
}

/**
 * Removes a claim, freeing that quantity back up for someone else.
 * @param registryClaimId - id of the claim to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteRegistryClaim (registryClaimId: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (registryClaimId === undefined) {
    return { ok: false, error: 'Claim could not be found.' };
  }

  try {
    await prisma.registryClaim.delete({
      where: { id: registryClaimId },
    });
  } catch (error) {
    return handleActionError(error, 'deleting registry claim', {
      // Already removed.
      P2025: { error: 'That claim no longer exists, refresh your page and try again.' },
    });
  }

  refresh();
  return { ok: true };
}
