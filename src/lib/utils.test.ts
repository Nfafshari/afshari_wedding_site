import { describe, expect, it } from "vitest";
import { parseHttpUrl } from "@/lib/utils";

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
