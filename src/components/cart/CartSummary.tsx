"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatEUR } from "@/lib/format";

export function CartSummary() {
  const { items, subtotal, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-soft border border-line grid place-items-center">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="text-mute">
            <path d="M3 4h2l2.4 11h9.8l2.2-8H6.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9"  cy="19" r="1.5" />
            <circle cx="17" cy="19" r="1.5" />
          </svg>
        </div>
        <div>
          <p className="font-display text-[20px] mb-1">Panier vide</p>
          <p className="text-mute text-[14px] max-w-[28ch]">
            Ajoutez des articles depuis la boutique pour passer commande.
          </p>
        </div>
        <Link href="/boutique" className="px-5 py-2.5 bg-ember text-white rounded font-semibold text-[14px] hover:bg-ember-ink transition-colors duration-[180ms]">
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Item list */}
      <div className="flex flex-col divide-y divide-line">
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center gap-4 py-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-soft border border-line flex-none">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.nom} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-mute text-[11px]">—</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-medium leading-tight">{item.nom}</p>
              <span className="inline-block mt-0.5 text-[11px] font-semibold px-2 py-[3px] rounded-full bg-soft border border-line text-ink2">
                {item.variante}
              </span>
            </div>

            <div className="text-right">
              <p className="font-semibold tabular-nums text-[14px]">{formatEUR(item.prix_eur * item.qte)}</p>
              <p className="text-[12px] text-mute">× {item.qte}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="bg-soft border border-line rounded-lg px-5 py-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px]">
            {count} article{count > 1 ? "s" : ""}
          </span>
          <span className="font-display text-[1.5rem] tabular-nums leading-none">
            {formatEUR(subtotal)}
          </span>
        </div>
        <p className="text-[12px] text-mute">Hors taxes · Livraison calculée à la commande</p>
      </div>
    </div>
  );
}
