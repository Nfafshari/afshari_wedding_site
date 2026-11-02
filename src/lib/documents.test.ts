import { describe, expect, it } from "vitest";

import { fileTypeLabel, filterAndSortDocs, isDocSort } from "./documents";

describe("fileTypeLabel", () => {
  it("reads the type from the stored file name", () => {
    expect(fileTypeLabel("3f2a-uuid.pdf")).toBe("PDF");
    expect(fileTypeLabel("3f2a-uuid.png")).toBe("PNG");
  });

  it("calls both JPEG spellings JPG, in any case", () => {
    expect(fileTypeLabel("a.jpg")).toBe("JPG");
    expect(fileTypeLabel("a.JPEG")).toBe("JPG");
  });

  it("falls back to File for anything else", () => {
    expect(fileTypeLabel("notes")).toBe("File");
    expect(fileTypeLabel("archive.zip")).toBe("File");
  });
});

describe("filterAndSortDocs", () => {
  const doc = (name: string, companyName: string, createdAt: string) => ({ name, companyName, createdAt: new Date(createdAt) });
  const venue = doc("Venue contract", "Big Horn Equestrian", "2026-03-01");
  const florist = doc("Deposit receipt", "Petal & Stem", "2026-05-10");
  const caterer = doc("Menu", "Zoë's Kitchen", "2026-04-02");
  const docs = [venue, florist, caterer];

  it("shows the newest first by default", () => {
    expect(filterAndSortDocs(docs, "", "newest")).toEqual([florist, caterer, venue]);
  });

  it("sorts by name A to Z", () => {
    expect(filterAndSortDocs(docs, "", "az")).toEqual([florist, caterer, venue]);
  });

  it("searches the name or the company, ignoring case and accents", () => {
    expect(filterAndSortDocs(docs, "contract", "newest")).toEqual([venue]);
    expect(filterAndSortDocs(docs, "zoe", "newest")).toEqual([caterer]);
  });

  it("applies the search and the sort together", () => {
    const second = doc("Contract addendum", "Big Horn Equestrian", "2026-06-01");
    expect(filterAndSortDocs([...docs, second], "big horn", "az")).toEqual([second, venue]);
    expect(filterAndSortDocs([...docs, second], "big horn", "newest")).toEqual([second, venue]);
  });

  it("does not reorder the array it was given", () => {
    const original = [...docs];
    filterAndSortDocs(docs, "", "az");
    expect(docs).toEqual(original);
  });

  it("accepts only known sorts from the URL", () => {
    expect(isDocSort("az")).toBe(true);
    expect(isDocSort("oldest")).toBe(false);
    expect(isDocSort(null)).toBe(false);
  });
});
