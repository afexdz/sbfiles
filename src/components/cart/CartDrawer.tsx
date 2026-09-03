"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart";
import { formatEUR } from "@/lib/format";

export function CartDrawer() {
  const {
    isOpen, closeCart,
    items, removeItem, updateQte,
    subtotal, count,
  } = useCart();

  /* ---- Enter / exit animation ---- */
  const [shouldRender, setShouldRender] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      /* Two rAFs: first puts element in DOM, second triggers transition */
      const r = requestAnimationFrame(() =>
        requestAnimationFrame(() => setPanelVisible(true))
      );
      return () => cancelAnimationFrame(r);
    } else {
      setPanelVisible(false);
      const t = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ---- Refs ---- */
  const drawerRef      = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef   = useRef<HTMLElement | null>(null);

  /* ---- Focus management ---- */
  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => closeButtonRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus();
      prevFocusRef.current = null;
    }
  }, [isOpen]);

  /* ---- Body scroll lock ---- */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* ---- Escape key + focus trap ---- */
  useEffect(() => {
    if (!isOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { closeCart(); return; }
      if (e.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const nodes = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
      );
      if (!nodes.length) return;

      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  if (!shouldRender) return null;

  const TRANS = "transition-[opacity,transform] duration-[280ms] [transition-timing-function:cubic-bezier(.2,.8,.3,1)]";

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={closeCart}
        className={`fixed inset-0 z-[69] bg-black/40 ${TRANS} ${
          panelVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
        className={`fixed right-0 top-0 bottom-0 z-[70] flex flex-col w-full sm:w-[420px] bg-card border-l border-line shadow-card-lg ${TRANS} ${
          panelVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between px-5 h-[60px] border-b border-line flex-none">
          <h2 className="font-display text-[20px] leading-none">
            Panier
            {count > 0 && (
              <span className="ml-2 text-[13px] text-mute font-normal font-sans">
                {count} article{count > 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            aria-label="Fermer le panier"
            className="w-9 h-9 grid place-items-center rounded border border-transparent hover:border-line2 hover:shadow-card transition-[border-color,box-shadow] duration-[150ms] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ---- Body ---- */}
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Scrollable item list */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-5">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>

            {/* Fixed footer */}
            <div className="flex-none border-t border-line px-5 pt-4 pb-5 flex flex-col gap-3 bg-card">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] font-semibold">Sous-total</span>
                <span className="font-display text-[1.4rem] leading-none tabular-nums">
                  {formatEUR(subtotal)}
                </span>
              </div>
              <p className="text-[11.5px] text-mute">
                Hors taxes · Livraison calculée à la commande
              </p>
              <Link
                href="/commande"
                onClick={closeCart}
                className="w-full h-12 bg-ember text-white rounded grid place-items-center font-semibold text-[15px] hover:bg-ember-ink transition-colors duration-[180ms]"
              >
                Passer commande
              </Link>
              <button
                onClick={closeCart}
                className="text-center text-[12.5px] text-mute hover:text-ink transition-colors duration-[150ms] py-0.5 cursor-pointer"
              >
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---- Empty state ---- */
function EmptyState() {
  const { closeCart } = useCart();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-soft border border-line grid place-items-center">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="text-mute">
          <path d="M3 4h2l2.4 11h9.8l2.2-8H6.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9"  cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      </div>
      <div>
        <p className="font-display text-[18px] mb-1">Panier vide</p>
        <p className="text-mute text-[14px]">Ajoutez du matériel depuis la boutique.</p>
      </div>
      <Link
        href="/boutique"
        onClick={closeCart}
        className="px-5 py-2.5 bg-ember text-white rounded font-semibold text-[14px] hover:bg-ember-ink transition-colors duration-[180ms]"
      >
        Découvrir la boutique
      </Link>
    </div>
  );
}

/* ---- Single cart item row ---- */
function CartItemRow({ item }: { item: CartItem }) {
  const { updateQte, removeItem } = useCart();

  return (
    <div className="flex gap-3 min-w-0">
      {/* Thumbnail 64×64 */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-soft border border-line flex-none">
        {item.imageUrl ? (
          /* Using <img> intentionally — thumbnail is small, local, no optimization needed */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.nom}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-mute">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-medium leading-tight truncate">{item.nom}</p>
            <span className="inline-block mt-0.5 text-[11px] font-semibold px-2 py-[3px] rounded-full bg-soft border border-line text-ink2">
              {item.variante}
            </span>
          </div>
          {/* Delete */}
          <button
            onClick={() => removeItem(item.variantId)}
            aria-label={`Supprimer ${item.nom} ${item.variante}`}
            className="flex-none w-7 h-7 grid place-items-center rounded text-mute hover:text-ember-ink hover:bg-ember-soft transition-colors duration-[150ms] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v6M14 11v6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Qty − / + (min 1) */}
          <div className="flex items-center border border-line rounded text-[13px]">
            <button
              onClick={() => updateQte(item.variantId, Math.max(1, item.qte - 1))}
              aria-label="Diminuer la quantité"
              disabled={item.qte <= 1}
              className="w-8 h-8 grid place-items-center text-ink2 hover:bg-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[100ms] cursor-pointer"
            >
              −
            </button>
            <span className="w-8 text-center tabular-nums select-none">{item.qte}</span>
            <button
              onClick={() => updateQte(item.variantId, item.qte + 1)}
              aria-label="Augmenter la quantité"
              className="w-8 h-8 grid place-items-center text-ink2 hover:bg-soft transition-colors duration-[100ms] cursor-pointer"
            >
              +
            </button>
          </div>
          {/* Line total */}
          <span className="text-[14px] font-semibold tabular-nums">
            {formatEUR(item.prix_eur * item.qte)}
          </span>
        </div>
      </div>
    </div>
  );
}
