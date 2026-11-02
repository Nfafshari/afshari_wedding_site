import { describe, expect, it } from "vitest";

import { hasPage } from "./public-nav";

describe("hasPage", () => {
  it("is true for a listed page, with or without an anchor", () => {
    expect(hasPage("/rsvp")).toBe(true);
    expect(hasPage("/rsvp#form")).toBe(true);
  });

  it("is false for a page that isn't listed yet", () => {
    expect(hasPage("/faq")).toBe(false);
    expect(hasPage("/details#venue")).toBe(false);
  });
});
