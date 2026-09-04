"use client";

import { TiltCard, Glare } from "@/components/ui/TiltCard";
import { BrandLogo }       from "@/components/BrandLogo";

interface Props {
  name:          string;
  slug:          string;
  logoUrl?:      string | null;
  onClick?:      () => void;
  eager?:        boolean;
  highPriority?: boolean;
  compact?:      boolean;
}

export function BrandCard({ name, slug, logoUrl, onClick, eager, highPriority, compact }: Props) {
  const clickProps = onClick
    ? { onClick, role: "button" as const, tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && onClick() }
    : {};

  if (compact) {
    return (
      <TiltCard>
        <div
          {...clickProps}
          className="flex flex-col items-center justify-center gap-1.5 aspect-square p-2 sm:p-3 rounded-[10px] cursor-pointer relative overflow-hidden border border-line shadow-card group-hover:border-line2 group-hover:shadow-[0_16px_32px_-16px_rgba(16,32,48,.36)] transition-[border-color,box-shadow] duration-[400ms]"
          style={{ background: "linear-gradient(168deg, #FFFFFF 0%, #F4F7FA 62%, #E9EFF4 100%)" }}
        >
          <div className="absolute left-0 right-0 top-0 h-[52%] bg-gradient-to-b from-white/95 to-transparent pointer-events-none" />
          <div className="relative z-[3] brand-logo-layer flex items-center justify-center flex-1 w-full min-h-0">
            <BrandLogo slug={slug} name={name} logoUrl={logoUrl} eager={eager} highPriority={highPriority} compact />
          </div>
          <span className="text-[11px] sm:text-xs text-ink2 text-center leading-tight w-full relative z-[3] truncate [transform:translateZ(20px)]">
            {name}
          </span>
          <Glare />
        </div>
      </TiltCard>
    );
  }

  return (
    <TiltCard innerClassName="h-full">
      <div
        {...clickProps}
        className="flex flex-col items-center justify-center gap-3 w-36 h-32 sm:w-44 sm:h-40 rounded-[14px] cursor-pointer relative overflow-hidden border border-line shadow-card group-hover:border-line2 group-hover:shadow-[0_28px_52px_-26px_rgba(16,32,48,.48),0_2px_6px_rgba(16,32,48,.08)] transition-[border-color,box-shadow] duration-[400ms]"
        style={{ background: "linear-gradient(168deg, #FFFFFF 0%, #F4F7FA 62%, #E9EFF4 100%)" }}
      >
        <div className="absolute left-0 right-0 top-0 h-[52%] bg-gradient-to-b from-white/95 to-transparent pointer-events-none" />
        <div className="relative z-[3] brand-logo-layer flex items-center justify-center">
          <BrandLogo slug={slug} name={name} logoUrl={logoUrl} eager={eager} highPriority={highPriority} />
        </div>
        <span className="text-sm text-ink2 text-center leading-tight px-2 relative z-[3] [transform:translateZ(20px)]">
          {name}
        </span>
        <Glare />
      </div>
    </TiltCard>
  );
}
