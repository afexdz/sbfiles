"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo }    from "@/components/layout/Logo";
import { UserNav } from "@/components/layout/UserNav";
import { useCart } from "@/lib/cart";

const NAV_LINKS = [
  { label: "Catalogue",        href: "/catalogue" },
  { label: "Types de tuning",  href: "/#types" },
  { label: "Marques",          href: "/marques" },
  { label: "Boutique",         href: "/boutique" },
  { label: "Tarifs",           href: "/tarifs" },
  { label: "Aide",             href: "/aide" },
];

const ICON_BTN =
  "relative border border-line2 bg-card w-10 h-10 rounded cursor-pointer grid place-items-center " +
  "hover:border-ink2 hover:shadow-card transition-[border-color,box-shadow] duration-[180ms]";

export function Header() {
  const { count: cartCount, openCart } = useCart();
  const [menuOpen, setMenuOpen]        = useState(false);

  /* Badge "pop" animation when count increases */
  const prevCountRef = useRef(cartCount);
  const [badgePing, setBadgePing] = useState(false);

  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      setBadgePing(true);
      const t = setTimeout(() => setBadgePing(false), 380);
      prevCountRef.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  function toggleMenu() { setMenuOpen((o) => !o); }
  function closeMenu()  { setMenuOpen(false); }

  return (
    <>
      {/* z-50 keeps it above page content; cart drawer is z-[70] */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-[14px] border-b border-line">
        <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] flex items-center gap-3 sm:gap-[26px] h-14 sm:h-16">

          {/* Logo */}
          <div className="min-w-0 flex-shrink">
            <Logo />
          </div>

          {/* Main nav — desktop only (940 px+) */}
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
          <div className="ml-auto flex items-center gap-2 sm:gap-[10px]">
            <UserNav />

            {/* Cart button — opens cart drawer */}
            <button
              id="header-cart-btn"
              aria-label="Ouvrir le panier"
              aria-haspopup="dialog"
              aria-expanded={cartCount > 0}
              className={ICON_BTN}
              onClick={openCart}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M3 4h2l2.4 11h9.8l2.2-8H6.2" />
                <circle cx="9"  cy="19" r="1.6" />
                <circle cx="17" cy="19" r="1.6" />
              </svg>
              {cartCount > 0 && (
                <span
                  className={`absolute -top-[6px] -right-[6px] bg-ember text-white text-[11px] min-w-[18px] h-[18px] rounded-full grid place-items-center font-semibold px-[3px] transition-transform duration-[200ms] ${
                    badgePing ? "scale-[1.4]" : "scale-100"
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Burger — hidden at 940 px+ */}
            <button
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className={`${ICON_BTN} [min-width:940px]:hidden`}
              onClick={toggleMenu}
            >
              {menuOpen ? <X size={19} aria-hidden /> : <Menu size={19} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <>
          <div
            className="[min-width:940px]:hidden fixed inset-0 z-[59] bg-black/30 backdrop-blur-[2px]"
            aria-hidden
            onClick={closeMenu}
          />
          <nav
            id="mobile-nav"
            className="[min-width:940px]:hidden fixed inset-x-0 top-14 sm:top-16 z-60 bg-card border-b border-line shadow-card-lg"
          >
            <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)]">
              <div className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="py-3.5 text-[15px] text-ink border-b border-line last:border-b-0 hover:text-ember-ink transition-colors duration-[180ms]"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="py-4 flex flex-col gap-2">
                <a
                  href="/connexion"
                  className="block w-full text-center border border-line rounded px-4 py-2 text-sm font-medium text-ink hover:bg-soft transition-colors duration-[180ms]"
                  onClick={closeMenu}
                >
                  Se connecter
                </a>
                <a
                  href="/inscription"
                  className="block w-full text-center bg-ember text-white rounded px-4 py-2 text-sm font-semibold hover:bg-ember-ink transition-colors duration-[180ms]"
                  onClick={closeMenu}
                >
                  Créer un compte
                </a>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
