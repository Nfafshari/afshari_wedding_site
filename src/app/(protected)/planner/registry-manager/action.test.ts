import { beforeEach, describe, expect, it, vi } from "vitest";

// The action's collaborators: a signed-in user, an item and a claim insert we control, no cache.
const findItem = vi.fn();
const createClaim = vi.fn();
const createItem = vi.fn();
const updateItem = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    registryItem: {
      findUnique: (...args: unknown[]) => findItem(...args),
      create: (...args: unknown[]) => createItem(...args),
      update: (...args: unknown[]) => updateItem(...args),
    },
    registryClaim: { create: (...args: unknown[]) => createClaim(...args) },
  },
}));
vi.mock("@/lib/require-user", () => ({ requireUserAction: async () => ({ ok: true }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { createRegistryClaim, createRegistryItem, updateRegistryItem } = await import("./action");

beforeEach(() => {
  findItem.mockReset().mockResolvedValue({ quantityWanted: 2, claimed: [] });
  createClaim.mockReset().mockResolvedValue({});
  createItem.mockReset().mockResolvedValue({});
  updateItem.mockReset().mockResolvedValue({});
});

describe("createRegistryItem", () => {
  it("saves the price with the item", async () => {
    expect(await createRegistryItem("Stand Mixer", "https://example.com/mixer", 1, 349.99, "")).toEqual({ ok: true });
    expect(createItem).toHaveBeenCalledWith({
      data: { name: "Stand Mixer", link: "https://example.com/mixer", quantityWanted: 1, price: 349.99, image: undefined },
    });
  });

  it("refuses a price that isn't a number of 0 or more", async () => {
    expect(await createRegistryItem("Stand Mixer", "https://example.com/mixer", 1, Number.NaN, "")).toEqual({
      ok: false, error: "Price must be a number of 0 or more.", field: "price",
    });
    expect(await createRegistryItem("Stand Mixer", "https://example.com/mixer", 1, -5, "")).toMatchObject({ ok: false, field: "price" });
    expect(createItem).not.toHaveBeenCalled();
  });
});

describe("updateRegistryItem", () => {
  it("refuses a bad price without writing", async () => {
    expect(await updateRegistryItem(5, { price: -1 })).toMatchObject({ ok: false, field: "price" });
    expect(updateItem).not.toHaveBeenCalled();
  });

  it("saves a new price", async () => {
    expect(await updateRegistryItem(5, { price: 20 })).toEqual({ ok: true });
    expect(updateItem).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 5 }, data: expect.objectContaining({ price: 20 }) }));
  });
});

describe("createRegistryClaim", () => {
  it("records a claim the couple adds as added by hand", async () => {
    expect(await createRegistryClaim(5, "  Aunt May ", 1)).toEqual({ ok: true });
    expect(createClaim).toHaveBeenCalledWith({ data: { itemId: 5, claimedBy: "Aunt May", quantity: 1, source: "BY_HAND" } });
  });
});
