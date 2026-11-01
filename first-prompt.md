# First prompt: Color Shift

Paste everything below the line into a fresh session opened in `~/Projects/color-shift`.

---

Read `APP-SPEC.md` and `COLOR-SHIFT-STYLE-GUIDE.md` in this repo before doing anything. They are the source of truth. If this prompt and those files disagree, the files win; tell me about the conflict.

## Build

Bring the existing Color Shift app in this repo up to the spec. It's a one-page Next.js (App Router) + TypeScript + Tailwind tool for designers to find a background/text color pair that looks good and passes contrast.

Most of it already exists (uncommitted). Read `src/` first, then build only what's missing:
1. Embed and demo modes from URL params: `display=1` (hide the controls), `layout=stacked` (vertical layout at every width), `size=<px>` (pin the headline size).
2. `swap=1` polarity: lighter color as the background. The default is a dark background.
3. A "copy photo ID" action on the photo card.
4. Tests for the color math in `src/lib/` (scores, levels, nudges, color parsing).
5. Change the keyboard-hint text from `#737373` (fails AA at 4.18:1) to `text-faint` (`#8a8a8a`).

This version of Next.js differs from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code.

## Content

- Preview stage: headline (fits the width), 16px body, and 12px caption in the text color on the background color. Corner readouts show the score and both hex values.
- Controls: photo card with credits, Background and Text swatches with editable values, a swap button, OKLCH/HSB/RGB sliders, a WCAG/APCA toggle with score, level, and "Soften to / Raise to" nudges, sample text, a font picker, and Random / Copy link / Export .md.
- The full URL parameter table is in `APP-SPEC.md` → Content.

## Constraints

- `UNSPLASH_ACCESS_KEY` is read only in server code from `.env.local`. Never print it, log it, put it in a URL, or prefix it with `NEXT_PUBLIC_`.
- Display scores rounded down. A nudge must land on or above its target, measured on the final hex value.
- Nothing on the stage may use opacity, shadows, blur, or gradients.
- Every control works by keyboard with visible focus, and the panel itself meets WCAG AA.
- No horizontal scroll at 360px wide.
- Don't commit or push unless I ask.

## Style

Follow `COLOR-SHIFT-STYLE-GUIDE.md`:
- The interface is neutral (near-black, greys, white) with no accent color.
- Geist for interface text, Geist Mono for all numbers and color values.
- Labels are 11px uppercase with tracking.
- Secondary buttons only, with white/10 borders.

## Behavior

- Share links render their exact colors on first paint; photos load afterward without overriding them.
- Slider changes are instant. Photo, Random, Swap, and nudge changes fade over 400ms, and nothing animates with reduced motion.
- Nudges move only the selected color's lightness. They may cross to the other side of the background color, skip a level that's within one hex step, and disable when nothing is reachable.
- The address bar updates about 250ms after changes, with no new history entries.
- ← → change photos, S swaps, R gives a random pair; shortcuts are ignored while typing.

## Avoid

- Copying anything from github.com/mds/color-shift: code, its fonts (Alpha Lyrae, Departure Mono, Ghost Byte, Input Mono), Shift Nudge branding or UTM name, or wording. It has no license; ideas only.
- Rebuilding its GSAP state machine or a separate mobile control tree. Keep one responsive panel.
- Transitions on slider input.
- Showing APCA as AA/AAA badges.
- Overwriting share-link colors with photo colors on load.
- Accounts, saved palettes, a database, analytics, or a brand accent color.

## Done means

- `npm run build`, `npx tsc --noEmit`, `npm run lint`, and the new tests all pass.
- You've checked the app at 1440px and 390px wide (headless screenshots are fine), including `?display=1` and `?layout=stacked&size=96`.
- You report what changed, what you checked, and anything in the spec you couldn't meet.
