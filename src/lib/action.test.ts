import { afterEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { GENERIC_ERROR, handleActionError, validateHttpUrl, validateWholeNumber } from "./action";

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "test" });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validateWholeNumber", () => {
  it("accepts 1 up to the max", () => {
    expect(validateWholeNumber(1, "quantity", "Quantity", 9999)).toBeNull();
    expect(validateWholeNumber(9999, "quantity", "Quantity", 9999)).toBeNull();
  });

  it("refuses zero, negatives, fractions and NaN", () => {
    for (const value of [0, -1, 1.5, Number.NaN]) {
      expect(validateWholeNumber(value, "quantity", "Quantity", 9999)).toEqual({
        ok: false, error: "Quantity must be a whole number of 1 or more.", field: "quantity",
      });
    }
  });

  it("refuses anything over the max", () => {
    expect(validateWholeNumber(10000, "quantity", "Quantity", 9999)).toEqual({
      ok: false, error: "Quantity must be 9999 or less.", field: "quantity",
    });
  });
});

describe("validateHttpUrl", () => {
  it("accepts http and https", () => {
    expect(validateHttpUrl("https://example.com/gift", "link", "Product link")).toBeNull();
    expect(validateHttpUrl("http://example.com", "link", "Product link")).toBeNull();
  });

  it("refuses script URLs and junk", () => {
    for (const value of ["javascript:alert(1)", "not a link", ""]) {
      expect(validateHttpUrl(value, "image", "Image link")).toEqual({
        ok: false, error: "Image link must be a valid link starting with http:// or https://.", field: "image",
      });
    }
  });
});

describe("handleActionError", () => {
  const known = {
    P2002: { error: "An item with that name already exists.", field: "name" as const },
    P2025: { error: "That item no longer exists." },
  };

  it("maps a listed Prisma code to its message, without logging", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(handleActionError(prismaError("P2002"), "creating item", known)).toEqual({
      ok: false, error: "An item with that name already exists.", field: "name",
    });
    expect(handleActionError(prismaError("P2025"), "creating item", known)).toEqual({
      ok: false, error: "That item no longer exists.",
    });
    expect(log).not.toHaveBeenCalled();
  });

  it("logs and returns the generic message for a known code this call didn't list", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(handleActionError(prismaError("P2003"), "creating item", known)).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("*ERROR - error creating item, see below:\n"));
  });

  it("logs and returns the generic message for anything that isn't a Prisma error", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(handleActionError(new Error("network"), "deleting claim", {})).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(log).toHaveBeenCalledWith("*ERROR - error deleting claim, see below:\nError: network");
  });
});
