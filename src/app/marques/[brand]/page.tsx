import { notFound }    from "next/navigation";
import Link             from "next/link";
import type { Metadata } from "next";
import { createClient } from "../../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { Breadcrumb }   from "@/components/ui/Breadcrumb";
import { BrandLogo }    from "@/components/BrandLogo";
import { TiltCard }     from "@/components/ui/TiltCard";

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { createClient: create } = await import("@supabase/supabase-js");
    const sb = create(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await sb.from("brands").select("slug");
    return (data ?? []).map((b: { slug: string }) => ({ brand: b.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("brands").select("nom").eq("slug", brandSlug).single();
    if (data) return { title: `${data.nom} — SBFiles` };
  } catch { /* ignore */ }
  return { title: "Marque — SBFiles" };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandSlug } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", brandSlug)
    .single();

  if (!brand) notFound();

  const { data: rawModels } = await supabase
    .from("models")
    .select("*, periods(id, engines(id))")
    .eq("brand_id", brand.id)
    .order("ordre");

  type RawModel = { id: string; slug: string; nom: string; brand_id: string; ordre: number; periods: { id: string; engines: { id: string }[] }[] | null };
  const models = ((rawModels ?? []) as unknown as RawModel[]).map((m) => ({
    ...m,
    engineCount: (m.periods ?? []).flatMap((p) => p.engines ?? []).length,
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] py-8 sm:py-12">
          <Breadcrumb items={[
            { label: "Accueil",  href: "/" },
            { label: "Marques", href: "/marques" },
            { label: brand.nom },
          ]} />

          {/* Brand header */}
          <div className="flex items-center gap-5 mb-8 sm:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-card border border-line shadow-card flex items-center justify-center overflow-hidden shrink-0">
              <BrandLogo slug={brand.slug} name={brand.nom} logoUrl={brand.logo_url} highPriority />
            </div>
            <div>
              <h1 className="font-display text-[clamp(28px,4vw,44px)] leading-tight">{brand.nom}</h1>
              <p className="text-ink2 text-[14.5px] mt-0.5">
                {models.length} modèle{models.length !== 1 ? "s" : ""} au catalogue
              </p>
            </div>
          </div>

          {/* Models grid */}
          {models.length === 0 ? (
            <p className="text-mute py-12 text-center">Aucun modèle disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {models.map((model) => (
                <TiltCard key={model.id as string}>
                  <Link
                    href={`/marques/${brandSlug}/${model.slug}`}
                    className="flex flex-col justify-between p-4 sm:p-5 rounded-[12px] border border-line shadow-card bg-card group-hover:border-line2 group-hover:shadow-[0_16px_32px_-16px_rgba(16,32,48,.32)] transition-[border-color,box-shadow] duration-[400ms] aspect-[4/3] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
                    <span className="font-display text-lg sm:text-xl leading-tight relative z-[1]">
                      {model.nom as string}
                    </span>
                    <span className="text-xs text-mute relative z-[1]">
                      {(model.engineCount as number) > 0
                        ? `${model.engineCount as number} motorisation${(model.engineCount as number) !== 1 ? "s" : ""}`
                        : "Voir les motorisations"}
                    </span>
                  </Link>
                </TiltCard>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
