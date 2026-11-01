# Color Shift — App Spec

Status: **approved** 2026-11-01 · all items below are built

Assumptions still open (answer these to finalize):
- **A1. Fidelity.** Assumed "match the example's feature set, including embed and demo modes, with our own code and our own visual design." The interview question on this went unanswered.
- **A2. Avoid section.** No Avoid list came from you, so the one below is mine. Edit it or tell me what's missing.
- **A3. THOUGHTS.md** was never found. If it exists, it may change this spec.

---

## Build

A one-page web tool for designers and design students to find a background/text color pair that both looks good and passes contrast standards. It also serves as an embeddable teaching demo for lessons and articles.

- Next.js (App Router) + TypeScript + Tailwind, deployed as one app. The server holds the Unsplash key; no other backend, database, or accounts.
- Source of inspiration: `github.com/mds/color-shift` (no license). We copy **ideas only**: no code, fonts, icons, copy, or branding from it.
- Already built (uncommitted) in this repo: preview stage, sliders, WCAG/APCA scoring, threshold nudges, photo palettes, share links, OG images, Markdown export, keyboard shortcuts.
- Built for parity on 2026-11-01: embed/demo modes (`display`, `layout`, `size`), polarity setting (`swap`), copy-photo-ID, tests (`npm test`), and the keyboard-hint contrast fix (`text-faint`, 5.73:1).

## Content

What appears on screen and in the URL.

**Preview stage**
- Full-bleed background color with the sample text in the text color at three sizes: headline (fits the width), 16px body, 12px caption.
- Corner readouts: app name, current score and level, both hex values.

**Controls panel**
- Photo card: the image, previous/next arrows, "Use photo colors", photographer + Unsplash credit links (with the required UTM tags), and a way to copy the photo ID.
- Two swatches (Background, Text), each with an editable value that accepts hex (with or without `#`), `rgb()`, `oklch()`, or CSS color names. A swap button sits between them.
- Mode tabs (OKLCH / HSB / RGB) and three sliders whose tracks show the colors each position would produce.
- Contrast block: WCAG / APCA toggle, big score, level name with a plain-language meaning, the other algorithm's score in small type, and "Soften to X" / "Raise to Y" nudge buttons.
- Sample text input and a four-font picker.
- Actions: Random, Copy link, Export .md.

**Levels shown**
- WCAG 2: AAA ≥ 7, AA ≥ 4.5, AA Large ≥ 3, otherwise Fail.
- APCA: Lc 90 / 75 / 60 / 45 / 30 / 15, each with a one-line meaning (for example, "Lc 75: minimum for body text").

**URL parameters** (the URL is the save file)
| Param | Meaning |
|---|---|
| `bg`, `fg` | Hex colors, `#` optional |
| `algo` | `wcag` (default) or `apca` |
| `text` | Sample text, max 200 characters |
| `photo` | Unsplash photo ID |
| `swap=1` | New pairs from photos and Random put the lighter color in the background (default is dark). Written automatically whenever the current background is the lighter color; a link's own `bg`/`fg` are always shown exactly as given |
| `size` | Pin the headline size in px (for embeds) |
| `layout=stacked` | Color panel above photo at every width (for embeds) |
| `display=1` | Hide all controls; showcase only |

**Exports**
- Copy link: the full URL.
- Export .md: both colors in HEX/RGB/OKLCH/HSB, WCAG and APCA scores with levels, sample text, and a link back.
- Share preview image (1200×630) showing the pair, the text, and the WCAG score.

## Constraints

