import { describe, expect, it } from "vitest";
import { formatDate, parseHttpUrl } from "@/lib/utils";

describe("parseHttpUrl", () => {
  it("accepts http and https URLs and returns the normalized href", () => {
    expect(parseHttpUrl("https://example.com")).toBe("https://example.com/");
    expect(parseHttpUrl("http://example.com/a?b=1")).toBe("http://example.com/a?b=1");
  });

  it("trims surrounding whitespace", () => {
    expect(parseHttpUrl("  https://example.com/x  ")).toBe("https://example.com/x");
  });

  it("rejects non-http(s) protocols, including javascript: and data:", () => {
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(parseHttpUrl("ftp://example.com/file")).toBeNull();
  });

  it("rejects strings that are not URLs", () => {
    expect(parseHttpUrl("not a url")).toBeNull();
    expect(parseHttpUrl("")).toBeNull();
  });
});

describe("formatDate", () => {
  it("reads like \"Oct 3, 2026\"", () => {
    expect(formatDate(new Date("2026-10-03T17:00:00Z"))).toBe("Oct 3, 2026");
  });

  it("uses Central time, so an evening timestamp keeps its Central date", () => {
    // 9:30pm Central on Oct 3 is already Oct 4 in UTC, where the server renders.
    expect(formatDate(new Date("2026-10-04T02:30:00Z"))).toBe("Oct 3, 2026");
  });
});
