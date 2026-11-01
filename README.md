# color-shift

Pick a background and a text color, see the contrast, feel the combination.

- WCAG 2 and APCA contrast scores, with buttons that nudge lightness to the next threshold up or down
- OKLCH, HSB and RGB sliders with live gradient tracks
- Color pairs sampled from Unsplash photos
- Sample text at headline, body and caption sizes in four fonts
- Shareable links (`?bg=&fg=&algo=apca&text=&photo=`) with generated preview images, plus Markdown export

## Setup

```sh
npm install
cp .env.example .env.local   # then add your Unsplash access key
npm run dev
```

The key is only read on the server (`src/app/api/photos/route.ts`), never sent to the browser.
