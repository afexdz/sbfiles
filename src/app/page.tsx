import { createClient } from "../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { Hero }         from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { TuningTypes }  from "@/components/home/TuningTypes";
import { Button }       from "@/components/ui/Button";
import { fileSlug }     from "@/lib/logo-utils";
import { preload }      from "react-dom";
import type { Category, Brand, TuningType } from "@/lib/types";

/* Safe wrapper — returns [] on Supabase error or missing env vars */
async function safeSelect<T>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  try {
    const { data } = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

const WRAP = "max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)]";

export default async function Home() {
  const supabase = await createClient().catch(() => null);

  const [categories, brands, tuningTypes] = await Promise.all([
    supabase
      ? safeSelect<Category>(supabase.from("categories").select("*").order("ordre"))
      : Promise.resolve<Category[]>([]),
    supabase
      ? safeSelect<Brand>(supabase.from("brands").select("*").order("ordre"))
      : Promise.resolve<Brand[]>([]),
    supabase
      ? safeSelect<TuningType>(supabase.from("tuning_types").select("*").order("ordre"))
      : Promise.resolve<TuningType[]>([]),
  ]);

  // Preload the first 4 marquee logos so they're fetched before the JS runs
  const HIDDEN = new Set(["tesla"]);
  brands.filter((b) => !HIDDEN.has(b.slug)).slice(0, 4).forEach((b) => {
    preload(`/logos/${fileSlug(b.slug)}.svg`, { as: "image", type: "image/svg+xml" });
  });

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* ---- Hero ---- */}
        <Hero brands={brands} />

        {/* ---- Catégories ---- */}
        <section id="categories" className="py-8 sm:py-12 lg:py-16">
          <div className={WRAP}>
            <SectionHead
              title="Choisis ton type de véhicule"
              sub="Voiture, deux-roues, poids lourd, agricole, engins et loisirs."
              subLink={{ label: "Voir toutes les marques →", href: "/marques" }}
            />
            <CategoryGrid categories={categories} />
          </div>
        </section>

        {/* ---- Marques ---- */}
        <section id="marques" className="pt-8 sm:pt-12 lg:pt-16">
          <div className={WRAP}>
            <SectionHead
              title="Les marques couvertes"
              sub="Plus de 90 constructeurs au catalogue."
              link={{ label: "Tout voir →", href: "/marques" }}
              mb="mb-8 sm:mb-12 lg:mb-16"
            />
          </div>
          <BrandMarquee brands={brands} />
        </section>

        {/* ---- Types de tuning ---- */}
        <section id="types" className="py-8 sm:py-12 lg:py-16">
          <div className={WRAP}>
            <SectionHead
              title="Types de tuning"
              sub="Chaque fichier est préparé pour un calculateur précis, jamais un patch générique."
            />
            <TuningTypes types={tuningTypes} />
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className={WRAP}>
            <div className="flex items-center gap-7 flex-wrap rounded-[10px] px-[clamp(26px,4.5vw,48px)] py-[clamp(26px,4.5vw,48px)] shadow-card-lg"
              style={{
                background: "linear-gradient(120deg, #12202B, #1B3040)",
                color: "#fff",
              }}
            >
              <div>
                <h2 className="font-display text-[clamp(26px,3.6vw,40px)] max-w-[17ch]">
                  Ton moteur n&apos;est pas au catalogue ?
                </h2>
                <p className="mt-[10px] text-[15px] max-w-[38ch]" style={{ color: "#A9BCCA" }}>
                  Envoie le code moteur et le calculateur. On te répond sous 24 h.
                </p>
              </div>
              <div className="ml-auto flex gap-[10px] flex-wrap">
                <Button variant="solid">Demander un fichier</Button>
                <button className="border border-white/30 bg-transparent text-white px-[15px] py-[9px] rounded text-sm cursor-pointer hover:border-white hover:bg-white/[.08] transition-[border-color,background] duration-[180ms]">
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ---- Accent link (animated arrow) ---- */
function AccentLink({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  const text  = label.replace(/\s*→\s*$/, "");
  const arrow = label.includes("→");
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-0.5 text-sm font-bold text-ember-ink underline underline-offset-4 hover:no-underline transition-[text-decoration] duration-[150ms] ${className}`}
    >
      {text}
      {arrow && (
        <span className="inline-block transition-transform duration-150 group-hover:translate-x-[3px]" aria-hidden>
          →
        </span>
      )}
    </a>
  );
}

/* ---- Section heading ---- */
function SectionHead({
  title,
  sub,
  link,
  subLink,
  mb = "mb-[26px]",
}: {
  title:     string;
  sub?:      string;
  link?:     { label: string; href: string };
  subLink?:  { label: string; href: string };
  mb?:       string;
}) {
  return (
    <div className={`flex items-end justify-between gap-5 ${mb} max-[720px]:flex-col max-[720px]:items-start max-[720px]:gap-2`}>
      <div>
        <h2 className="font-display text-[clamp(26px,3.2vw,36px)]">{title}</h2>
        {sub && <p className="text-ink2 text-[14.5px] max-w-[42ch] mt-1">{sub}</p>}
        {subLink && (
          <AccentLink href={subLink.href} label={subLink.label} className="mt-2" />
        )}
      </div>
      {link && (
        <div className="hidden sm:block shrink-0">
          <AccentLink href={link.href} label={link.label} className="whitespace-nowrap" />
        </div>
      )}
    </div>
  );
}
