import { formatScore, level, type Algo, score } from "@/lib/contrast";

export const FONTS = [
  { name: "Geist", className: "font-sans font-medium" },
  { name: "Instrument Serif", className: "font-serif" },
  { name: "Space Grotesk", className: "font-grotesk font-medium" },
  { name: "Geist Mono", className: "font-mono" },
] as const;

interface StageProps {
  bg: string;
  fg: string;
  algo: Algo;
  text: string;
  font: number;
  /** Pinned headline size in px; fits the width when null. */
  size: number | null;
  /** Keeps the phone-height stage at every width (the stacked layout). */
  stacked: boolean;
  animate: boolean;
}

/**
 * The specimen: sample text at headline, body and caption sizes. Nothing here
 * uses opacity, so every line shows the pair's true contrast.
 */
export function Stage({ bg, fg, algo, text, font, size, stacked, animate }: StageProps) {
  const value = score(bg, fg, algo);
  const current = level(value, algo);
  // Shorter text gets bigger, sized against the stage width.
  const headline = size
    ? `${size}px`
    : `clamp(2.5rem, ${Math.min(20, 240 / Math.max(text.length, 8))}cqw, 12rem)`;

  return (
    <section
      className={`stage @container relative flex min-h-[70svh] flex-1 flex-col justify-between gap-10 p-6 sm:p-10 ${stacked ? "" : "lg:min-h-0"}`}
      style={{ background: bg, color: fg, transition: animate ? undefined : "none" }}
      aria-label="Color preview"
    >
      <header className="flex items-baseline justify-between text-xs font-medium uppercase tracking-[0.2em]">
        <span>Color Shift</span>
        <span className="font-mono normal-case tracking-normal">
          {formatScore(value, algo)} · {algo === "APCA" && current.min > 0 ? `passes ${current.label}` : current.label}
        </span>
      </header>

      <div>
        <p
          className={`${FONTS[font].className} break-words leading-[0.95] tracking-tight`}
          style={{ fontSize: headline }}
        >
          {text}
        </p>
        <p className="mt-8 max-w-xl text-base leading-relaxed">
          Body text at 16 pixels. A pair that works for a headline can still struggle here, so this
          line shows how the colors read at everyday sizes.
        </p>
        <p className="mt-3 max-w-xl text-xs leading-relaxed">
          Caption at 12 pixels — the hardest test for any color pair.
        </p>
      </div>

      <footer className="flex gap-6 font-mono text-xs">
        <span>BG {bg.toUpperCase()}</span>
        <span>FG {fg.toUpperCase()}</span>
      </footer>
    </section>
  );
}
