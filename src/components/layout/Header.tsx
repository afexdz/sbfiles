"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo }   from "@/components/layout/Logo";

const NAV_LINKS = [
  { label: "Catalogue",        href: "/catalogue" },
  { label: "Types de tuning",  href: "/#types" },
  { label: "Marques",          href: "/#marques" },
  { label: "Tarifs",           href: "/tarifs" },
  { label: "Aide",             href: "/aide" },
];

const ICON_BTN =
  "relative border border-line2 bg-card w-10 h-10 rounded cursor-pointer grid place-items-center " +
  "hover:border-ink2 hover:shadow-card transition-[border-color,box-shadow] duration-[180ms]";

export function Header() {
  const [cartCount]  = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-60 bg-white/90 backdrop-blur-[14px] border-b border-line">
        <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] flex items-center gap-3 sm:gap-[26px] h-14 sm:h-16">

          {/* Logo */}
          <div className="min-w-0 flex-shrink">
            <Logo />
          </div>

          {/* Main nav — desktop only */}
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
            {/* Desktop auth buttons */}
            <Button variant="ghost" className="hidden [min-width:940px]:inline-flex">
              Se connecter
            </Button>
            <Button variant="solid" className="hidden [min-width:940px]:inline-flex">
              Créer un compte
            </Button>

            {/* Cart */}
            <button aria-label="Panier" className={ICON_BTN}>
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

            {/* Burger — mobile only */}
            <button
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              className={`${ICON_BTN} [min-width:940px]:hidden`}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={19} aria-hidden /> : <Menu size={19} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div
          className="[min-width:940px]:hidden fixed inset-x-0 top-14 sm:top-16 z-50 bg-card border-b border-line shadow-card-lg"
          onClick={() => setMenuOpen(false)}
        >
          <nav className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] py-2 flex flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="py-3 text-[15px] text-ink2 border-b border-line last:border-b-0 hover:text-ember-ink transition-colors duration-[180ms]"
              >
                {link.label}
              </a>
            ))}
            <div className="py-4 flex flex-col gap-2">
              <Button variant="ghost" className="w-full justify-center">
                Se connecter
              </Button>
              <Button variant="solid" className="w-full justify-center">
                Créer un compte
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
