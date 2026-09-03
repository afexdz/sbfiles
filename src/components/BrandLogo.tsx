"use client";

import { useState } from "react";

type Phase = "db" | "png" | "svg" | "initials";

interface Props {
  slug:     string;
  name:     string;
  logoUrl?: string | null;
}

function nextPhase(phase: Phase): Phase {
  if (phase === "db")  return "png";
  if (phase === "png") return "svg";
  return "initials";
}

function getSrc(phase: Phase, slug: string, logoUrl?: string | null): string | null {
  if (phase === "db")  return logoUrl ?? null;
  if (phase === "png") return `/logos/${slug}.png`;
  if (phase === "svg") return `/logos/${slug}.svg`;
  return null;
}

/**
 * Displays a brand logo with a local-first cascade:
 * 1. logo_url (DB field) — priority absolute
 * 2. /logos/{slug}.png
 * 3. /logos/{slug}.svg
 * 4. Initials plate (final fallback — no external network calls)
 */
export function BrandLogo({ slug, name, logoUrl }: Props) {
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
  if (!src) return null;

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className="max-w-[92px] max-h-[62px] object-contain drop-shadow-[0_10px_12px_rgba(16,32,48,.22)]"
    />
  );
}
