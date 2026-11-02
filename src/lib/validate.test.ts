import { describe, expect, it } from "vitest";

import { checkDate, checkHttpUrl, checkMoney, checkRequired, checkUniqueName, checkWholeNumber, parseWholeNumber } from "@/lib/validate";

describe("checkRequired", () => {
  it("refuses empty and blank values", () => {
    expect(checkRequired("", "Item name")).toBe("Item name cannot be empty.");
    expect(checkRequired("   ", "Item name")).toBe("Item name cannot be empty.");
  });

  it("enforces the length limit on the trimmed value", () => {
    expect(checkRequired("abcdef", "Party name", 5)).toBe("Party name must be 5 characters or less.");
    expect(checkRequired("  abcde  ", "Party name", 5)).toBeNull();
  });
});

describe("checkUniqueName", () => {
  it("refuses a taken name, ignoring case and spaces", () => {
    expect(checkUniqueName("  stand MIXER ", ["Stand mixer"], "item")).toBe("An item with that name already exists.");
    expect(checkUniqueName("Venue", ["venue"], "category")).toBe("A category with that name already exists.");
  });

  it("can say where the name is taken", () => {
    expect(checkUniqueName("Bar", ["Bar"], "subcategory", "in this category"))
      .toBe("A subcategory with that name already exists in this category.");
  });

  it("accepts a new name", () => {
    expect(checkUniqueName("Towels", ["Stand mixer"], "item")).toBeNull();
  });
});

describe("checkWholeNumber", () => {
  it("accepts 1 up to the max", () => {
    expect(checkWholeNumber(1, "Quantity", 9999)).toBeNull();
    expect(checkWholeNumber(9999, "Quantity", 9999)).toBeNull();
  });

  it("refuses zero, negatives, fractions and NaN", () => {
    for (const value of [0, -1, 1.5, Number.NaN]) {
      expect(checkWholeNumber(value, "Quantity", 9999)).toBe("Quantity must be a whole number of 1 or more.");
    }
  });

  it("refuses anything over the max", () => {
    expect(checkWholeNumber(10000, "Quantity", 9999)).toBe("Quantity must be 9999 or less.");
  });

  it("can allow zero, for counts that may be none", () => {
    expect(checkWholeNumber(0, "Plus-ones", 10, 0)).toBeNull();
    expect(checkWholeNumber(-1, "Plus-ones", 10, 0)).toBe("Plus-ones must be a whole number of 0 or more.");
  });
});

describe("checkMoney", () => {
  it("accepts zero up to just under the limit", () => {
    expect(checkMoney(0, "Amount paid")).toBeNull();
    expect(checkMoney(99_999_999.99, "Amount paid")).toBeNull();
  });

  it("refuses negatives and NaN", () => {
    expect(checkMoney(-1, "Amount paid")).toBe("Amount paid must be a number of 0 or more.");
    expect(checkMoney(Number.NaN, "Amount paid")).toBe("Amount paid must be a number of 0 or more.");
  });

  it("refuses the limit and above", () => {
    expect(checkMoney(100_000_000, "Estimated cost")).toBe("Estimated cost must be less than $100,000,000.");
  });
});

describe("checkHttpUrl", () => {
  it("accepts http and https", () => {
    expect(checkHttpUrl("https://example.com/gift", "Product link")).toBeNull();
    expect(checkHttpUrl(" http://example.com ", "Product link")).toBeNull();
  });

  it("refuses script URLs, junk and empty", () => {
    for (const value of ["javascript:alert(1)", "not a link", ""]) {
      expect(checkHttpUrl(value, "Image link")).toBe("Image link must be a valid link starting with http:// or https://.");
    }
  });
});

describe("checkDate", () => {
  it("refuses missing and invalid dates", () => {
    for (const value of [null, undefined, "", "not a date", new Date(Number.NaN)]) {
      expect(checkDate(value)).toBe("Please select a date.");
    }
  });

  it("accepts a real date or date string", () => {
    expect(checkDate(new Date(2027, 8, 11))).toBeNull();
    expect(checkDate("2027-09-11")).toBeNull();
  });
});

describe("parseWholeNumber", () => {
  it("reads digits, allowing commas and spaces", () => {
    expect(parseWholeNumber(" 1,200 ")).toBe(1200);
  });

  it("is NaN for anything else, so checkWholeNumber refuses it", () => {
    for (const value of ["", "1.5", "-2", "two", "1e3"]) {
      expect(parseWholeNumber(value)).toBeNaN();
    }
  });
});
