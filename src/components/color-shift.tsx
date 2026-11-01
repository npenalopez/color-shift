"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { luminance, type SliderMode } from "@/lib/color";
import { nudge, type Algo } from "@/lib/contrast";
import { orient, pairFromImage, randomPair, type Pair } from "@/lib/palette";
import type { Photo } from "@/lib/photos";
import { DEFAULT_TEXT, exportMarkdown, toQuery, type ShareState } from "@/lib/share";
import { Contrast, label, Segmented, Sliders, Swatches } from "./controls";
import { PhotoCard, PhotoShowcase } from "./photo-card";
import { FONTS, Stage } from "./stage";

type Which = "bg" | "fg";

async function fetchPhotos(query = ""): Promise<Photo[]> {
  const res = await fetch(`/api/photos${query}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Could not load photos");
  return body.photos;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API is blocked in some iframes and insecure contexts.
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function download(filename: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/markdown" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ColorShift({ initial }: { initial: ShareState }) {
  const [bg, setBg] = useState(initial.bg ?? "#1c1917");
  const [fg, setFg] = useState(initial.fg ?? "#f5f0e8");
  const [active, setActive] = useState<Which>("fg");
  const [mode, setMode] = useState<SliderMode>("OKLCH");
  const [algo, setAlgo] = useState<Algo>(initial.algo);
  const [text, setText] = useState(initial.text ?? DEFAULT_TEXT);
  const [font, setFont] = useState(0);
  // Animate color changes that come from photos or buttons, not from dragging.
  const [animate, setAnimate] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [photoStatus, setPhotoStatus] = useState<"loading" | "ready" | "error">("loading");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pairCache = useRef(new Map<string, Pair>());
  const latestPhoto = useRef<string | null>(null);
  const fetchingMore = useRef(false);
  // Which way new pairs from photos and Random are arranged. A share link's
  // own colors decide it; otherwise `swap=1` asks for a light background.
  const lightBg = useRef(
    initial.bg && initial.fg ? luminance(initial.bg) > luminance(initial.fg) : initial.swap,
  );
  const { embed } = initial;

  const photo = photos[index];
  const photoId = photo?.id ?? initial.photo;

  const setPair = useCallback((pair: Pair) => {
    setAnimate(true);
    setBg(pair.bg);
    setFg(pair.fg);
  }, []);

  const applyPhoto = useCallback(
    async (p: Photo) => {
      latestPhoto.current = p.id;
      try {
        const cached = pairCache.current.get(p.id);
        const pair = cached ?? (await pairFromImage(p.sampleUrl));
        pairCache.current.set(p.id, pair);
        // Ignore results for photos the user has already moved past.
        if (latestPhoto.current === p.id) setPair(orient(pair, lightBg.current));
      } catch {
        // Leave the current colors in place if sampling fails.
      }
    },
    [setPair],
  );

  const loadMore = useCallback(async () => {
    if (fetchingMore.current) return;
    fetchingMore.current = true;
    try {
      const batch = await fetchPhotos();
      setPhotos((current) => [...current, ...batch.filter((p) => !current.some((c) => c.id === p.id))]);
    } catch {
      // The arrows stay at the end of the list; the next attempt retries.
    } finally {
      fetchingMore.current = false;
    }
  }, []);

  // First load: the shared photo (if any), then a random batch. Display mode
  // only ever shows the shared photo.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (embed.display && !initial.photo) return;
        const shared = initial.photo ? await fetchPhotos(`?id=${initial.photo}`).catch(() => []) : [];
        const batch = embed.display ? [] : await fetchPhotos();
        if (cancelled) return;
        const list = [...shared, ...batch.filter((p) => !shared.some((s) => s.id === p.id))];
        setPhotos(list);
        setPhotoStatus("ready");
        // A share link's colors win over the photo's.
        if (!initial.bg && !initial.fg && list[0]) applyPhoto(list[0]);
      } catch (error) {
        if (cancelled) return;
        setPhotoStatus("error");
        setPhotoError(error instanceof Error ? error.message : "Could not load photos");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial.bg, initial.fg, initial.photo, embed.display, applyPhoto]);

  const goTo = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0 || next >= photos.length) return;
      setIndex(next);
      applyPhoto(photos[next]);
      if (next >= photos.length - 3) loadMore();
    },
    [index, photos, applyPhoto, loadMore],
  );

  const setColor = useCallback((which: Which, hex: string) => {
    setAnimate(false);
    if (which === "bg") setBg(hex);
    else setFg(hex);
  }, []);

  const swap = useCallback(() => {
    lightBg.current = luminance(fg) > luminance(bg);
    setPair({ bg: fg, fg: bg });
  }, [bg, fg, setPair]);
  const shuffle = useCallback(() => setPair(orient(randomPair(), lightBg.current)), [setPair]);

  const nudged = useMemo(
    () => ({
      up: nudge(bg, fg, algo, active, "up"),
      down: nudge(bg, fg, algo, active, "down"),
    }),
    [bg, fg, algo, active],
  );

  const applyNudge = (direction: "up" | "down") => {
    const hex = nudged[direction];
    if (!hex) return;
    setAnimate(true);
    if (active === "bg") setBg(hex);
    else setFg(hex);
  };

  const query = toQuery({ bg, fg, algo, text, photo: photoId, embed });

  // Keep the address bar shareable without adding history entries.
  useEffect(() => {
    const timer = setTimeout(() => window.history.replaceState(null, "", `?${query}`), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (embed.display) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") goTo(-1);
      else if (e.key === "ArrowRight") goTo(1);
      else if (e.key.toLowerCase() === "s") swap();
      else if (e.key.toLowerCase() === "r") shuffle();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embed.display, goTo, swap, shuffle]);

  const shareUrl = () => `${window.location.origin}${window.location.pathname}?${query}`;

  const copyLink = async () => {
    await copyText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const action =
    "flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-neutral-200 transition hover:border-white/40";

  const layout = `flex min-h-dvh flex-col ${embed.stacked ? "" : "lg:h-dvh lg:flex-row"}`;
  const stage = (
    <Stage bg={bg} fg={fg} algo={algo} text={text} font={font} size={embed.size} stacked={embed.stacked} animate={animate} />
  );

  if (embed.display) {
    return (
      <main className={layout}>
        {stage}
        {photo && <PhotoShowcase photo={photo} stacked={embed.stacked} />}
      </main>
    );
  }

  return (
    <main className={layout}>
      {stage}

      <aside
        className={`w-full border-white/10 p-5 ${
          embed.stacked ? "" : "lg:w-[400px] lg:shrink-0 lg:overflow-y-auto lg:border-l"
        }`}
      >
        <div className={`space-y-7 ${embed.stacked ? "mx-auto max-w-xl" : ""}`}>
          <PhotoCard
            photo={photo}
            status={photoStatus}
            error={photoError}
            canPrev={index > 0}
            canNext={index < photos.length - 1}
            onPrev={() => goTo(-1)}
            onNext={() => goTo(1)}
            onUse={() => photo && applyPhoto(photo)}
            onCopyId={() => photo && copyText(photo.id)}
          />

          <Swatches bg={bg} fg={fg} active={active} onSelect={setActive} onChange={setColor} onSwap={swap} />

          <Sliders
            hex={active === "bg" ? bg : fg}
            mode={mode}
            onModeChange={setMode}
            onChange={(hex) => setColor(active, hex)}
          />

          <Contrast
            bg={bg}
            fg={fg}
            algo={algo}
            active={active}
            onAlgoChange={setAlgo}
            onNudge={applyNudge}
            canNudge={{ up: nudged.up !== null, down: nudged.down !== null }}
          />

          <div className="space-y-3">
            <label className="block">
              <span className={label}>Sample text</span>
              <input
                value={text}
                maxLength={200}
                onChange={(e) => setText(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/40"
              />
            </label>
            <Segmented
              name="Font"
              options={FONTS.map((f) => f.name)}
              value={FONTS[font].name}
              onChange={(name) => setFont(FONTS.findIndex((f) => f.name === name))}
            />
          </div>

          <div className="flex gap-2">
            <button type="button" className={action} onClick={shuffle} title="Random pair (R)">
              Random
            </button>
            <button type="button" className={action} onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              className={action}
              onClick={() => download("color-shift.md", exportMarkdown(bg, fg, text, shareUrl()))}
            >
              Export .md
            </button>
          </div>

          <p className="text-xs text-faint">Keys: ← → photos · S swap · R random</p>
        </div>
      </aside>
    </main>
  );
}
