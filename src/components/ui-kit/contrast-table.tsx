"use client";

import { useEffect, useState } from "react";
import { Check, Info, X } from "lucide-react";

import { contrastRatio, meetsAA, type ContrastKind, type Rgb } from "@/lib/contrast";

export interface ContrastPair {
  label: string;
  /** Custom property names, for example "--foreground". */
  foreground: string;
  background: string;
  kind: ContrastKind;
  /** Set when a failing pairing is deliberate. Shown instead of "Fail", with this reason. */
  exception?: string;
}

const NEEDED: Record<ContrastKind, string> = { "text": "4.5", "large-text": "3", "ui": "3" };

// Reads a token's real color. The canvas parses any CSS color the browser supports (oklch
// included), so the ratio is computed from what is actually painted, not from a copy.
function readRgb(cssVar: string, ctx: CanvasRenderingContext2D): Rgb | null {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (!value) return null;
  ctx.fillStyle = "#000"; // reset, so a value the canvas can't parse doesn't reuse the last color
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function measure(pairs: ContrastPair[]): (number | null)[] {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return pairs.map(() => null);
  return pairs.map((pair) => {
    const fg = readRgb(pair.foreground, ctx);
    const bg = readRgb(pair.background, ctx);
    return fg && bg ? contrastRatio(fg, bg) : null;
  });
}

function Result({ pair, ratio }: { pair: ContrastPair; ratio: number | null }) {
  if (ratio === null) return <span className="text-burg/70">…</span>;
  if (meetsAA(ratio, pair.kind)) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-success">
        <Check className="size-4" aria-hidden /> Pass
      </span>
    );
  }
  if (pair.exception) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-burg/70">
        <Info className="size-4" aria-hidden /> Exception
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-bold text-destructive">
      <X className="size-4" aria-hidden /> Fail
    </span>
  );
}

/**
 * WCAG AA contrast for each listed pairing, measured in the browser from the live CSS.
 * Colors are never the only signal: every result also has an icon and a word.
 */
export default function ContrastTable({ pairs }: { pairs: ContrastPair[] }) {
  const [ratios, setRatios] = useState<(number | null)[]>(() => pairs.map(() => null));

  useEffect(() => {
    // The ratios come from the browser's painted colors, which don't exist during server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRatios(measure(pairs));
  }, [pairs]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-xl text-left text-sm">
        <caption className="sr-only">Contrast ratio of each text, icon and border color pairing</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 font-bold">Pairing</th>
            <th scope="col" className="py-2 pr-4 font-bold">Sample</th>
            <th scope="col" className="py-2 pr-4 text-right font-bold">Ratio</th>
            <th scope="col" className="py-2 pr-4 text-right font-bold">Needs</th>
            <th scope="col" className="py-2 font-bold">Result</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair, index) => (
            <tr key={pair.label} className="border-b align-top">
              <th scope="row" className="py-2 pr-4 font-normal">
                {pair.label}
                {pair.exception && <span className="block text-xs text-burg/70">{pair.exception}</span>}
              </th>
              <td className="py-2 pr-4">
                <span
                  className="inline-block rounded-sm px-2 py-0.5 font-bold"
                  style={{ color: `var(${pair.foreground})`, backgroundColor: `var(${pair.background})` }}
                >
                  Aa
                </span>
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {ratios[index] === null ? "…" : `${ratios[index]!.toFixed(2)}:1`}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">{NEEDED[pair.kind]}:1</td>
              <td className="py-2">
                <Result pair={pair} ratio={ratios[index]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
