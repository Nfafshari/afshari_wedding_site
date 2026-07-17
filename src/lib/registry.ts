/**
 * Pure registry math, shared by the registry manager and the planner's dashboard card.
 *
 * Parameters are structural rather than the `RegistryItem` type exported from
 * `registry-manager/page.tsx`, for the same reason as lib/budget.ts: keeping `lib/`
 * from importing `app/`.
 */

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
 * across items throws that order away — hence the sort. createdAt ties are real
 * rather than theoretical here (the seed writes several in the same millisecond),
 * so break on id.
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
