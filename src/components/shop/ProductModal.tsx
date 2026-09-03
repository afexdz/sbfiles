"use client";

import {
  useCallback, useEffect, useId, useRef, useState,
} from "react";
import Link from "next/link";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { Button }         from "@/components/ui/Button";
import { useCart }        from "@/lib/cart";
import { formatEUR }      from "@/lib/format";
import type { ShopVariant, ShopImage, ShopFeature } from "@/lib/types";

interface Props {
  productSlug:    string;
  productName:    string;
  brand:          string;
  description:    string | null;
  variants:       ShopVariant[];
  images:         ShopImage[];
  features:       ShopFeature[];
  defaultVariant: string;
  onClose:        () => void;
}

export function ProductModal({
  productSlug, productName, brand, description,
  variants, images, features, defaultVariant, onClose,
}: Props) {
  const titleId = useId();

  const sorted    = [...variants].sort((a, b) => a.ordre - b.ordre);
  const sortedImg = [...images].sort((a, b) => a.ordre - b.ordre);
  const sortedFt  = [...features].sort((a, b) => a.ordre - b.ordre);

  const initial = sorted.some((v) => v.slug === defaultVariant)
    ? defaultVariant
    : (sorted[0]?.slug ?? "");

  const [activeSlug, setActiveSlug] = useState(initial);
  const activeVariant = sorted.find((v) => v.slug === activeSlug) ?? sorted[0];

  const [show,    setShow]    = useState(false);
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [added,   setAdded]   = useState(false);

  const cardRef    = useRef<HTMLDivElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);
  const reducedRef = useRef(false);

  const { addItem } = useCart();

  // Check prefers-reduced-motion once on mount
  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Trigger entry animation after two rAFs so initial-hidden inline style takes effect
  useEffect(() => {
    const r = requestAnimationFrame(() =>
      requestAnimationFrame(() => setShow(true))
    );
    return () => cancelAnimationFrame(r);
  }, []);

  // Allow tilt only after entry animation is fully played
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setEntered(true), 340);
    return () => clearTimeout(t);
  }, [show]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Focus management: focus close button on open, restore previous focus on close
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      prev?.focus();
    };
  }, []);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  // Stable ref so Escape handler always calls the latest handleClose
  const handleCloseRef = useRef(handleClose);
  useEffect(() => { handleCloseRef.current = handleClose; }, [handleClose]);

  // Escape key + Tab focus trap
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { handleCloseRef.current(); return; }
      if (e.key !== "Tab") return;
      const card = cardRef.current;
      if (!card) return;
      const nodes = Array.from(
        card.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last  = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Cursor tilt ±4deg — desktop only, disabled when reduced-motion or viewport < 1024px
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!entered || reducedRef.current || window.innerWidth < 1024) return;
      const card = cardRef.current;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transition = "transform 80ms linear";
      card.style.transform  = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    },
    [entered]
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "transform 400ms cubic-bezier(.2,.85,.3,1)";
    card.style.transform  = "";
  }, []);

  function handleAdd() {
    if (!activeVariant) return;
    addItem({
      variantId:   activeVariant.id,
      productSlug,
      nom:         productName,
      variante:    activeVariant.nom,
      prix_eur:    activeVariant.prix_eur,
      imageUrl:    sortedImg[0]?.url ?? null,
    });
    setAdded(true);
    setTimeout(() => handleClose(), 1500);
  }

  const animClass = exiting ? "modal-exit" : show ? "modal-enter" : "";

  return (
    <>
      {/* Overlay — fades in/out independently */}
      <div
        className="fixed inset-0 z-[80] cursor-default"
        aria-hidden="true"
        onClick={handleClose}
        style={{
          backgroundColor:    "rgba(10,16,22,.55)",
          backdropFilter:     "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
          opacity:    show && !exiting ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      />

      {/* Centering wrapper — pointer-events-none so clicks pass through to overlay */}
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        {/* Perspective context for 3D entry + tilt */}
        <div style={{ perspective: "1200px" }}>
          {/* Dialog panel */}
          <div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative bg-card border border-line rounded-2xl overflow-y-auto pointer-events-auto ${animClass}`}
            style={{
              width:          "min(920px, 92vw)",
              maxHeight:      "min(88vh, 760px)",
              boxShadow:      "0 40px 80px -32px rgba(16,32,48,.6)",
              transformStyle: "preserve-3d",
              willChange:     "transform, opacity",
              // Start hidden so the first frame never flashes before the animation class fires
              ...(show ? {} : { opacity: 0, transform: "translateY(24px) scale(.94) rotateX(8deg)" }),
            }}
          >
            {/* Close × */}
            <button
              ref={closeRef}
              onClick={handleClose}
              aria-label="Fermer la fiche produit"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-soft border border-line grid place-items-center hover:border-line2 hover:shadow-card transition-[border-color,box-shadow] duration-[150ms] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Two-column layout — stacks below 820px viewport */}
            <div className="grid grid-cols-1 [min-width:820px]:grid-cols-2">

              {/* Left — gallery */}
              <div className="p-5 sm:p-6 border-b border-line [min-width:820px]:border-b-0 [min-width:820px]:border-r">
                <ProductGallery images={sortedImg} productName={productName} />
              </div>

              {/* Right — info */}
              <div className="p-5 sm:p-6 flex flex-col gap-4">

                {/* Brand + title */}
                <div>
                  <p className="text-[11px] text-mute uppercase tracking-widest mb-1.5">{brand}</p>
                  <h2
                    id={titleId}
                    className="font-display text-[clamp(22px,3vw,30px)] leading-none"
                  >
                    {productName}
                  </h2>
                </div>

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

                {/* Price */}
                {activeVariant && (
                  <div>
                    <p className="font-display text-[2rem] sm:text-[2.4rem] leading-none font-semibold tabular-nums">
                      {formatEUR(activeVariant.prix_eur)}
                    </p>
                    <p className="text-[12px] text-mute mt-1">TTC · Livraison incluse</p>
                  </div>
                )}

                {/* Slave info box */}
                {activeSlug === "slave" && (
                  <div className="rounded-lg bg-ember-soft border border-ember/20 px-4 py-3 text-[13.5px] text-ink2">
                    <p className="font-semibold text-ink mb-1">Version Slave</p>
                    <p>
                      La version Slave est un appareil de lecture uniquement, conçu pour être couplé
                      à un Master. Elle ne peut pas créer ni modifier de fichiers.
                    </p>
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

                {/* Features checklist */}
                {sortedFt.length > 0 && (
                  <ul className="flex flex-col gap-2.5 border-t border-line pt-4">
                    {sortedFt.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 text-[14px]">
                        <svg
                          viewBox="0 0 18 18"
                          width="18"
                          height="18"
                          fill="none"
                          aria-hidden
                          className="flex-none text-ok"
                        >
                          <circle cx="9" cy="9" r="8.5" stroke="currentColor" strokeWidth="1" />
                          <path
                            d="M5.5 9l2.5 2.5L12.5 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {f.label}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Description */}
                {description && (
                  <p className="text-[14px] text-ink2 leading-relaxed border-t border-line pt-4">
                    {description}
                  </p>
                )}

                {/* SEO link — opens dedicated product page */}
                <Link
                  href={`/boutique/${productSlug}?variante=${activeSlug}`}
                  className="text-[13px] text-ember-ink hover:underline mt-auto pt-2 inline-block"
                  onClick={handleClose}
                >
                  Voir la fiche complète →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
