import { parseHttpUrl } from '@/lib/utils';
import type { DemoStore } from "../demo-store";

/**
 * Demo twin of `(protected)/planner/registry-manager/action.ts`. Same validation,
 * same error strings, same control flow — the database is swapped for React state.
 *
 * The rules this file enforces — refusing to shrink `quantityWanted` below what is
 * claimed, refusing to delete a claimed item, refusing to over-claim — were always
 * application logic living in the action. The schema's `onDelete: Restrict` was the
 * backstop, not the rule. So they port across unchanged; only the reads move.
 */

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

/** Kept from the real action, where quantityWanted is an Int in Postgres' int4 range. */
const MAX_QUANTITY = 9999;

/** The placeholder the real schema uses as its column default. */
const DEFAULT_IMAGE = '/window.svg';

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
 * into an href/src, so a `javascript:` URL here would execute on click. Just as
 * true of demo data a visitor types as of the real thing.
 * @returns a failing ActionResult, or null when the URL is acceptable
 */
function validateUrl (value: string, field: 'link' | 'image', label: string): ActionResult | null {
  if (parseHttpUrl(value) === null) {
    return { ok: false, error: `${label} must be a valid link starting with http:// or https://.`, field };
  }

  return null;
}

export function createRegistryActions (store: DemoStore) {
  /**
   * Sums what has already been claimed against an item.
   *
   * The real action re-queried the DB here. This reads the store instead — the same
   * read-before-write, synchronous rather than awaited.
   *
   * @param itemId - id of the item to total up
   * @returns the claimed total, or null if the item no longer exists
   */
  function getClaimedTotal (itemId: number): { claimedTotal: number, quantityWanted: number } | null {
    const item = store.getState().registryItems.find((registryItem) => registryItem.id === itemId);

    if (item === undefined) {
      return null;
    }

    return {
      claimedTotal: item.claimed.reduce((sum, claim) => sum + claim.quantity, 0),
      quantityWanted: item.quantityWanted,
    };
  }

  /**
   * Creates a new registry item.
   * @param name - name of the item (cannot be empty)
   * @param link - where to buy it (http(s) only)
   * @param quantityWanted - how many the couple wants (1 or more)
   * @param image - picture of the item (http(s) only), or empty to use the default
   * @returns an ActionResult the client can react to
   */
  async function createRegistryItem (name: string, link: string, quantityWanted: number, image: string): Promise<ActionResult> {
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

    // An empty image is allowed — the placeholder fills in.
    const trimmedImage = image.trim();
    if (trimmedImage !== '') {
      const imageError = validateUrl(trimmedImage, 'image', 'Image link');
      if (imageError) {
        return imageError;
      }
    }

    // Stands in for the DB's @unique constraint (P2002).
    const isDuplicate = store.getState().registryItems.some(
      (item) => item.name === trimmedName
    );
    if (isDuplicate) {
      return { ok: false, error: 'An item with that name already exists.', field: 'name' };
    }

    const id = store.nextId();

    store.setState((prev) => ({
      ...prev,
      // Re-sorted rather than appended, standing in for the query's
      // [{ name: "asc" }, { id: "asc" }].
      registryItems: [
        ...prev.registryItems,
        {
          id,
          name: trimmedName,
          link: link.trim(),
          quantityWanted,
          // The real action passes undefined so the column default applies; there is
          // no column here, so the default is written in directly.
          image: trimmedImage === '' ? DEFAULT_IMAGE : trimmedImage,
          claimed: [],
        },
      ].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id),
    }));

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
  async function updateRegistryItem (registryItemId: number | undefined, data: RegistryItemInput): Promise<ActionResult> {
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
      // with the edit dialog open is enough.
      const totals = getClaimedTotal(registryItemId);
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

    const items = store.getState().registryItems;

    // Stands in for P2025.
    if (items.find((item) => item.id === registryItemId) === undefined) {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.', field: 'name' };
    }

    // Stands in for P2002, excluding the row being edited.
    if (trimmedName !== undefined) {
      const isDuplicate = items.some(
        (item) => item.id !== registryItemId && item.name === trimmedName
      );
      if (isDuplicate) {
        return { ok: false, error: 'An item with that name already exists.', field: 'name' };
      }
    }

    store.setState((prev) => ({
      ...prev,
      registryItems: prev.registryItems
        .map((item) => {
          if (item.id !== registryItemId) return item;

          // Spread rather than mutating `data` — it belongs to the caller. Each key is
          // applied only when present, matching Prisma's "skip undefined" behaviour.
          return {
            ...item,
            ...(trimmedName !== undefined && { name: trimmedName }),
            ...(data.link !== undefined && { link: data.link.trim() }),
            ...(data.quantityWanted !== undefined && { quantityWanted: data.quantityWanted }),
            // Clearing the image falls back to the placeholder rather than a broken src.
            ...(trimmedImage !== undefined && { image: trimmedImage === '' ? DEFAULT_IMAGE : trimmedImage }),
          };
        })
        // name may have changed, so the query's sort has to be reapplied.
        .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id),
    }));

    return { ok: true };
  }

  /**
   * Deletes a registry item, but only once nobody has claimed it.
   *
   * Unlike Task or BudgetSubcategory, the children here are not ours to throw away:
   * a claim is a record of a real person buying a real gift. So this refuses rather
   * than cascades, and the couple removes the claims deliberately first.
   * @param registryItemId - id of the item to be deleted
   * @returns an ActionResult the client can react to
   */
  async function deleteRegistryItem (registryItemId: number | undefined): Promise<ActionResult> {
    if (registryItemId === undefined) {
      return { ok: false, error: 'Item could not be found.', field: 'item' };
    }

    const item = store.getState().registryItems.find((registryItem) => registryItem.id === registryItemId);

    // Stands in for P2025.
    if (item === undefined) {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.' };
    }

    const claimCount = item.claimed.length;
    if (claimCount > 0) {
      return {
        ok: false,
        error: `${claimCount} ${claimCount === 1 ? 'guest has' : 'guests have'} already claimed this item. Remove their claims first.`,
        field: 'item',
      };
    }

    store.setState((prev) => ({
      ...prev,
      registryItems: prev.registryItems.filter((registryItem) => registryItem.id !== registryItemId),
    }));

    return { ok: true };
  }

  /**
   * Records that someone has claimed some quantity of a registry item.
   * @param itemId - id of the item being claimed
   * @param claimedBy - who is buying it (cannot be empty)
   * @param quantity - how many they are buying (1 or more, and no more than remain)
   * @returns an ActionResult the client can react to
   */
  async function createRegistryClaim (itemId: number | undefined, claimedBy: string, quantity: number): Promise<ActionResult> {
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

    const totals = getClaimedTotal(itemId);
    if (totals === null) {
      return { ok: false, error: 'That item no longer exists, refresh your page and try again.', field: 'item' };
    }

    // The real action documents an accepted race here: two claims landing in the same
    // instant could both pass this check and over-claim. That cannot happen in the
    // demo — one browser tab, one user, single-threaded, and the read above is
    // synchronous. The check stays because the rule is real; the race note does not,
    // because there is no concurrency here to have it with.
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

    const id = store.nextId();
    const createdAt = new Date();

    store.setState((prev) => ({
      ...prev,
      registryItems: prev.registryItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              // Appended: the query orders claims [{ createdAt: "asc" }, { id: "asc" }]
              // and a new claim is always the newest, so the end is where it belongs.
              claimed: [
                ...item.claimed,
                { id, claimedBy: trimmedClaimedBy, quantity, createdAt, itemId },
              ],
            }
          : item
      ),
    }));

    return { ok: true };
  }

  /**
   * Removes a claim, freeing that quantity back up for someone else.
   * @param registryClaimId - id of the claim to be deleted
   * @returns an ActionResult the client can react to
   */
  async function deleteRegistryClaim (registryClaimId: number | undefined): Promise<ActionResult> {
    if (registryClaimId === undefined) {
      return { ok: false, error: 'Claim could not be found.' };
    }

    const claimExists = store.getState().registryItems.some(
      (item) => item.claimed.some((claim) => claim.id === registryClaimId)
    );
    if (!claimExists) {
      return { ok: false, error: 'That claim no longer exists, refresh your page and try again.' };
    }

    store.setState((prev) => ({
      ...prev,
      registryItems: prev.registryItems.map((item) => ({
        ...item,
        claimed: item.claimed.filter((claim) => claim.id !== registryClaimId),
      })),
    }));

    return { ok: true };
  }

  return {
    createRegistryItem,
    updateRegistryItem,
    deleteRegistryItem,
    createRegistryClaim,
    deleteRegistryClaim,
  };
}
