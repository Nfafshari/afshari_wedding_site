import { describe, expect, it } from "vitest";
import { blend, contrastRatio, meetsAA } from "@/lib/contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colors", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([120, 80, 40], [120, 80, 40])).toBeCloseTo(1, 5);
  });

  it("does not depend on which color is the foreground", () => {
    const a = contrastRatio([68, 22, 31], [255, 251, 235]);
    const b = contrastRatio([255, 251, 235], [68, 22, 31]);
    expect(a).toBeCloseTo(b, 10);
  });

  it("matches the published WCAG value for #777777 on white (4.48)", () => {
    expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 2);
  });
});

describe("meetsAA", () => {
  it("needs 4.5 for body text", () => {
    expect(meetsAA(4.5, "text")).toBe(true);
    expect(meetsAA(4.49, "text")).toBe(false);
  });

  it("needs 3 for large text and for UI parts like input borders and focus rings", () => {
    expect(meetsAA(3, "large-text")).toBe(true);
    expect(meetsAA(2.99, "large-text")).toBe(false);
    expect(meetsAA(3, "ui")).toBe(true);
    expect(meetsAA(2.99, "ui")).toBe(false);
  });
});

describe("blend", () => {
  it("paints a color at partial opacity over a background, like the browser does", () => {
    expect(blend([0, 0, 0], [255, 255, 255], 0.5)).toEqual([128, 128, 128]);
    expect(blend([68, 22, 31], [255, 251, 235], 1)).toEqual([68, 22, 31]);
    expect(blend([68, 22, 31], [255, 251, 235], 0)).toEqual([255, 251, 235]);
  });

  it("lowers contrast: 70% black on white is lighter than solid black", () => {
    const solid = contrastRatio([0, 0, 0], [255, 255, 255]);
    const faded = contrastRatio(blend([0, 0, 0], [255, 255, 255], 0.7), [255, 255, 255]);
    expect(faded).toBeLessThan(solid);
    expect(faded).toBeCloseTo(8.4, 0);
  });
});
