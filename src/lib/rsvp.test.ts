import { describe, expect, it } from "vitest";

import { MAX_SHORT_TEXT, NAME_NOT_FOUND, formatRsvpDeadline, isRsvpOpen, toLookupKey } from "./rsvp";

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

describe("RSVP deadline", () => {
  it("stays open until the last minute of August 1 in Central time", () => {
    expect(isRsvpOpen(new Date("2027-08-01T23:59:00-05:00"))).toBe(true);
    expect(isRsvpOpen(new Date("2027-08-02T00:00:30-05:00"))).toBe(false);
  });

  it("reads as the day guests see on the site", () => {
    expect(formatRsvpDeadline()).toBe("August 1, 2027");
  });
});
