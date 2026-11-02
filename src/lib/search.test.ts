import { describe, expect, it } from "vitest";

import { matchesSearch } from "@/lib/search";

describe("matchesSearch", () => {
  it("matches everything when the query is empty or only spaces", () => {
    expect(matchesSearch("", "Venue contract")).toBe(true);
    expect(matchesSearch("   ", "Venue contract")).toBe(true);
  });

  it("ignores case and surrounding spaces", () => {
    expect(matchesSearch("  VENUE ", "Venue contract")).toBe(true);
  });

  it("ignores accents on either side", () => {
    expect(matchesSearch("zoe", "Zoë Okafor")).toBe(true);
    expect(matchesSearch("Zoë", "Zoe Okafor")).toBe(true);
  });

  it("matches any field and skips missing ones", () => {
    expect(matchesSearch("big horn", "Venue contract", null, "Big Horn Equestrian Center")).toBe(true);
    expect(matchesSearch("caterer", "Venue contract", undefined)).toBe(false);
  });
});
