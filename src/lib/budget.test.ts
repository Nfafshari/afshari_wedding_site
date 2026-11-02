import { describe, expect, it } from "vitest";

import { budgetLimitState, getCategoryStatus, limitBarScale } from "@/lib/budget";

describe("getCategoryStatus", () => {
  it("is due when empty or nothing is paid", () => {
    expect(getCategoryStatus([])).toBe("DUE");
    expect(getCategoryStatus([{ status: "DUE", paidAmount: 0 }, { status: "DUE", paidAmount: 0 }])).toBe("DUE");
  });

  it("is deposit paid once anything is paid", () => {
    expect(getCategoryStatus([{ status: "DEPOSIT", paidAmount: 500 }, { status: "DUE", paidAmount: 0 }])).toBe("DEPOSIT");
    expect(getCategoryStatus([{ status: "PAID", paidAmount: 200 }, { status: "DUE", paidAmount: 0 }])).toBe("DEPOSIT");
    expect(getCategoryStatus([{ status: "DUE", paidAmount: 50 }])).toBe("DEPOSIT");
  });

  it("is paid once every line item is paid", () => {
    expect(getCategoryStatus([{ status: "PAID", paidAmount: 200 }, { status: "PAID", paidAmount: 0 }])).toBe("PAID");
  });
});

describe("budgetLimitState", () => {
  const limits = { target: 15000, cap: 20000 };

  it("is under the target, with what's left", () => {
    expect(budgetLimitState(12000, limits)).toEqual({ state: "under", amount: 3000 });
  });

  it("counts landing exactly on a limit as not over it", () => {
    expect(budgetLimitState(15000, limits)).toEqual({ state: "under", amount: 0 });
    expect(budgetLimitState(20000, limits)).toEqual({ state: "over-target", amount: 5000 });
  });

  it("is over the target only, by how much", () => {
    expect(budgetLimitState(17500, limits)).toEqual({ state: "over-target", amount: 2500 });
  });

  it("is over the cap, by how much past the cap", () => {
    const result = budgetLimitState(20513.48, limits);
    expect(result.state).toBe("over-cap");
    expect(result.amount).toBeCloseTo(513.48, 2);
  });
});

describe("limitBarScale", () => {
  it("runs a little past the cap when under it, and past the estimate when over", () => {
    expect(limitBarScale(10000, 20000)).toBeCloseTo(21000);
    expect(limitBarScale(30000, 20000)).toBeCloseTo(31500);
  });
});
