"use client";

import { useState } from "react";
import { TiltCard, Glare } from "@/components/ui/TiltCard";

interface Props {
  name: string;
  slug: string;
  logoUrl?: string | null;
  onClick?: () => void;
}

export function BrandCard({ name, slug, logoUrl, onClick }: Props) {
  const initials = name.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 2).toUpperCase();
  const cdnUrl = `https://cdn.simpleicons.org/${slug}`;

  const [src, setSrc] = useState<string | null>(logoUrl ?? `/logos/${slug}.png`);
  const [triedCdn, setTriedCdn] = useState(false);
  const [showInitials, setShowInitials] = useState(false);

  function handleError() {
    if (!triedCdn) {
      setTriedCdn(true);
      setSrc(cdnUrl);
    } else {
      setSrc(null);
      setShowInitials(true);
    }
  }

  return (
    <TiltCard>
      <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        className="flex flex-col items-center justify-center gap-3 w-[172px] h-[158px] rounded-[14px] cursor-pointer relative overflow-hidden border border-line shadow-card group-hover:border-line2 group-hover:shadow-[0_28px_52px_-26px_rgba(16,32,48,.48),0_2px_6px_rgba(16,32,48,.08)] transition-[border-color,box-shadow] duration-[400ms]"
        style={{
          background: "linear-gradient(168deg, #FFFFFF 0%, #F4F7FA 62%, #E9EFF4 100%)",
        }}
      >
        {/* Top fade */}
        <div className="absolute left-0 right-0 top-0 h-[52%] bg-gradient-to-b from-white/95 to-transparent pointer-events-none" />

        {/* Logo or initials */}
        <div className="relative z-[3] brand-logo-layer w-24 h-[66px] grid place-items-center">
          {showInitials ? (
            <div className="w-[88px] h-[58px] grid place-items-center font-display text-[26px] font-bold text-ink2 bg-card border border-line rounded-lg">
              {initials}
            </div>
          ) : (
            src && (
              <img
                src={src}
                alt={name}
                loading="lazy"
                onError={handleError}
                className="max-w-[92px] max-h-[62px] object-contain drop-shadow-[0_10px_12px_rgba(16,32,48,.22)]"
              />
            )
          )}
        </div>

        {/* Brand name */}
        <span className="text-[13.5px] text-ink2 text-center leading-tight px-2 relative z-[3] [transform:translateZ(20px)]">
          {name}
        </span>

        <Glare />
      </div>
    </TiltCard>
  );
}
