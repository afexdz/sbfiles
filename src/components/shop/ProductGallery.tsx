"use client";

import { useState } from "react";
import Image from "next/image";
import type { ShopImage } from "@/lib/types";

interface Props {
  images: ShopImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-xl bg-soft border border-line grid place-items-center text-mute text-[14px]">
        Aucune image disponible
      </div>
    );
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-soft group">
        <Image
          src={images[active].url}
          alt={images[active].alt ?? productName}
          fill
          className="object-cover transition-opacity duration-[200ms]"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={active === 0}
        />

        {images.length > 1 && (
          <>
            <button
              aria-label="Image précédente"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-line grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms] hover:bg-card cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              aria-label="Image suivante"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-line grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms] hover:bg-card cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Image ${i + 1}`}
                onClick={() => setActive(i)}
                className={`w-1.5 h-1.5 rounded-full transition-[background,width] duration-[150ms] cursor-pointer ${
                  active === i ? "bg-white w-4" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img.id}
              aria-label={img.alt ?? `Image ${i + 1}`}
              aria-pressed={active === i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 flex-none cursor-pointer transition-[border-color] duration-[150ms] ${
                active === i ? "border-ember" : "border-line hover:border-line2"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `Image ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
