import { describe, expect, it } from "vitest";

import { checkClaimQuantity } from "./registry";

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
