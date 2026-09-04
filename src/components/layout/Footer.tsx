import { Logo } from "@/components/layout/Logo";

const FOOTER_NAV = [
  { label: "Catalogue",       href: "/catalogue" },
  { label: "Marques",         href: "/marques" },
  { label: "Types de tuning", href: "/#types" },
  { label: "Boutique",        href: "/boutique" },
  { label: "Tarifs",          href: "/tarifs" },
  { label: "Conditions",      href: "/conditions" },
  { label: "Contact",         href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-line mt-5 py-8 text-mute text-[13.5px] bg-card">
      <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] flex flex-col gap-6 md:flex-row md:justify-between md:items-start">
        {/* Brand */}
        <div>
          <Logo />
          <p className="mt-2">Reprogrammation moteur · Algérie</p>
        </div>

        {/* Nav */}
        <nav className="flex gap-5 flex-wrap items-center">
          {FOOTER_NAV.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-ember-ink transition-colors duration-[180ms]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
