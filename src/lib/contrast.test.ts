import { describe, expect, it } from "vitest";
import { formatHex } from "culori";
import { toOklch } from "./color";
import { apcaLc, formatScore, level, nextThreshold, nudge, score, wcagRatio, type Algo } from "./contrast";

// Deterministic pseudo-random colors so failures are reproducible.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomHex(next: () => number) {
  return formatHex({ mode: "rgb", r: next(), g: next(), b: next() });
}

describe("scores", () => {
  it("matches known WCAG ratios", () => {
    expect(wcagRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(wcagRatio("#777777", "#777777")).toBeCloseTo(1);
  });

  it("signs APCA by polarity", () => {
    expect(apcaLc("#ffffff", "#000000")).toBeGreaterThan(100);
    expect(apcaLc("#000000", "#ffffff")).toBeLessThan(-100);
    expect(score("#000000", "#ffffff", "APCA")).toBeGreaterThan(100);
  });

  it("rounds down so a near miss never reads as a pass", () => {
    expect(formatScore(4.4999, "WCAG")).toBe("4.49:1");
    expect(formatScore(4.5, "WCAG")).toBe("4.50:1");
    expect(formatScore(74.9, "APCA")).toBe("Lc 74");
  });
});

describe("levels", () => {
  it.each([
    [7, "WCAG", "AAA"],
    [4.5, "WCAG", "AA"],
    [4.49, "WCAG", "AA Large"],
    [2.99, "WCAG", "Fail"],
    [75, "APCA", "Lc 75"],
    [14, "APCA", "Fail"],
  ] as const)("%s %s is %s", (value, algo, label) => {
    expect(level(value, algo).label).toBe(label);
  });

  it("finds the next threshold in each direction", () => {
    expect(nextThreshold(5, "WCAG", "up")).toBe(7);
    expect(nextThreshold(5, "WCAG", "down")).toBe(4.5);
    expect(nextThreshold(4.505, "WCAG", "down")).toBe(3);
    expect(nextThreshold(21, "WCAG", "up")).toBeNull();
    expect(nextThreshold(2, "WCAG", "down")).toBeNull();
  });
});

describe("nudge", () => {
  const next = rng(42);
  const cases = Array.from({ length: 150 }, () => ({ bg: randomHex(next), fg: randomHex(next) }));

  for (const algo of ["WCAG", "APCA"] as Algo[]) {
    for (const moving of ["bg", "fg"] as const) {
      for (const direction of ["up", "down"] as const) {
        it(`${algo} ${moving} ${direction} lands on a threshold`, () => {
          for (const { bg, fg } of cases) {
            const before = score(bg, fg, algo);
            const hex = nudge(bg, fg, algo, moving, direction);
            if (!hex) continue;
            const after = moving === "fg" ? score(bg, hex, algo) : score(hex, fg, algo);
            const floor = level(after, algo).min;
            // On or just above a threshold, measured on the final hex.
            expect(after).toBeGreaterThanOrEqual(floor);
            expect(after - floor).toBeLessThan(algo === "WCAG" ? 0.15 : 2.5);
            if (direction === "up") expect(after).toBeGreaterThan(before);
            else expect(after).toBeLessThan(before);
          }
        });
      }
    }
  }

  it("keeps the moving color's hue", () => {
    const hex = nudge("#f4d35e", "#2a6f97", "WCAG", "fg", "up")!;
    expect(toOklch(hex).h).toBeCloseTo(toOklch("#2a6f97").h!, -1);
  });

  it("skips a threshold that sits within one hex step", () => {
    const hex = nudge("#f9a262", "#00312a", "WCAG", "fg", "down");
    expect(hex).not.toBe("#00312a");
    expect(score("#f9a262", hex!, "WCAG")).toBeLessThan(7);
  });

  it("returns null when nothing is reachable", () => {
    expect(nudge("#000000", "#ffffff", "WCAG", "fg", "up")).toBeNull();
  });
});
