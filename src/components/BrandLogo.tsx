"use client";

import { useState } from "react";

type Phase = "db" | "png" | "svg" | "initials";

interface Props {
  slug:     string;
  name:     string;
  logoUrl?: string | null;
  eager?:   boolean;
}

// DB slug → actual filename stem (when they differ from the DB slug)
const FILE_SLUG: Readonly<Record<string, string>> = {
  "land-rover":      "landrover",
  "mercedes-benz":   "mercedes",
  "mercedes-citaro": "mercedes",
};
function fileSlug(slug: string): string { return FILE_SLUG[slug] ?? slug; }

function nextPhase(phase: Phase): Phase {
  if (phase === "db")  return "png";
  if (phase === "png") return "svg";
  return "initials";
}

function getSrc(phase: Phase, slug: string, logoUrl?: string | null): string | null {
  if (phase === "db")  return logoUrl ?? null;
  if (phase === "png") return `/logos/${fileSlug(slug)}.png`;
  if (phase === "svg") return `/logos/${fileSlug(slug)}.svg`;
  return null;
}

export function BrandLogo({ slug, name, logoUrl, eager = false }: Props) {
  const initials = name.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 2).toUpperCase();
  const [phase, setPhase] = useState<Phase>(logoUrl ? "db" : "png");

  function handleError() {
    setPhase((p) => nextPhase(p));
  }

  if (phase === "initials") {
    return (
      <div className="w-[88px] h-[58px] grid place-items-center font-display text-[26px] font-bold text-ink2 bg-card border border-line rounded-lg">
        {initials}
      </div>
    );
  }

  const src = getSrc(phase, slug, logoUrl);
  // If src is null (only happens when phase="db" with no logoUrl), skip to png
  if (!src) {
    setPhase("png");
    return null;
  }

  return (
    // key=src forces a fresh <img> mount on each src change so onError fires reliably
    <img
      key={src}
      src={src}
      alt={name}
      width={92}
      height={62}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={handleError}
      className="max-w-[92px] max-h-[62px] object-contain drop-shadow-[0_10px_12px_rgba(16,32,48,.22)]"
    />
  );
}
