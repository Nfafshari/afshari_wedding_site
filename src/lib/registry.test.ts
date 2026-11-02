import { describe, expect, it } from "vitest";

import { checkClaimQuantity, checkWantedNotBelowClaimed } from "./registry";

describe("checkClaimQuantity", () => {
  it("allows any whole number from 1 up to what's left", () => {
    expect(checkClaimQuantity(1, 4)).toBeNull();
    expect(checkClaimQuantity(4, 4)).toBeNull();
  });

  it("refuses when nothing is left", () => {
    expect(checkClaimQuantity(1, 0)).toBe("This gift has already been fully claimed.");
  });

  it("refuses zero, negatives and fractions", () => {
    for (const quantity of [0, -1, 1.5, Number.NaN]) {
      expect(checkClaimQuantity(quantity, 3)).toBe("Please choose how many you would like to claim.");
    }
  });

  it("says how many are left when asked for too many", () => {
    expect(checkClaimQuantity(3, 2)).toBe("Someone just claimed some, so only 2 are left.");
    expect(checkClaimQuantity(2, 1)).toBe("Someone just claimed some, so only 1 is left.");
  });
});

describe("checkWantedNotBelowClaimed", () => {
  it("allows asking for as many as are claimed, or more", () => {
    expect(checkWantedNotBelowClaimed(3, 3)).toBeNull();
    expect(checkWantedNotBelowClaimed(5, 3)).toBeNull();
  });

  it("refuses asking for fewer than are claimed", () => {
    expect(checkWantedNotBelowClaimed(2, 3)).toBe("3 of these are already claimed, so you cannot ask for fewer than 3.");
  });
});
