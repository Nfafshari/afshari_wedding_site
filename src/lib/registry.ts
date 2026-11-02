/**
 * Pure registry math, shared by the registry manager and the planner's dashboard card.
 *
 * Parameters are structural rather than the `RegistryItem` type exported from
 * `registry-manager/page.tsx`, for the same reason as lib/budget.ts: keeping `lib/`
 * from importing `app/`.
 */

/** Most of one gift anyone can want or claim; well inside Postgres' int4 range. */
export const MAX_REGISTRY_QUANTITY = 9999;

type ItemLike = {
  quantityWanted: number;
  claimed: { quantity: number }[];
};

/** How many of this item people have actually called dibs on. */
export function getClaimedQuantity (item: ItemLike): number {
  return item.claimed.reduce((sum, claim) => sum + claim.quantity, 0);
}

/**
 * An item counts as claimed only once the whole quantity wanted is spoken for.
 * A partly claimed item is not claimed — someone still needs to buy the rest.
 */
export function isFullyClaimed (item: ItemLike): boolean {
  return getClaimedQuantity(item) >= item.quantityWanted;
}

/**
 * Why a guest can't claim `quantity` of an item with `remaining` left, or null if they can.
 * `remaining` is what's still unclaimed right now, so the message can say how many are left.
 */
export function checkClaimQuantity (quantity: number, remaining: number): string | null {
  if (remaining <= 0) return 'This gift has already been fully claimed.';
  if (!Number.isInteger(quantity) || quantity < 1) return 'Please choose how many you would like to claim.';
  if (quantity > remaining) return remaining === 1 ? 'Someone just claimed some, so only 1 is left.' : `Someone just claimed some, so only ${remaining} are left.`;
  return null;
}

/**
 * Why `wanted` can't be saved when `claimed` are already promised, or null if it can.
 * Asking for fewer would un-promise a gift someone is already out buying.
 */
export function checkWantedNotBelowClaimed (wanted: number, claimed: number): string | null {
  return wanted < claimed ? `${claimed} of these are already claimed, so you cannot ask for fewer than ${claimed}.` : null;
}

export function countFullyClaimedItems (items: ItemLike[]): number {
  return items.filter(isFullyClaimed).length;
}

type ItemWithClaims = {
  name: string;
  claimed: { id: number; claimedBy: string; createdAt: Date }[];
};

export type LatestClaim = {
  itemName: string;
  claimedBy: string;
  createdAt: Date;
};

/**
 * The most recent claim across the whole registry, or undefined if nobody has
 * claimed anything.
 *
 * getRegistryItems orders claims oldest-first *within* each item, so flattening
 * across items throws that order away — hence the sort. createdAt ties are
 * possible, so break on id.
 */
export function getLatestClaim (items: ItemWithClaims[]): LatestClaim | undefined {
  return items
    .flatMap((item) => item.claimed.map((claim) => ({ item, claim })))
    .sort((a, b) =>
      b.claim.createdAt.getTime() - a.claim.createdAt.getTime() || b.claim.id - a.claim.id
    )
    .map(({ item, claim }) => ({
      itemName: item.name,
      claimedBy: claim.claimedBy,
      createdAt: claim.createdAt,
    }))[0];
}
