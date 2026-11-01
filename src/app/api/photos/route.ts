import type { Photo } from "@/lib/photos";

const API = "https://api.unsplash.com";

// Unfiltered random photos cluster around a small curated set, so each batch
// draws from a random theme to keep the palettes varied.
const THEMES = [
  "nature", "architecture", "abstract", "texture", "city", "landscape",
  "ocean", "forest", "desert", "sky", "neon", "flowers", "interior",
  "street", "minimal", "autumn", "snow", "night", "sunset", "food",
  "fashion", "art", "pattern", "macro", "travel", "plants", "water",
];

// Unsplash's API guidelines require these on every link back to Unsplash.
const UTM = "utm_source=color_shift&utm_medium=referral";

interface UnsplashPhoto {
  id: string;
  alt_description: string | null;
  urls: { raw: string; regular: string };
  links: { html: string };
  user: { name: string; links: { html: string } };
}

function withUtm(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}${UTM}`;
}

function toPhoto(p: UnsplashPhoto): Photo {
  return {
    id: p.id,
    url: p.urls.regular,
    sampleUrl: `${p.urls.raw}${p.urls.raw.includes("?") ? "&" : "?"}w=64&q=60&fm=jpg`,
    alt: p.alt_description ?? "Photo from Unsplash",
    photographer: p.user.name,
    photographerUrl: withUtm(p.user.links.html),
    photoUrl: withUtm(p.links.html),
  };
}

async function unsplash(path: string, key: string) {
  return fetch(`${API}${path}`, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    cache: "no-store",
  });
}

export async function GET(request: Request) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return Response.json(
      { error: "UNSPLASH_ACCESS_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 503 },
    );
  }

  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    if (!/^[\w-]{1,64}$/.test(id)) return Response.json({ error: "Invalid photo id" }, { status: 400 });
    const res = await unsplash(`/photos/${encodeURIComponent(id)}`, key);
    if (!res.ok) return Response.json({ error: "Photo not found" }, { status: res.status });
    return Response.json({ photos: [toPhoto(await res.json())] });
  }

  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const res = await unsplash(
    `/photos/random?count=12&content_filter=high&query=${encodeURIComponent(theme)}`,
    key,
  );
  if (!res.ok) {
    const error = res.status === 401 ? "Unsplash rejected the access key" : "Unsplash request failed";
    return Response.json({ error }, { status: res.status === 401 ? 401 : 502 });
  }
  const photos = ((await res.json()) as UnsplashPhoto[]).map(toPhoto);
  return Response.json({ photos });
}
