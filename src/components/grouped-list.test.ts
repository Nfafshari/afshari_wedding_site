import { describe, expect, it } from "vitest";

import { gridTemplate } from "@/components/grouped-list";

describe("gridTemplate", () => {
  it("wraps the page's columns in the chevron and actions columns", () => {
    expect(gridTemplate("minmax(0,1fr) 8rem 8rem")).toBe("2rem minmax(0,1fr) 8rem 8rem 4.5rem");
  });

  it("keeps a single name column", () => {
    expect(gridTemplate("minmax(0,1fr)")).toBe("2rem minmax(0,1fr) 4.5rem");
  });
});
