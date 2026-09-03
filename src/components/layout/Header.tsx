"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo }   from "@/components/layout/Logo";

const NAV_LINKS = [
  { label: "Catalogue",        href: "/catalogue" },
  { label: "Types de tuning",  href: "/#types" },
  { label: "Marques",          href: "/#marques" },
  { label: "Tarifs",           href: "/tarifs" },
  { label: "Aide",             href: "/aide" },
];

export function Header() {
  const [cartCount] = useState(0);

  return (
    <header className="sticky top-0 z-60 bg-white/90 backdrop-blur-[14px] border-b border-line">
      <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] flex items-center gap-[26px] h-16">
        {/* Logo */}
        <div className="shrink-0">
          <Logo />
        </div>

        {/* Main nav — hidden under 940 px */}
        <nav className="hidden [min-width:940px]:flex gap-[22px] ml-[10px] text-[14.5px] text-ink2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="py-2 border-b-2 border-transparent hover:text-ember-ink hover:border-ember transition-[color,border-color] duration-[180ms]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-[10px]">
          <Button variant="ghost" className="hidden [min-width:940px]:inline-flex">
            Se connecter
          </Button>
          <Button variant="solid">Créer un compte</Button>

          {/* Cart */}
          <button
            aria-label="Panier"
            className="relative border border-line2 bg-card w-10 h-10 rounded cursor-pointer grid place-items-center hover:border-ink2 hover:shadow-card transition-[border-color,box-shadow] duration-[180ms]"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M3 4h2l2.4 11h9.8l2.2-8H6.2" />
              <circle cx="9"  cy="19" r="1.6" />
              <circle cx="17" cy="19" r="1.6" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-[6px] -right-[6px] bg-ember text-white text-[11px] min-w-[18px] h-[18px] rounded-full grid place-items-center font-semibold px-[3px]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
