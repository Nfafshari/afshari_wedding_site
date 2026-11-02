import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

// The action's collaborators: a signed-in user, a Prisma update we control, no cache.
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { task: { update: (...args: unknown[]) => update(...args) } } }));
vi.mock("@/lib/require-user", () => ({ requireUserAction: async () => ({ ok: true }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { updateTask } = await import("./action");

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "test" });
}

const due = new Date("2027-03-01T12:00:00-06:00");

beforeEach(() => {
  update.mockReset().mockResolvedValue({});
});

describe("updateTask", () => {
  it("saves the trimmed name, due date and category, so a task can move", async () => {
    expect(await updateTask(7, { name: "  Book florist ", goalDate: due, categoryId: 3 })).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ where: { id: 7 }, data: { name: "Book florist", goalDate: due, categoryId: 3 } });
  });

  it("refuses a blank name or a missing date before writing", async () => {
    expect(await updateTask(7, { name: " ", goalDate: due, categoryId: 3 })).toEqual({ ok: false, error: "Task name cannot be empty.", field: "name" });
    expect(await updateTask(7, { name: "Book florist", goalDate: undefined, categoryId: 3 })).toEqual({ ok: false, error: "Please select a date.", field: "date" });
    expect(update).not.toHaveBeenCalled();
  });

  it("says so when the task or the new category was deleted meanwhile", async () => {
    update.mockRejectedValueOnce(prismaError("P2025"));
    expect(await updateTask(7, { name: "Book florist", goalDate: due, categoryId: 3 })).toEqual({
      ok: false, error: "That task no longer exists, refresh your page and try again.", field: "name",
    });

    update.mockRejectedValueOnce(prismaError("P2003"));
    expect(await updateTask(7, { name: "Book florist", goalDate: due, categoryId: 3 })).toEqual({
      ok: false, error: "That category no longer exists, refresh your page and try again.", field: "category",
    });
  });
});
