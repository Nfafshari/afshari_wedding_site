import { describe, expect, it } from "vitest";

import { hasPage } from "./public-nav";

describe("hasPage", () => {
  it("is true for a listed page, with or without an anchor", () => {
    expect(hasPage("/rsvp")).toBe(true);
    expect(hasPage("/details#venue")).toBe(true);
  });

  it("is false for a page that isn't listed yet", () => {
    expect(hasPage("/wedding-party")).toBe(false);
    expect(hasPage("/gallery#top")).toBe(false);
  });
});
