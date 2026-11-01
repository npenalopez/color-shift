import { ImageResponse } from "next/og";
import { normalizeColor } from "@/lib/color";
import { formatScore, level, wcagRatio } from "@/lib/contrast";
import { DEFAULT_TEXT } from "@/lib/share";

// Share-link preview: the pair's colors with its sample text and WCAG score.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const bg = normalizeColor(params.get("bg")) ?? "#111111";
  const fg = normalizeColor(params.get("fg")) ?? "#f5f5f5";
  const text = (params.get("text") || DEFAULT_TEXT).slice(0, 120);
  const ratio = wcagRatio(bg, fg);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: bg,
          color: fg,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", opacity: 0.8 }}>
          Color Shift
        </div>
        <div style={{ fontSize: text.length > 40 ? 72 : 108, lineHeight: 1.05, letterSpacing: -2 }}>
          {text}
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 30 }}>
          <span>{bg.toUpperCase()}</span>
          <span>{fg.toUpperCase()}</span>
          <span>
            {formatScore(ratio, "WCAG")} · {level(ratio, "WCAG").label}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
