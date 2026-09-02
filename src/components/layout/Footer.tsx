const FOOTER_NAV = [
  { label: "Catalogue",       href: "/catalogue" },
  { label: "Types de tuning", href: "/#types" },
  { label: "Tarifs",          href: "/tarifs" },
  { label: "Conditions",      href: "/conditions" },
  { label: "Contact",         href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-line mt-5 py-8 text-mute text-[13.5px] bg-card">
      <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] flex justify-between gap-5 flex-wrap">
        {/* Brand */}
        <div>
          <a href="/" className="flex items-center gap-2 font-display font-bold text-[20px] text-ink">
            <span className="bg-ember text-white px-2 py-[3px] rounded-[3px] text-[17px] tracking-[0.03em]">
              SB
            </span>
            FILES
          </a>
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
