/** An sRGB color as [red, green, blue], each 0-255. */
export type Rgb = readonly [number, number, number];

/** What the color is used for. WCAG 2.2 AA asks 4.5 for text, 3 for large text, 3 for UI parts. */
export type ContrastKind = "text" | "large-text" | "ui";

const MIN_RATIO: Record<ContrastKind, number> = {
  "text": 4.5,
  "large-text": 3,
  "ui": 3,
};

// Linearize one 0-255 sRGB channel (WCAG 2.x relative luminance definition).
function linear(channel: number) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio between two colors, 1 (identical) to 21 (black on white). Order does not matter. */
export function contrastRatio(a: Rgb, b: Rgb) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when the ratio meets WCAG AA for the given use. */
export function meetsAA(ratio: number, kind: ContrastKind) {
  return ratio >= MIN_RATIO[kind];
}
