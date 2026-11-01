import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT, exportMarkdown, parseShareState, toQuery } from "./share";

const noEmbed = { size: null, stacked: false, display: false };

describe("parseShareState", () => {
  it("reads every parameter", () => {
    const state = parseShareState({
      bg: "1b2a3a",
      fg: "#F3E9D2",
      algo: "APCA",
      text: "Hello",
      photo: "abc-123_XY",
      swap: "1",
      size: "96",
      layout: "stacked",
      display: "1",
    });
    expect(state).toEqual({
      bg: "#1b2a3a",
      fg: "#f3e9d2",
      algo: "APCA",
      text: "Hello",
      photo: "abc-123_XY",
      swap: true,
      embed: { size: 96, stacked: true, display: true },
    });
  });

  it("falls back on missing or bad values", () => {
    const state = parseShareState({ bg: "zzz", algo: "nope", photo: "../etc", size: "9000", text: ["a", "b"] });
    expect(state).toEqual({
      bg: null,
      fg: null,
      algo: "WCAG",
      text: null,
      photo: null,
      swap: false,
      embed: noEmbed,
    });
  });

  it("caps text at 200 characters", () => {
    expect(parseShareState({ text: "x".repeat(500) }).text).toHaveLength(200);
  });
});

describe("toQuery", () => {
  it("writes a minimal query that parses back", () => {
    const query = toQuery({ bg: "#1b2a3a", fg: "#f3e9d2", algo: "WCAG", text: DEFAULT_TEXT, photo: null, embed: noEmbed });
    expect(query).toBe("bg=1b2a3a&fg=f3e9d2");
  });

  it("records light-background polarity and embed settings", () => {
    const embed = { size: 96, stacked: true, display: true };
    const query = toQuery({ bg: "#f3e9d2", fg: "#1b2a3a", algo: "APCA", text: "Hi there", photo: "p1", embed });
    const parsed = parseShareState(Object.fromEntries(new URLSearchParams(query)));
    expect(parsed).toEqual({
      bg: "#f3e9d2",
      fg: "#1b2a3a",
      algo: "APCA",
      text: "Hi there",
      photo: "p1",
      swap: true,
      embed,
    });
  });
});

describe("exportMarkdown", () => {
  it("includes both colors, both scores, and the link", () => {
    const md = exportMarkdown("#000000", "#ffffff", "Hello", "https://example.test/?bg=000000");
    expect(md).toContain("`#000000`");
    expect(md).toContain("`#FFFFFF`");
    expect(md).toContain("21.00:1");
    expect(md).toContain("AAA");
    expect(md).toContain("Lc 10");
    expect(md).toContain("(https://example.test/?bg=000000)");
  });
});
