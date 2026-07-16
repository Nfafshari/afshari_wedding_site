"use server";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';
import { parseHttpUrl } from '@/lib/utils';

/**
 * Which input a failure relates to, so the client can highlight the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'link' | 'quantityWanted' | 'image' | 'claimedBy' | 'quantity' | 'item';

export interface RegistryItemInput {
  name?: string | undefined;
  link?: string | undefined;
  quantityWanted?: number | undefined;
  image?: string | null | undefined;
}

/** The route these writes invalidate. `(protected)` is a route group, so it is not in the URL. */
const REGISTRY_MANAGER_PATH = '/planner/registry-manager';

/** quantityWanted is Int; 4 digits keeps it well inside Postgres' int4 range. */
const MAX_QUANTITY = 9999;

/**
 * The shape every action returns: either it worked, or it failed with a reason.
 * The client checks `ok` to decide whether to close the dialog or show an error,
 * and `field` to decide which input to flag.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField };

/**
 * Bounds a quantity once, so create and update can't drift apart on what counts as valid.
 * @returns a failing ActionResult, or null when the value is acceptable
 */
function validateQuantity (value: number, field: 'quantityWanted' | 'quantity', label: string): ActionResult | null {
  // Number(...) can hand us NaN if the client sent something non-numeric.
  if (!Number.isInteger(value) || value < 1) {
    return { ok: false, error: `${label} must be a whole number of 1 or more.`, field };
  }

  if (value > MAX_QUANTITY) {
    return { ok: false, error: `${label} must be ${MAX_QUANTITY} or less.`, field };
  }

  return null;
}

/**
 * Rejects anything that isn't a plain http(s) address. These values are rendered
 * into an href/src, so a `javascript:` URL here would execute on click.
 * @returns a failing ActionResult, or null when the URL is acceptable
 */
function validateUrl (value: string, field: 'link' | 'image', label: string): ActionResult | null {
  if (parseHttpUrl(value) === null) {
    return { ok: false, error: `${label} must be a valid link starting with http:// or https://.`, field };
  }

  return null;
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
  // Validate on the server (the client re-checks these too, for instant feedback).
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Item name cannot be empty.', field: 'name' };
  }

  const linkError = validateUrl(link, 'link', 'Product link');
  if (linkError) {
    return linkError;
  }

  const quantityWantedError = validateQuantity(quantityWanted, 'quantityWanted', 'Quantity wanted');
  if (quantityWantedError) {
    return quantityWantedError;
  }

  // An empty image is allowed — the column default fills in the placeholder.
  const trimmedImage = image.trim();
  if (trimmedImage !== '') {
    const imageError = validateUrl(trimmedImage, 'image', 'Image link');
    if (imageError) {
      return imageError;
    }
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
    // P2002 = unique constraint failed (an item with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'An item with that name already exists.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error creating new registry item, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(REGISTRY_MANAGER_PATH);
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

  if (data.link !== undefined) {
    const linkError = validateUrl(data.link, 'link', 'Product link');
    if (linkError) {
      return linkError;
    }
  }

  const trimmedImage = data.image?.trim();
  if (trimmedImage !== undefined && trimmedImage !== '') {
    const imageError = validateUrl(trimmedImage, 'image', 'Image link');
    if (imageError) {
      return imageError;
    }
  }

  if (data.quantityWanted !== undefined) {
    const quantityWantedError = validateQuantity(data.quantityWanted, 'quantityWanted', 'Quantity wanted');
    if (quantityWantedError) {
      return quantityWantedError;
    }

    // Guests have already called dibs on some of these, and we cannot un-promise a
    // gift someone is already buying. This needs no concurrency to hit — one person
    // with the edit dialog open is enough — so it matters more than the claim race.
    const totals = await getClaimedTotal(registryItemId);
    if (totals === null) {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.', field: 'item' };
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
    // P2002 = unique constraint (an item with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'An item with that name already exists.', field: 'name' };
    }
    // P2025 = record to update not found (the item was deleted).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.', field: 'name' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error updating registry item, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(REGISTRY_MANAGER_PATH);
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
    // P2025 = record to delete does not exist (already removed).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.' };
    }
    // P2003 = foreign key constraint. The count above should have caught this, but a
    // claim landing between the count and the delete would still trip the DB's
    // onDelete: Restrict — which is exactly what that rule is there for.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return { ok: false, error: 'Someone claimed this item just now. Refresh your page and try again.', field: 'item' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error deleting registry item, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(REGISTRY_MANAGER_PATH);
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
  if (itemId === undefined) {
    return { ok: false, error: 'Item could not be found.', field: 'item' };
  }

  const trimmedClaimedBy = claimedBy.trim();
  if (trimmedClaimedBy === '') {
    return { ok: false, error: 'Please say who claimed this.', field: 'claimedBy' };
  }

  const quantityError = validateQuantity(quantity, 'quantity', 'Quantity');
  if (quantityError) {
    return quantityError;
  }

  try {
    const totals = await getClaimedTotal(itemId);
    if (totals === null) {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.', field: 'item' };
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
    // catch it; closing this properly needs a Serializable transaction, which is worth
    // it only once the public /registry page lets guests claim concurrently.
    await prisma.registryClaim.create({
      data: {
        itemId,
        claimedBy: trimmedClaimedBy,
        quantity,
      },
    });
  } catch (error) {
    // P2003 = foreign key constraint (the item was deleted mid-claim).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.', field: 'item' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error creating new registry claim, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(REGISTRY_MANAGER_PATH);
  return { ok: true };
}

/**
 * Removes a claim, freeing that quantity back up for someone else.
 * @param registryClaimId - id of the claim to be deleted
 * @returns an ActionResult the client can react to
 */
export async function deleteRegistryClaim (registryClaimId: number | undefined): Promise<ActionResult> {
  if (registryClaimId === undefined) {
    return { ok: false, error: 'Claim could not be found.' };
  }

  try {
    await prisma.registryClaim.delete({
      where: { id: registryClaimId },
    });
  } catch (error) {
    // P2025 = record to delete does not exist (already removed).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That claim no longer exists, refresh your page and try again.' };
    }
    // Anything else is unexpected, log it and show a generic message to the user.
    console.error(`*ERROR - error deleting registry claim, see below:\n${error}`);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // refresh the page data after a successful write
  revalidatePath(REGISTRY_MANAGER_PATH);
  return { ok: true };
}
