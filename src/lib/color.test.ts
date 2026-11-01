import { describe, expect, it } from "vitest";
import { fromChannels, hueIndex, normalizeColor, toChannels, type SliderMode } from "./color";
import { ensureReadable, orient, randomPair } from "./palette";
import { wcagRatio } from "./contrast";
import { luminance } from "./color";

describe("normalizeColor", () => {
  it.each([
    ["#ABCDEF", "#abcdef"],
    ["abcdef", "#abcdef"],
    ["abc", "#aabbcc"],
    ["rgb(10 20 30)", "#0a141e"],
    ["oklch(0.7 0.1 200)", "#40b1b7"],
    ["rebeccapurple", "#663399"],
  ])("parses %s", (input, hex) => {
    expect(normalizeColor(input)).toBe(hex);
  });

  it.each(["", "nope", "#12", null, undefined])("rejects %s", (input) => {
    expect(normalizeColor(input)).toBeNull();
  });
});

describe("channels", () => {
  const samples = ["#1b2a3a", "#f4d35e", "#ff0000", "#00ff88", "#808080", "#ffffff", "#000000", "#663399"];

  it.each(["OKLCH", "HSB", "RGB"] as SliderMode[])("round-trips through %s", (mode) => {
    for (const hex of samples) {
      const values = toChannels(hex, mode).map((v) => v ?? 0);
      expect(fromChannels(values, mode)).toBe(hex);
    }
  });

  it("reports no hue for greys so the UI can remember the last one", () => {
    expect(toChannels("#808080", "OKLCH")[hueIndex("OKLCH")]).toBeUndefined();
    expect(toChannels("#808080", "HSB")[hueIndex("HSB")]).toBeUndefined();
    expect(hueIndex("RGB")).toBe(-1);
  });
});

describe("pairs", () => {
  it("orients pairs by polarity", () => {
    const pair = { bg: "#ffffff", fg: "#111111" };
    expect(orient(pair, false)).toEqual({ bg: "#111111", fg: "#ffffff" });
    expect(orient(pair, true)).toEqual(pair);
  });

  it("raises a weak pair to at least 4.5:1", () => {
    const pair = ensureReadable({ bg: "#336699", fg: "#4477aa" });
    expect(pair.bg).toBe("#336699");
    expect(wcagRatio(pair.bg, pair.fg)).toBeGreaterThanOrEqual(4.5);
  });

  it("makes readable random pairs in both polarities", () => {
    for (let i = 0; i < 200; i++) {
      const pair = randomPair();
      expect(wcagRatio(pair.bg, pair.fg)).toBeGreaterThanOrEqual(4.5);
      expect(luminance(orient(pair, false).bg)).toBeLessThanOrEqual(luminance(orient(pair, false).fg));
    }
  });
});
