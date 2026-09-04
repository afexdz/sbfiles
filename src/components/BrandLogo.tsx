"use client";

import { useState, useEffect, useRef } from "react";
import { fileSlug } from "@/lib/logo-utils";

// Phase order: db → webp → png → svg → initials
type Phase = "db" | "webp" | "png" | "svg" | "initials";

interface Props {
  slug:          string;
  name:          string;
  logoUrl?:      string | null;
  eager?:        boolean;
  highPriority?: boolean;
  compact?:      boolean;
}

function nextPhase(phase: Phase): Phase {
  if (phase === "db")   return "webp";
  if (phase === "webp") return "png";
  if (phase === "png")  return "svg";
  return "initials";
}

function getSrc(phase: Phase, slug: string, logoUrl?: string | null): string | null {
  if (phase === "db")   return logoUrl ?? null;
  if (phase === "webp") return `/logos/${fileSlug(slug)}.webp`;
  if (phase === "png")  return `/logos/${fileSlug(slug)}.png`;
  if (phase === "svg")  return `/logos/${fileSlug(slug)}.svg`;
  return null;
}

export function BrandLogo({ slug, name, logoUrl, eager = false, highPriority = false, compact = false }: Props) {
  const initials = name.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 2).toUpperCase();
  const [phase, setPhase] = useState<Phase>(logoUrl ? "db" : "webp");
  const imgRef = useRef<HTMLImageElement>(null);

  function advance() {
    setPhase((p) => nextPhase(p));
  }

  // If the img already errored before React attached onError (SSR hydration race),
  // complete=true && naturalWidth=0 — detect and advance manually.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth === 0) {
      advance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "initials") {
    return compact ? (
      <div className="w-[52px] h-[36px] grid place-items-center font-display text-[18px] font-bold text-ink2 bg-card border border-line rounded">
        {initials}
      </div>
    ) : (
      <div className="w-[88px] h-[58px] grid place-items-center font-display text-[26px] font-bold text-ink2 bg-card border border-line rounded-lg">
        {initials}
      </div>
    );
  }

  const src = getSrc(phase, slug, logoUrl);
  if (!src) return null; // guards against unexpected state (getSrc only returns null for "initials")

  return (
    // key=src forces a fresh <img> mount on each src change so onError fires reliably
    <img
      ref={imgRef}
      key={src}
      src={src}
      alt=""
      aria-hidden
      width={compact ? 56 : 160}
      height={compact ? 46 : 80}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={highPriority ? "high" : "auto"}
      decoding="async"
      onError={advance}
      className={
        compact
          ? "max-w-full max-h-[46px] sm:max-h-[56px] object-contain"
          : "max-w-full max-h-16 sm:max-h-20 object-contain drop-shadow-[0_10px_12px_rgba(16,32,48,.22)]"
      }
    />
  );
}
