import { formatHex } from "culori";
import { luminance, oklchToHex, toOklch } from "./color";
import { nudge, wcagRatio } from "./contrast";

export interface Pair {
  bg: string;
  fg: string;
}

interface Swatch {
  hex: string;
  share: number;
  l: number;
  c: number;
}

const SAMPLE_SIZE = 64;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

/** Groups the image's pixels into coarse color buckets, largest first. */
async function extractSwatches(url: string): Promise<Swatch[]> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  // 4 bits per channel: 4096 buckets, each tracking a running sum.
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += data[i];
    bucket.g += data[i + 1];
    bucket.b += data[i + 2];
    bucket.n += 1;
    buckets.set(key, bucket);
  }

  const total = SAMPLE_SIZE * SAMPLE_SIZE;
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 24)
    .map(({ r, g, b, n }) => {
      const hex = formatHex({ mode: "rgb", r: r / n / 255, g: g / n / 255, b: b / n / 255 });
      const { l, c } = toOklch(hex);
      return { hex, share: n / total, l, c };
    });
}

/**
 * Picks a background/foreground pair from a photo: a dominant color for the
 * background, and the most vivid well-contrasting color for the text. If the
 * photo has no pair that reaches AA, the text color is nudged until it does.
 */
export async function pairFromImage(url: string): Promise<Pair> {
  const swatches = await extractSwatches(url);
  let best: Pair = { bg: swatches[0].hex, fg: swatches[1]?.hex ?? swatches[0].hex };
  let bestScore = -Infinity;

  for (const bg of swatches.slice(0, 6)) {
    for (const fg of swatches) {
      if (fg === bg) continue;
      const ratio = wcagRatio(bg.hex, fg.hex);
      const value =
        Math.log(bg.share * 100) + Math.min(ratio, 7) / 2 + fg.c * 8 + Math.log(fg.share * 100) / 4;
      if (value > bestScore) {
        bestScore = value;
        best = { bg: bg.hex, fg: fg.hex };
      }
    }
  }

  return ensureReadable(best);
}

/** A random readable pair: a light or dark background with a contrasting hue for the text. */
export function randomPair(): Pair {
  const hue = Math.random() * 360;
  const dark = Math.random() < 0.5;
  const bg = oklchToHex(
    dark ? 0.15 + Math.random() * 0.25 : 0.78 + Math.random() * 0.18,
    Math.random() * 0.14,
    hue,
  );
  const fg = oklchToHex(dark ? 0.88 : 0.28, 0.03 + Math.random() * 0.16, (hue + 90 + Math.random() * 180) % 360);
  return ensureReadable({ bg, fg });
}

/** Arranges a pair so the darker color is the background, or the lighter one when `lightBg`. */
export function orient(pair: Pair, lightBg: boolean): Pair {
  const bgIsLighter = luminance(pair.bg) > luminance(pair.fg);
  return bgIsLighter === lightBg ? pair : { bg: pair.fg, fg: pair.bg };
}

/** Raises contrast to at least 4.5:1 by moving the text color's lightness. */
export function ensureReadable(pair: Pair): Pair {
  let { fg } = pair;
  for (let i = 0; i < 3 && wcagRatio(pair.bg, fg) < 4.5; i++) {
    const next = nudge(pair.bg, fg, "WCAG", "fg", "up");
    if (!next) break;
    fg = next;
  }
  return { bg: pair.bg, fg };
}