- **Secrets:** `UNSPLASH_ACCESS_KEY` lives only in `.env.local` (git-ignored) and is read only in server code. It must never appear in client bundles, URLs, logs, or commits. If it's missing, the app still works and the photo card explains how to add it.
- **Unsplash rules:** hotlink the image URLs Unsplash returns, credit the photographer and Unsplash on every photo, and add UTM tags to those links.
- **Honest scores:** round scores *down* for display, so 4.499 never shows as 4.50 and appears to pass. Nudges must land on or above the target when measured on the final hex value.
- **No opacity, blur, gradient, or shadow on the preview text or background.** Anything that changes the effective colors makes the score a lie.
- **Accessibility of the tool itself:** the controls panel meets WCAG AA. Every control works by keyboard, with visible focus. Animation respects reduced motion.
- **Performance:** slider dragging updates the preview with no visible lag on a mid-range laptop. Photo colors are sampled from a 64px thumbnail in the browser.
- **No flash on share links:** a share link opens directly to its exact state, with no flash of the default colors.
- **Platforms:** current Chrome, Safari, Firefox; phones from 360px wide with no horizontal scroll.
- **Inside iframes:** Copy link still works (clipboard fallback), and embed modes need no cookies or storage.

## Style

See `COLOR-SHIFT-STYLE-GUIDE.md`. Summary:
- The user's colors are the hero. The tool's own interface is a quiet, near-black panel that never competes with them.
- Geist for interface text; Geist Mono for every number and color value; small uppercase tracked labels.
- One accent only: white for the selected state. No brand color.

## Behavior

**On load**
- With `bg`/`fg` in the URL: show those colors immediately (rendered on the server), then load photos without changing the colors.
- Without them: load photos and apply the first photo's colors with a soft fade.
- With `photo`: that photo is shown first.

**Editing**
- Clicking a swatch selects it. Sliders, the value field, and nudges act on the selected color.
- Dragging a slider updates the preview instantly, with no fade. Photo changes, Random, Swap, and nudges fade over about 400ms.
- A grey color remembers its last hue, so raising saturation again doesn't jump to red.
- An invalid typed value reverts to the current color on blur or Enter.

**Contrast**
- The toggle switches which algorithm drives the big score, the levels, and the nudges.
- Nudge changes only the selected color's lightness, keeping its hue and saturation. If the target can't be reached on its current side, it may cross to the other side (dark to light). If the nearest level is within one hex step, it skips to the next one. When nothing is reachable, the button is disabled.

**Photos**
- Batches of 12 come from a random theme. More are fetched before the user reaches the end.
- Each photo's pair is cached. Results from a photo the user has already moved past are ignored.
- Pair picking uses a dominant photo color for the background and the most vivid well-contrasting color for the text, raised to at least 4.5:1 when needed.

**Sharing**
- The address bar updates about 250ms after changes, without adding browser history entries.
- Keyboard: ← → for photos, S to swap, R for random. Shortcuts are ignored while typing in a field.

**Embed modes**
- `display=1` hides the controls panel and keyboard hints, leaving only the stage (and the photo, if any).
- `layout=stacked` forces the vertical layout.
- `size` fixes the headline size.

## Avoid

Specific to this app, not generic advice:

1. **Don't let decoration fake the contrast.** No translucent text, frosted overlays, gradient backgrounds, or text shadows on the stage, and no tinted "glass" over photos behind sample text.
2. **Don't round scores up or show a pass the hex doesn't earn.** No `toFixed(1)` showing "4.5:1" for 4.46.
3. **Don't present APCA as a pass/fail badge like WCAG.** Show Lc levels with their meanings; APCA has no "AA".
4. **Don't copy from mds/color-shift.** No code, its bundled fonts (Alpha Lyrae, Departure Mono, Ghost Byte, Input Mono), Shift Nudge favicon or UTM name, Figma frames, or wording. It has no license.
5. **Don't animate slider dragging.** A transition on every input makes the preview lag behind the thumb.
6. **Don't rebuild the example's GSAP state machine or separate mobile/desktop control trees.** That is where its complexity and bugs live. Use one responsive panel.
7. **Don't send the key to the browser.** No `NEXT_PUBLIC_UNSPLASH_*`, no client-side Unsplash calls, no key in the OG image route's URL.
8. **Don't overwrite share-link colors with photo colors** on load.
9. **Don't add accounts, saved palettes, a database, or analytics** in this version.
10. **Don't add a brand accent color to the controls.** Every extra color in the interface sits next to the user's pair and skews how it's judged.
