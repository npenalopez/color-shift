import { APCAcontrast, sRGBtoY } from "apca-w3";
import { wcagContrast } from "culori";
import { oklchToHex, toOklch, toRgb } from "./color";

export type Algo = "WCAG" | "APCA";

function rgb255(hex: string): [number, number, number] {
  const c = toRgb(hex);
  return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)];
}

export function wcagRatio(bg: string, fg: string): number {
  return wcagContrast(bg, fg);
}

/** Signed APCA lightness contrast: positive for dark text on light, negative for light on dark. */
export function apcaLc(bg: string, fg: string): number {
  return Number(APCAcontrast(sRGBtoY(rgb255(fg)), sRGBtoY(rgb255(bg))));
}

/** Contrast as a positive number for either algorithm. */
export function score(bg: string, fg: string, algo: Algo): number {
  return algo === "WCAG" ? wcagRatio(bg, fg) : Math.abs(apcaLc(bg, fg));
}

/** Rounded down, so a score never reads as passing a threshold it misses. */
export function formatScore(value: number, algo: Algo): string {
  return algo === "WCAG"
    ? `${(Math.floor(value * 100) / 100).toFixed(2)}:1`
    : `Lc ${Math.floor(value)}`;
}

export interface Level {
  min: number;
  label: string;
  description: string;
}

// Ordered high to low.
export const LEVELS: Record<Algo, Level[]> = {
  WCAG: [
    { min: 7, label: "AAA", description: "Passes for all text sizes" },
    { min: 4.5, label: "AA", description: "Passes for body text" },
    { min: 3, label: "AA Large", description: "Large text and UI elements only" },
  ],
  APCA: [
    { min: 90, label: "Lc 90", description: "Preferred for body text" },
    { min: 75, label: "Lc 75", description: "Minimum for body text" },
    { min: 60, label: "Lc 60", description: "Content text, not body copy" },
    { min: 45, label: "Lc 45", description: "Large text and headlines" },
    { min: 30, label: "Lc 30", description: "Spot text and placeholders" },
    { min: 15, label: "Lc 15", description: "Non-text elements only" },
  ],
};

const FAIL: Level = { min: 0, label: "Fail", description: "Too little contrast to read" };

export function level(value: number, algo: Algo): Level {
  return LEVELS[algo].find((l) => value >= l.min) ?? FAIL;
}

// Below this distance, a score counts as sitting on the threshold.
const TOLERANCE: Record<Algo, number> = { WCAG: 0.01, APCA: 0.5 };

export function nextThreshold(value: number, algo: Algo, direction: "up" | "down"): number | null {
  const mins = LEVELS[algo].map((l) => l.min).sort((a, b) => a - b);
  if (direction === "up") return mins.find((m) => m > value) ?? null;
  return [...mins].reverse().find((m) => m < value - TOLERANCE[algo]) ?? null;
}

/**
 * Moves one color's OKLCH lightness (keeping its hue and chroma) the smallest
 * distance that lands contrast on the next threshold up or down. Returns the
 * new hex for that color, or null when no threshold is reachable.
 */
export function nudge(
  bg: string,
  fg: string,
  algo: Algo,
  moving: "bg" | "fg",
  direction: "up" | "down",
): string | null {
  let value = score(bg, fg, algo);
  const start = moving === "bg" ? bg : fg;
  // A color can sit so close to a threshold that no hex step lies between
  // them; then the nudge would be a no-op, so aim for the next one instead.
  for (let target = nextThreshold(value, algo, direction); target !== null; ) {
    const hex = nudgeTo(bg, fg, algo, moving, direction, target);
    if (hex === null || hex !== start) return hex;
    value = target + (direction === "up" ? 0 : -TOLERANCE[algo]);
    target = nextThreshold(value, algo, direction);
  }
  return null;
}

function nudgeTo(
  bg: string,
  fg: string,
  algo: Algo,
  moving: "bg" | "fg",
  direction: "up" | "down",
  target: number,
): string | null {
  const start = moving === "bg" ? bg : fg;
  const other = moving === "bg" ? fg : bg;
  const { l, c, h } = toOklch(start);
  const otherL = toOklch(other).l;
  const hexAt = (lightness: number) => oklchToHex(lightness, c, h);
  const passes = (lightness: number) => {
    const hex = hexAt(lightness);
    return score(moving === "bg" ? hex : bg, moving === "fg" ? hex : fg, algo) >= target;
  };

  // Contrast rises as lightness moves away from the other color, so each side
  // of it is a monotonic range we can binary search.
  const search = (pass: number, fail: number) => {
    for (let i = 0; i < 32; i++) {
      const mid = (pass + fail) / 2;
      if (passes(mid)) pass = mid;
      else fail = mid;
    }
    return hexAt(pass);
  };

  const lighter = l >= otherL;
  if (direction === "down") return search(l, otherL);

  const far = lighter ? 1 : 0;
  if (passes(far)) return search(far, l);
  // Not reachable on this side; cross over to the other side of the color.
  const opposite = lighter ? 0 : 1;
  if (passes(opposite)) return search(opposite, otherL);
  return null;
}
