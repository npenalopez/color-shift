import type { Metadata } from "next";
import { Suspense } from "react";
import { ColorShift } from "@/components/color-shift";
import { parseShareState } from "@/lib/share";

const DESCRIPTION = "Pick a background and a text color, see the contrast, feel the combination.";

// Each share link previews as its own colors and text (see app/og/route.tsx).
export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const params = new URLSearchParams();
  const sp = await searchParams;
  for (const key of ["bg", "fg", "text"]) {
    const value = sp[key];
    if (typeof value === "string") params.set(key, value);
  }
  const image = `/og${params.size ? `?${params}` : ""}`;
  return {
    openGraph: { title: "Color Shift", description: DESCRIPTION, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: "Color Shift", description: DESCRIPTION, images: [image] },
  };
}

async function App({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  return <ColorShift initial={parseShareState(await searchParams)} />;
}

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-neutral-950" />}>
      <App searchParams={searchParams} />
    </Suspense>
  );
}
