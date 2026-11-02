import { describe, expect, it } from "vitest";

import { MAX_SHORT_TEXT, NAME_NOT_FOUND, toLookupKey } from "./rsvp";

describe("toLookupKey", () => {
  it("normalizes a full name into the key guests are stored under", () => {
    expect(toLookupKey("  José  O'Neil ")).toEqual({ ok: true, key: "jose oneil" });
  });

  it("asks for a last name when only one name is given", () => {
    expect(toLookupKey("Grace")).toEqual({ ok: false, error: "Please enter your first and last name.", field: "name" });
  });

  it("treats an over-long name as not found, revealing nothing", () => {
    expect(toLookupKey("a ".repeat(MAX_SHORT_TEXT))).toEqual({ ok: false, error: NAME_NOT_FOUND, field: "name" });
  });
});
