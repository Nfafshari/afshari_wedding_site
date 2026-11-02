import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

// The action's collaborators: a signed-in user, a Prisma update we control, no cache or storage.
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { document: { update: (...args: unknown[]) => update(...args) } } }));
vi.mock("@/lib/require-user", () => ({ requireUserAction: async () => ({ ok: true }) }));
vi.mock("@/lib/supabase", () => ({ supabase: {}, DOCUMENTS_BUCKET: "documents" }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { updateDocument } = await import("./action");

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "test" });
}

beforeEach(() => {
  update.mockReset().mockResolvedValue({});
});

describe("updateDocument", () => {
  it("saves the trimmed name and company with the icon", async () => {
    expect(await updateDocument(4, { name: " Venue contract ", companyName: " The Barn ", icon: "Receipt" })).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ where: { id: 4 }, data: { name: "Venue contract", companyName: "The Barn", icon: "Receipt" } });
  });

  it("refuses a blank name or company before writing", async () => {
    expect(await updateDocument(4, { name: " ", companyName: "The Barn", icon: "Receipt" })).toEqual({
      ok: false, error: "Document name cannot be empty.", field: "name",
    });
    expect(await updateDocument(4, { name: "Venue contract", companyName: " ", icon: "Receipt" })).toEqual({
      ok: false, error: "Company name cannot be empty.", field: "companyName",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("says so when the name is taken or the document was deleted meanwhile", async () => {
    update.mockRejectedValueOnce(prismaError("P2002"));
    expect(await updateDocument(4, { name: "Venue contract", companyName: "The Barn", icon: "Receipt" })).toEqual({
      ok: false, error: "A document with that name already exists.", field: "name",
    });

    update.mockRejectedValueOnce(prismaError("P2025"));
    expect(await updateDocument(4, { name: "Venue contract", companyName: "The Barn", icon: "Receipt" })).toEqual({
      ok: false, error: "That document no longer exists, refresh your page and try again.", field: "name",
    });
  });
});
