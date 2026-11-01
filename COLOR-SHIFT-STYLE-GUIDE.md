# Color Shift — Style Guide

The user's two colors are the only colors that matter. Everything else is a quiet frame around them.

## Principles

1. **The pair is the hero.** The stage takes about 70% of the width on desktop and the full first screen on phones.
2. **The interface is neutral.** It uses near-black, greys, and white only, so it never changes how the pair is judged.
3. **Numbers are mono.** Scores, hex values, and slider readouts use Geist Mono, so values line up and read as data.
4. **True color only on the stage.** No opacity, blend modes, shadows, or gradients touch the preview.

## Layout

| | Desktop (≥ 1024px) | Phone / tablet |
|---|---|---|
| Structure | Stage left (fills), controls panel right (400px, scrolls on its own) | Stage on top (70% of the screen height), controls below |
| Stage padding | 40px | 24px |
| Panel padding | 20px; 28px between sections | same |
| Stacked embed | `layout=stacked` forces the phone structure at any width | — |

Stage content is three rows: header readouts at the top, specimen in the middle, hex values at the bottom.

## Color (interface only)

| Token | Value | Use |
|---|---|---|
| `panel` | `#0a0a0a` (neutral-950) | Page and panel background |
| `surface` | `#171717` (neutral-900) | Segmented controls, selected swatch, photo placeholder |
| `border` | white at 10% | Default borders |
| `border-strong` | white at 30–40% (hover), 70% (selected) | Hover and selected state |
| `text` | `#f5f5f5` (neutral-100) | Primary text and values |
| `text-muted` | `#a3a3a3` (neutral-400) | Labels, secondary info, credits |
| `text-faint` | `#8a8a8a` | Keyboard hints only (5.73:1 on `panel`, 5.19:1 on `surface`). Not Tailwind's neutral-500 (`#737373`), which is only 4.18:1 and fails AA |
| `selected` | `#f5f5f5` background + `#0a0a0a` text | Active tab in a segmented control |

No accent hue. Disabled controls drop to 30% opacity. That's the only opacity in the app, and never on the stage.

## Type

| Role | Font | Size / weight | Notes |
|---|---|---|---|
| Specimen headline | User's pick (Geist, Instrument Serif, Space Grotesk, Geist Mono) | Fits width: 40px min, 192px max; line height 0.95; tight tracking | Pinned by `size` in embeds |
| Specimen body | Geist | 16px / 400, line height 1.6, max 36rem wide | Fixed: this is the readability test |
| Specimen caption | Geist | 12px / 400 | Fixed |
| Stage readouts | Geist (name), Geist Mono (values) | 12px; name uppercase, 0.2em tracking | Use the text color, never dimmed |
| Section label | Geist | 11px / 500, uppercase, 0.16em tracking, `text-muted` | "Background", "Hue", "Sample text" |
| Big score | Geist Mono | 36px / 500, tight | `12.09:1`, `Lc 71` |
| Values and readouts | Geist Mono | 12–14px | Hex in uppercase: `#1B2A3A` |
| Buttons and tabs | Geist | 12px / 500 | Sentence case: "Copy link", "Use photo colors" |

## Components

- **Swatch:** 40px color chip (6px radius, 1px white/15 ring) + label + editable mono value. Selected: border at 70% white and `surface` fill.
- **Segmented control:** `surface` track, 4px padding, 6px-radius segments; the selected segment uses `selected`. Used for slider mode, algorithm, and font.
- **Slider:** 24px-tall pill track painted with the channel's real gradient; 20px thumb filled with the current color, 3px white ring, thin dark outline so it shows on any track.
- **Button (secondary):** transparent, white/10 border, 8px radius, 12px/500 text; hover raises the border to 40%. All panel buttons use this style; there's no filled primary button.
- **Photo card:** 4:3, 12px radius; controls float on a black/60 blurred pill over the image bottom; credit sits right-aligned below it in `text-muted`.
- **Icons:** plain text glyphs (← → ⇄ ↑ ↓) for now; any icon set must be single-weight line icons at 16px.

## Motion

- Color changes from photos, Random, Swap, and nudges: background and text color fade over 400ms, ease.
- Slider and typing changes: instant (no transition).
- Hover and border changes: 150ms.
- With `prefers-reduced-motion`, everything is instant.

## Writing

- Plain and short. Name levels by what they allow ("Passes for body text"), not by spec jargon alone.
- Sentence case everywhere except small uppercase labels.
- Numbers always formatted the same way: `4.50:1`, `Lc 75`, `#1B2A3A`.
- Errors say what to do: "UNSPLASH_ACCESS_KEY is not set. Add it to .env.local and restart the dev server."
