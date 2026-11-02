import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

// The action's collaborators: a signed-in user, a Prisma update we control, no cache.
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { budgetSubcategory: { update: (...args: unknown[]) => update(...args) } } }));
vi.mock("@/lib/require-user", () => ({ requireUserAction: async () => ({ ok: true }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { updateBudgetSubcategory } = await import("./action");

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "test" });
}

beforeEach(() => {
  update.mockReset();
});

describe("updateBudgetSubcategory: moving a line item", () => {
  it("writes the new category", async () => {
    update.mockResolvedValue({});

    expect(await updateBudgetSubcategory(7, { budgetCategoryId: 3 })).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ where: { id: 7 }, data: expect.objectContaining({ budgetCategoryId: 3 }) });
  });

  it("refuses a name the new category already has", async () => {
    update.mockRejectedValue(prismaError("P2002"));

    expect(await updateBudgetSubcategory(7, { budgetCategoryId: 3 })).toEqual({
      ok: false, error: "A line item with that name already exists in this category.", field: "name",
    });
  });

  it("says so when the new category was deleted meanwhile", async () => {
    update.mockRejectedValue(prismaError("P2003"));

    expect(await updateBudgetSubcategory(7, { budgetCategoryId: 3 })).toEqual({
      ok: false, error: "That category no longer exists, refresh your page and try again.", field: "budgetCategory",
    });
  });
});
