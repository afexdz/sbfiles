import { BrandCard } from "@/components/BrandCard";
import type { Brand } from "@/lib/types";

interface Props {
  brands: Brand[];
}

export function BrandMarquee({ brands }: Props) {
  if (brands.length === 0) {
    return (
      <p className="text-mute text-[14.5px] py-8 text-center">
        Aucune marque disponible pour l&apos;instant.
      </p>
    );
  }

  const half  = Math.ceil(brands.length / 2);
  const row1  = brands.slice(0, half);
  const row2  = brands.slice(half).length > 0 ? brands.slice(half) : row1;

  return (
    <div className="flex flex-col gap-3">
      <Track brands={[...row1, ...row1]} reverse={false} />
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
