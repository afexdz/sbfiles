import { notFound }    from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "../../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { Breadcrumb }   from "@/components/ui/Breadcrumb";
import { BrandLogo }    from "@/components/BrandLogo";
import { CascadeSelector } from "@/components/catalogue/CascadeSelector";

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
    .select("id, nom, slug, logo_url")
    .eq("slug", brandSlug)
    .single();

  if (!brand) notFound();

  const { data: rawModels } = await supabase
    .from("models")
    .select("id, nom, slug")
    .eq("brand_id", brand.id)
    .order("ordre");

  const models = (rawModels ?? []) as { id: string; nom: string; slug: string }[];

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

          {/* CascadeSelector */}
          {models.length === 0 ? (
            <p className="text-mute py-12 text-center">Aucun modèle disponible pour le moment.</p>
          ) : (
            <CascadeSelector
              brand={{ id: brand.id, nom: brand.nom, slug: brand.slug, logo_url: brand.logo_url }}
              models={models}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
