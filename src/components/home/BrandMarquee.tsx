import { BrandCard } from "@/components/BrandCard";
import type { Brand } from "@/lib/types";

interface Props {
  brands: Brand[];
}

// Brands that must not appear in the marquee
const HIDDEN_SLUGS = new Set(["tesla"]);

export function BrandMarquee({ brands }: Props) {
  const visible = brands.filter((b) => !HIDDEN_SLUGS.has(b.slug));

  if (visible.length === 0) {
    return (
      <p className="text-mute text-[14.5px] py-8 text-center">
        Aucune marque disponible pour l&apos;instant.
      </p>
    );
  }

  const half = Math.ceil(visible.length / 2);
  const row1 = visible.slice(0, half);
  const row2 = visible.slice(half).length > 0 ? visible.slice(half) : row1;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1 → slides left */}
      <Track brands={[...row1, ...row1]} reverse={false} />
      {/* Row 2 → slides right (opposite direction) */}
      <Track brands={[...row2, ...row2]} reverse={true} />
    </div>
  );
}

function Track({ brands, reverse }: { brands: Brand[]; reverse: boolean }) {
  return (
    <div className="marquee">
      <div className={`marquee-track${reverse ? " rev" : ""}`}>
        {brands.map((brand, i) => (
          <BrandCard
            key={`${brand.id}-${i}`}
            name={brand.nom}
            slug={brand.slug}
            logoUrl={brand.logo_url}
          />
        ))}
      </div>
    </div>
  );
}
