import { formatColor, luminance, normalizeColor } from "./color";
import { apcaLc, formatScore, level, wcagRatio, type Algo } from "./contrast";

export interface ShareState {
  bg: string | null;
  fg: string | null;
  algo: Algo;
  text: string | null;
  photo: string | null;
  /** Put the lighter color in the background. */
  swap: boolean;
  embed: Embed;
}

/** Settings for embedding the tool in lessons and articles. */
export interface Embed {
  /** Pinned headline size in px. */
  size: number | null;
  /** Color panel above the photo/controls at every width. */
  stacked: boolean;
  /** Showcase only: no controls. */
  display: boolean;
}

export const DEFAULT_TEXT = "Two colors, one feeling";

type Params = Record<string, string | string[] | undefined>;

const one = (params: Params, key: string) => {
  const value = params[key];
  return typeof value === "string" ? value : null;
};

export function parseShareState(params: Params): ShareState {
  const photo = one(params, "photo");
  const size = Number(one(params, "size"));
  return {
    bg: normalizeColor(one(params, "bg")),
    fg: normalizeColor(one(params, "fg")),
    algo: one(params, "algo")?.toLowerCase() === "apca" ? "APCA" : "WCAG",
    text: one(params, "text")?.slice(0, 200) || null,
    photo: photo && /^[\w-]{1,64}$/.test(photo) ? photo : null,
    swap: one(params, "swap") === "1",
    embed: {
      size: Number.isFinite(size) && size >= 12 && size <= 400 ? Math.round(size) : null,
      stacked: one(params, "layout") === "stacked",
      display: one(params, "display") === "1",
    },
  };
}

export function toQuery(state: {
  bg: string;
  fg: string;
  algo: Algo;
  text: string;
  photo: string | null;
  embed: Embed;
}): string {
  const params = new URLSearchParams();
  params.set("bg", state.bg.replace("#", ""));
  params.set("fg", state.fg.replace("#", ""));
  if (state.algo === "APCA") params.set("algo", "apca");
  if (state.text && state.text !== DEFAULT_TEXT) params.set("text", state.text);
  if (state.photo) params.set("photo", state.photo);
  // Recorded so a shared link keeps its polarity when photos or Random change the colors.
  if (luminance(state.bg) > luminance(state.fg)) params.set("swap", "1");
  if (state.embed.size) params.set("size", String(state.embed.size));
  if (state.embed.stacked) params.set("layout", "stacked");
  if (state.embed.display) params.set("display", "1");
  return params.toString();
}

export function exportMarkdown(bg: string, fg: string, text: string, url: string): string {
  const b = formatColor(bg);
  const f = formatColor(fg);
  const ratio = wcagRatio(bg, fg);
  const lc = Math.abs(apcaLc(bg, fg));
  return [
    "# Color Shift pair",
    "",
    `> ${text}`,
    "",
    "| | Background | Foreground |",
    "|---|---|---|",
    `| HEX | \`${b.hex}\` | \`${f.hex}\` |`,
    `| RGB | \`${b.rgb}\` | \`${f.rgb}\` |`,
    `| OKLCH | \`${b.oklch}\` | \`${f.oklch}\` |`,
    `| HSB | \`${b.hsb}\` | \`${f.hsb}\` |`,
    "",
    "| Algorithm | Score | Level |",
    "|---|---|---|",
    `| WCAG 2 | ${formatScore(ratio, "WCAG")} | ${level(ratio, "WCAG").label} — ${level(ratio, "WCAG").description} |`,
    `| APCA | ${formatScore(lc, "APCA")} | ${level(lc, "APCA").label} — ${level(lc, "APCA").description} |`,
    "",
    `[Open in Color Shift](${url})`,
    "",
  ].join("\n");
}
