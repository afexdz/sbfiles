"use client";

import { TiltCard, Glare } from "@/components/ui/TiltCard";
import { CATEGORY_ICONS } from "@/components/icons/VehicleIcons";

interface Props {
  slug: string;
  name: string;
  count: string;
  color: string;
  icon: string;
  onClick?: () => void;
}

export function CategoryCard({ slug: _slug, name, count, color, icon, onClick }: Props) {
  const Icon = CATEGORY_ICONS[icon];

  return (
    <TiltCard>
      <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        className="cursor-pointer rounded-[14px] overflow-hidden bg-card border border-line shadow-card group-hover:shadow-[0_30px_60px_-28px_rgba(16,32,48,.5),0_2px_6px_rgba(16,32,48,.08)] transition-shadow duration-[400ms]"
      >
        {/* Colored top section */}
        <div
          className="h-[186px] grid place-items-center relative overflow-hidden"
          style={{
            background: `linear-gradient(155deg, ${color}, color-mix(in srgb, ${color} 62%, #000))`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Ring */}
          <div
            className="absolute w-[230px] h-[230px] rounded-full border border-white/20"
            style={{ transform: "translateZ(8px)" }}
          />
          {/* Halo */}
          <div
            className="absolute w-[172px] h-[172px] rounded-full halo-layer"
            style={{
              background:
                "radial-gradient(circle at 34% 28%, rgba(255,255,255,.38), rgba(255,255,255,.06) 58%, transparent 70%)",
            }}
          />
          {/* Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,.18), transparent 42%, rgba(0,0,0,.22))",
            }}
          />
          {/* Icon */}
          {Icon && (
            <div className="relative z-[3] ico-layer w-[104px] h-[104px]">
              <Icon
                className="w-full h-full stroke-white"
                strokeWidth="1.25"
              />
            </div>
          )}
          {/* Glare */}
          <Glare />
        </div>

        {/* Bottom label */}
        <div className="px-[18px] py-4 flex items-baseline justify-between gap-2 bg-card relative z-[5]">
          <b className="font-display text-[22px] font-semibold">{name}</b>
          <i className="not-italic text-[12.5px] text-mute">{count}</i>
        </div>
      </div>
    </TiltCard>
  );
}
