"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  imageUrl?:   string | null;
}

interface CartCtx {
  items:       CartItem[];
  isOpen:      boolean;
  openCart:    () => void;
  closeCart:   () => void;
  toggleCart:  () => void;
  addItem:     (item: Omit<CartItem, "qte">) => void;
  removeItem:  (variantId: string) => void;
  updateQte:   (variantId: string, qte: number) => void;
  subtotal:    number;
  total:       number;
  count:       number;
}

const CartContext = createContext<CartCtx | null>(null);
const LS_KEY = "sbfiles-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,   setItems]   = useState<CartItem[]>([]);
  const [isOpen,  setIsOpen]  = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Hydrate from localStorage after first client render */
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore malformed / quota errors */
    }
  }, []);

  /* Persist on every items change — client only */
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch { /* ignore */ }
  }, [items, mounted]);

  const openCart   = useCallback(() => setIsOpen(true),         []);
  const closeCart  = useCallback(() => setIsOpen(false),        []);
  const toggleCart = useCallback(() => setIsOpen((o) => !o),    []);

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
    setIsOpen(true);
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

  const subtotal = items.reduce((s, i) => s + i.prix_eur * i.qte, 0);
  const count    = items.reduce((s, i) => s + i.qte, 0);

  return (
    <CartContext.Provider
      value={{
        items, isOpen, openCart, closeCart, toggleCart,
        addItem, removeItem, updateQte,
        subtotal, total: subtotal, count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
