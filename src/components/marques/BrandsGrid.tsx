"use client";

import { useState, useEffect, useRef } from "react";
import { BrandCard } from "@/components/BrandCard";
import type { Brand, Category } from "@/lib/types";

interface Props {
  brands:     Brand[];
  categories: Category[];
}

export function BrandsGrid({ brands, categories }: Props) {
  const [search, setSearch] = useState("");
  const [catId,  setCatId]  = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const q = search.trim().toLowerCase();
  const filtered = brands.filter((b) => {
    const matchSearch = !q || b.nom.toLowerCase().includes(q) || b.slug.includes(q);
    const matchCat    = !catId || b.category_id === catId;
    return matchSearch && matchCat;
  });

  // Stagger reveal via IntersectionObserver
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll<HTMLElement>(".brand-item"));
    items.forEach((el) => el.classList.remove("is-visible"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered.length, catId, q]);

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher une marque…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-card border border-line rounded-lg px-4 py-2.5 text-[14px] placeholder:text-mute focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-[border-color,box-shadow] duration-[180ms]"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <Chip label="Toutes" active={!catId} onClick={() => setCatId(null)} />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.nom_fr}
            active={catId === cat.id}
            onClick={() => setCatId(catId === cat.id ? null : cat.id)}
          />
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-mute text-[14.5px] py-12 text-center">
          Aucune marque ne correspond à votre recherche.
        </p>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4"
        >
          {filtered.map((brand, i) => (
            <div
              key={brand.id}
              className="brand-item"
              style={{ "--delay": `${Math.min(i * 25, 400)}ms` } as React.CSSProperties}
            >
              <BrandCard
                name={brand.nom}
                slug={brand.slug}
                logoUrl={brand.logo_url}
                compact
              />
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 text-mute text-[13px]">
        {filtered.length} marque{filtered.length !== 1 ? "s" : ""}
        {(q || catId) ? " trouvée" + (filtered.length !== 1 ? "s" : "") : " au catalogue"}
      </p>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition-[background,border-color,color] duration-[150ms] cursor-pointer ${
        active
          ? "bg-ember text-white border-ember"
          : "bg-card text-ink2 border-line hover:border-ember-ink hover:text-ember-ink"
      }`}
    >
      {label}
    </button>
  );
}
