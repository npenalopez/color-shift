"use client";

import { useState } from "react";
import type { Photo } from "@/lib/photos";

interface PhotoCardProps {
  photo: Photo | undefined;
  status: "loading" | "ready" | "error";
  error: string | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onUse: () => void;
  onCopyId: () => void;
}

const arrow =
  "grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:opacity-30";

export function PhotoCard({
  photo,
  status,
  error,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onUse,
  onCopyId,
}: PhotoCardProps) {
  const [copied, setCopied] = useState(false);
  const copyId = () => {
    onCopyId();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section aria-label="Photo palette">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-900">
        {photo ? (
          // Unsplash requires hotlinking its image URLs, so this skips next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={photo.alt} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center p-6 text-center text-sm text-neutral-400">
            {status === "error" ? error : "Loading photos…"}
          </div>
        )}
        {photo && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
            <button type="button" className={arrow} onClick={onPrev} disabled={!canPrev} aria-label="Previous photo">
              ←
            </button>
            <button
              type="button"
              onClick={onUse}
              className="rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black/80"
            >
              Use photo colors
            </button>
            <button type="button" className={arrow} onClick={onNext} disabled={!canNext} aria-label="Next photo">
              →
            </button>
          </div>
        )}
      </div>
      {photo && (
        <div className="mt-2 flex items-baseline justify-between gap-3 text-xs text-neutral-400">
          <button
            type="button"
            onClick={copyId}
            className="font-mono transition hover:text-white"
            title="Copy the photo ID for the photo= link parameter"
          >
            {copied ? "Copied ID" : `ID ${photo.id}`}
          </button>
          <Credit photo={photo} />
        </div>
      )}
    </section>
  );
}

function Credit({ photo, className = "" }: { photo: Photo; className?: string }) {
  return (
    <p className={className}>
      Photo by{" "}
      <a href={photo.photographerUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">
        {photo.photographer}
      </a>{" "}
      on{" "}
      <a href={photo.photoUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">
        Unsplash
      </a>
    </p>
  );
}

/** Display mode's photo: fills its half (or row, when stacked) with the credit overlaid. */
export function PhotoShowcase({ photo, stacked }: { photo: Photo; stacked: boolean }) {
  return (
    <figure className={`relative bg-neutral-900 ${stacked ? "h-[50svh]" : "h-[50svh] lg:h-auto lg:w-2/5"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Unsplash requires hotlinking */}
      <img src={photo.url} alt={photo.alt} className="absolute inset-0 size-full object-cover" />
      <figcaption className="absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
        <Credit photo={photo} />
      </figcaption>
    </figure>
  );
}
