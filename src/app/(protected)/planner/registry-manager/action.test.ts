import { beforeEach, describe, expect, it, vi } from "vitest";

// The action's collaborators: a signed-in user, an item and a claim insert we control, no cache.
const findItem = vi.fn();
const createClaim = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    registryItem: { findUnique: (...args: unknown[]) => findItem(...args) },
    registryClaim: { create: (...args: unknown[]) => createClaim(...args) },
  },
}));
vi.mock("@/lib/require-user", () => ({ requireUserAction: async () => ({ ok: true }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { createRegistryClaim } = await import("./action");

beforeEach(() => {
  findItem.mockReset().mockResolvedValue({ quantityWanted: 2, claimed: [] });
  createClaim.mockReset().mockResolvedValue({});
});

describe("createRegistryClaim", () => {
  it("records a claim the couple adds as added by hand", async () => {
    expect(await createRegistryClaim(5, "  Aunt May ", 1)).toEqual({ ok: true });
    expect(createClaim).toHaveBeenCalledWith({ data: { itemId: 5, claimedBy: "Aunt May", quantity: 1, source: "BY_HAND" } });
  });
});
