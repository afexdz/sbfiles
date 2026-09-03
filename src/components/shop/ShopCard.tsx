"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TiltCard, Glare } from "@/components/ui/TiltCard";
import { formatEUR } from "@/lib/format";

export interface ShopCardData {
  productSlug: string;
  variantId:   string;
  variantSlug: string;
  productName: string;
  variantName: string;
  brand:       string;
  prixEur:     number;
  image:       { url: string; alt: string | null } | null;
}

interface Props extends ShopCardData {
  onAddToCart: (variantId: string) => void;
}

export function ShopCard({
  productSlug,
  variantId,
  variantSlug,
  productName,
  variantName,
  brand,
  prixEur,
  image,
  onAddToCart,
}: Props) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAddToCart(variantId);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const isMaster = variantSlug === "master";

  return (
    <TiltCard
      className="w-full"
      innerClassName="flex flex-col rounded-xl overflow-hidden bg-card border border-line shadow-card group-hover:shadow-card-lg group-hover:border-line2 transition-[border-color,box-shadow] duration-[350ms]"
    >
      {/* Image — floats in Z on hover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-soft flex-none shop-card-img">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? productName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-mute text-[13px]">
            Aucune image
          </div>
        )}

        {/* Variant badge */}
        <span
          className={`absolute top-3 right-3 z-10 text-[11px] font-semibold px-2.5 py-[5px] rounded-full ${
            isMaster
              ? "bg-ember text-white"
              : "bg-ink text-white"
          }`}
        >
          {variantName}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 gap-4">
        <div>
          <p className="text-[11px] text-mute uppercase tracking-widest mb-1">{brand}</p>
          <h2 className="font-display text-[18px] sm:text-[20px] leading-tight">{productName}</h2>
        </div>

        <p className="font-display text-[1.65rem] sm:text-[1.85rem] leading-none font-semibold tabular-nums mt-auto">
          {formatEUR(prixEur)}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/boutique/${productSlug}?variante=${variantSlug}`}
            className="text-center text-[13px] text-ember-ink hover:underline py-0.5"
          >
            Voir le détail →
          </Link>
          <button
            onClick={handleAdd}
            className={`w-full h-10 rounded text-[13.5px] font-semibold cursor-pointer transition-[background-color,transform] duration-[180ms] ${
              added
                ? "bg-ok text-white"
                : "bg-ember text-white hover:bg-ember-ink"
            }`}
          >
            {added ? "Ajouté ✓" : "Ajouter au panier"}
          </button>
        </div>
      </div>

      <Glare />
    </TiltCard>
  );
}
