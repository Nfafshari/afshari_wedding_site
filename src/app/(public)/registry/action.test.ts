import { beforeEach, describe, expect, it, vi } from "vitest";

// The action's collaborators: a guest list and a transaction we control, no cache.
const findGuest = vi.fn();
const findItem = vi.fn();
const createClaim = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    guest: { findFirst: (...args: unknown[]) => findGuest(...args) },
    $transaction: (run: (tx: unknown) => unknown) => run({
      registryItem: { findUnique: (...args: unknown[]) => findItem(...args) },
      registryClaim: { create: (...args: unknown[]) => createClaim(...args) },
    }),
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { claimRegistryItem } = await import("./action");

beforeEach(() => {
  findGuest.mockReset().mockResolvedValue({ name: "Grace Okafor" });
  findItem.mockReset().mockResolvedValue({ quantityWanted: 2, claimed: [] });
  createClaim.mockReset().mockResolvedValue({});
});

describe("claimRegistryItem", () => {
  it("records a guest's claim as made on the website", async () => {
    expect(await claimRegistryItem("grace okafor", 5, 1)).toEqual({ ok: true, claimedBy: "Grace Okafor", quantity: 1 });
    expect(createClaim).toHaveBeenCalledWith({ data: { itemId: 5, claimedBy: "Grace Okafor", quantity: 1, source: "WEBSITE" } });
  });
});
