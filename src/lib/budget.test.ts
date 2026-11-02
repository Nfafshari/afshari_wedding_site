import { describe, expect, it } from "vitest";

import { getCategoryStatus } from "@/lib/budget";

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
