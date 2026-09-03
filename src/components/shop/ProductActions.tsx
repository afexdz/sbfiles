"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatEUR } from "@/lib/format";
import type { ShopVariant } from "@/lib/types";

interface Props {
  variants: ShopVariant[];
}

export function ProductActions({ variants }: Props) {
  const sorted = [...variants].sort((a, b) => a.ordre - b.ordre);
  const [activeSlug, setActiveSlug] = useState(sorted[0]?.slug ?? "");
  const activeVariant = sorted.find((v) => v.slug === activeSlug) ?? sorted[0];

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
        className="w-full justify-center !h-12 !text-[15px]"
      >
        Ajouter au panier
      </Button>
    </div>
  );
}
