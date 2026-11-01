import { clampChroma, converter, formatHex, parse, type Hsv, type Oklch, type Rgb } from "culori";

export type SliderMode = "OKLCH" | "HSB" | "RGB";

export interface Channel {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const deg = (v: number) => `${Math.round(v)}°`;
const int = (v: number) => `${Math.round(v)}`;

export const CHANNELS: Record<SliderMode, Channel[]> = {
  OKLCH: [
    { key: "l", label: "Lightness", min: 0, max: 1, step: 0.001, format: pct },
    { key: "c", label: "Chroma", min: 0, max: 0.37, step: 0.001, format: (v) => v.toFixed(3) },
    { key: "h", label: "Hue", min: 0, max: 360, step: 0.1, format: deg },
  ],
  HSB: [
    { key: "h", label: "Hue", min: 0, max: 360, step: 0.1, format: deg },
    { key: "s", label: "Saturation", min: 0, max: 1, step: 0.001, format: pct },
    { key: "v", label: "Brightness", min: 0, max: 1, step: 0.001, format: pct },
  ],
  RGB: [
    { key: "r", label: "Red", min: 0, max: 255, step: 1, format: int },
    { key: "g", label: "Green", min: 0, max: 255, step: 1, format: int },
    { key: "b", label: "Blue", min: 0, max: 255, step: 1, format: int },
  ],
};

const oklchOf = converter("oklch");
const hsvOf = converter("hsv");
const rgbOf = converter("rgb");

// Every hex string in the app is already normalized, so conversion can't fail.
export const toOklch = (hex: string): Oklch => oklchOf(hex)!;
export const toHsv = (hex: string): Hsv => hsvOf(hex)!;
export const toRgb = (hex: string): Rgb => rgbOf(hex)!;

/** Parses any CSS color string (hex with or without #, rgb(), oklch(), names) to #rrggbb. */
export function normalizeColor(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const candidate = /^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmed) ? `#${trimmed}` : trimmed;
  const color = parse(candidate);
  return color ? formatHex(color) : null;
}

/** Channel values for a hex color in the given mode. Hue is undefined for greys. */
export function toChannels(hex: string, mode: SliderMode): (number | undefined)[] {
  if (mode === "OKLCH") {
    const c = toOklch(hex);
    return [c.l, c.c, c.h];
  }
  if (mode === "HSB") {
    const c = toHsv(hex);
    return [c.h, c.s, c.v];
  }
  const c = toRgb(hex);
  return [c.r * 255, c.g * 255, c.b * 255];
}

/** Position of the hue channel in a mode, or -1 when it has none. */
export function hueIndex(mode: SliderMode): number {
  return CHANNELS[mode].findIndex((c) => c.key === "h");
}

export function fromChannels(values: number[], mode: SliderMode): string {
  const [a, b, c] = values;
  if (mode === "OKLCH") return oklchToHex(a, b, c);
  if (mode === "HSB") return formatHex({ mode: "hsv", h: a, s: b, v: c });
  return formatHex({ mode: "rgb", r: a / 255, g: b / 255, b: c / 255 });
}

/** OKLCH to hex, reducing chroma until the color fits in sRGB. */
export function oklchToHex(l: number, c: number, h: number | undefined): string {
  const color: Oklch = { mode: "oklch", l, c, h };
  return formatHex(clampChroma(color, "oklch"));
}

/** CSS gradient showing what each position on a channel's slider would look like. */
export function channelGradient(values: number[], mode: SliderMode, index: number): string {
  const channel = CHANNELS[mode][index];
  const stops: string[] = [];
  const steps = channel.key === "h" ? 24 : 12;
  for (let i = 0; i <= steps; i++) {
    const next = [...values];
    next[index] = channel.min + ((channel.max - channel.min) * i) / steps;
    stops.push(fromChannels(next, mode));
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

export function luminance(hex: string): number {
  return toOklch(hex).l;
}

export function formatColor(hex: string) {
  const rgb = toRgb(hex);
  const ok = toOklch(hex);
  const hsv = toHsv(hex);
  return {
    hex: hex.toUpperCase(),
    rgb: `rgb(${Math.round(rgb.r * 255)} ${Math.round(rgb.g * 255)} ${Math.round(rgb.b * 255)})`,
    oklch: `oklch(${(ok.l * 100).toFixed(1)}% ${ok.c.toFixed(3)} ${Math.round(ok.h ?? 0)})`,
    hsb: `hsb(${Math.round(hsv.h ?? 0)} ${Math.round(hsv.s * 100)}% ${Math.round(hsv.v * 100)}%)`,
  };
}
