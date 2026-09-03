"use client";

import { useState } from "react";
import { Button }   from "@/components/ui/Button";
import { formatEUR } from "@/lib/format";
import { useCart }  from "@/lib/cart";
import type { ShopVariant } from "@/lib/types";

interface Props {
  variants:        ShopVariant[];
  defaultVariant?: string;
  productSlug:     string;
  productName:     string;
  imageUrl?:       string | null;
}

export function ProductActions({ variants, defaultVariant, productSlug, productName, imageUrl }: Props) {
  const sorted = [...variants].sort((a, b) => a.ordre - b.ordre);
  const initialSlug = defaultVariant && sorted.some((v) => v.slug === defaultVariant)
    ? defaultVariant
    : sorted[0]?.slug ?? "";

  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [added, setAdded]           = useState(false);

  const activeVariant = sorted.find((v) => v.slug === activeSlug) ?? sorted[0];
  const { addItem }   = useCart();

  function handleAdd() {
    if (!activeVariant) return;
    addItem({
      variantId:   activeVariant.id,
      productSlug,
      nom:         productName,
      variante:    activeVariant.nom,
      prix_eur:    activeVariant.prix_eur,
      imageUrl:    imageUrl ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Variant selector */}
      {sorted.length > 1 && (
        <div>
          <p className="text-[12px] text-mute uppercase tracking-wide mb-2">Version</p>
          <div className="flex flex-wrap gap-2">
            {sorted.map((v) => (
              <Button
                key={v.slug}
                variant="stage"
                pressed={activeSlug === v.slug}
                onClick={() => setActiveSlug(v.slug)}
              >
                {v.nom}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Slave info box */}
      {activeSlug === "slave" && (
        <div className="rounded-lg bg-ember-soft border border-ember/20 px-4 py-3 text-[13.5px] text-ink2">
          <p className="font-semibold text-ink mb-1">Version Slave</p>
          <p>
            La version Slave est un appareil de lecture uniquement, conçu pour être couplé à un
            Master. Elle ne peut pas créer ni modifier de fichiers — idéale pour les garagistes
            qui travaillent avec un préparateur Master.
          </p>
        </div>
      )}

      {/* Price */}
      {activeVariant && (
        <div>
          <p className="font-display text-[2.2rem] sm:text-[2.6rem] leading-none font-semibold tabular-nums">
            {formatEUR(activeVariant.prix_eur)}
          </p>
          <p className="text-[12px] text-mute mt-1">TTC · Livraison incluse</p>
        </div>
      )}

      {/* CTA */}
      <Button
        variant="solid"
        onClick={handleAdd}
        className={`w-full justify-center !h-12 !text-[15px] transition-colors ${
          added ? "!bg-ok" : ""
        }`}
      >
        {added ? "Ajouté ✓" : "Ajouter au panier"}
      </Button>
    </div>
  );
}
