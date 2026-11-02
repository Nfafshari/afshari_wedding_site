import { describe, expect, it } from "vitest";

import { BUDGET_STATUS, registryItemStatus } from "@/lib/status";

describe("registryItemStatus", () => {
  it("is open when nothing is claimed", () => {
    expect(registryItemStatus(0, 4)).toEqual({ label: "Open", tone: "neutral" });
  });

  it("counts what is left when partly claimed", () => {
    expect(registryItemStatus(1, 4)).toEqual({ label: "3 left", tone: "warning" });
  });

  it("is fully claimed at the quantity wanted, and past it", () => {
    expect(registryItemStatus(4, 4)).toEqual({ label: "Fully claimed", tone: "success" });
    expect(registryItemStatus(5, 4)).toEqual({ label: "Fully claimed", tone: "success" });
  });
});

describe("BUDGET_STATUS", () => {
  it("keeps a due line neutral rather than red", () => {
    expect(BUDGET_STATUS.DUE.tone).toBe("neutral");
  });
});
