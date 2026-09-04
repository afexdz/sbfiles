"use client";

import { TiltCard, Glare } from "@/components/ui/TiltCard";
import { BrandLogo }       from "@/components/BrandLogo";

interface Props {
  name:     string;
  slug:     string;
  logoUrl?: string | null;
  onClick?: () => void;
  eager?:   boolean;
}

export function BrandCard({ name, slug, logoUrl, onClick, eager }: Props) {
  return (
    <TiltCard>
      <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        className="flex flex-col items-center justify-center gap-3 w-32 h-28 sm:w-40 sm:h-36 rounded-[14px] cursor-pointer relative overflow-hidden border border-line shadow-card group-hover:border-line2 group-hover:shadow-[0_28px_52px_-26px_rgba(16,32,48,.48),0_2px_6px_rgba(16,32,48,.08)] transition-[border-color,box-shadow] duration-[400ms]"
        style={{
          background: "linear-gradient(168deg, #FFFFFF 0%, #F4F7FA 62%, #E9EFF4 100%)",
        }}
      >
        {/* Top fade */}
        <div className="absolute left-0 right-0 top-0 h-[52%] bg-gradient-to-b from-white/95 to-transparent pointer-events-none" />

        {/* Logo — fixed-size container prevents layout shifts during loading */}
        <div className="relative z-[3] brand-logo-layer w-24 h-[66px] grid place-items-center">
          <BrandLogo slug={slug} name={name} logoUrl={logoUrl} eager={eager} />
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
