"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  variantId:   string;
  productSlug: string;
  nom:         string;
  variante:    string;
  prix_eur:    number;
  qte:         number;
}

interface CartCtx {
  items:      CartItem[];
  addItem:    (item: Omit<CartItem, "qte">) => void;
  removeItem: (variantId: string) => void;
  updateQte:  (variantId: string, qte: number) => void;
  total:      number;
  count:      number;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "qte">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, qte: i.qte + 1 } : i
        );
      }
      return [...prev, { ...item, qte: 1 }];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQte = useCallback((variantId: string, qte: number) => {
    if (qte <= 0) {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.variantId === variantId ? { ...i, qte } : i))
      );
    }
  }, []);

  const total = items.reduce((s, i) => s + i.prix_eur * i.qte, 0);
  const count = items.reduce((s, i) => s + i.qte, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQte, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
