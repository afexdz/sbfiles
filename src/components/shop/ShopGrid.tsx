"use client";

import { useCart } from "@/lib/cart";
import { ShopCard, type ShopCardData } from "@/components/shop/ShopCard";

interface Props {
  cards: ShopCardData[];
}

export function ShopGrid({ cards }: Props) {
  const { addItem } = useCart();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <ShopCard
          key={card.variantId}
          {...card}
          onAddToCart={(variantId) =>
            addItem({
              variantId,
              productSlug: card.productSlug,
              nom:         card.productName,
              variante:    card.variantName,
              prix_eur:    card.prixEur,
            })
          }
        />
      ))}
    </div>
  );
}
