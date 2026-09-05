import { notFound }    from "next/navigation";
import Link             from "next/link";
import type { Metadata } from "next";
import { createClient } from "../../../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { Breadcrumb }   from "@/components/ui/Breadcrumb";

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { createClient: create } = await import("@supabase/supabase-js");
    const sb = create(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await sb
      .from("models")
      .select("slug, brand:brands(slug)");
    type Row = { slug: string; brand: { slug: string }[] | null };
    return ((data ?? []) as unknown as Row[]).map((m) => ({
      brand: m.brand?.[0]?.slug ?? "",
      model: m.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug } = await params;
  try {
    const supabase = await createClient();
    const { data: brand } = await supabase.from("brands").select("id,nom").eq("slug", brandSlug).single();
    if (!brand) return {};
    const { data: model } = await supabase.from("models").select("nom").eq("slug", modelSlug).eq("brand_id", brand.id).single();
    if (model) return { title: `${brand.nom} ${model.nom} — SBFiles` };
  } catch { /* ignore */ }
  return { title: "Modèle — SBFiles" };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("id,nom,slug")
    .eq("slug", brandSlug)
    .single();
  if (!brand) notFound();

  const { data: model } = await supabase
    .from("models")
    .select("id,nom,slug")
    .eq("slug", modelSlug)
    .eq("brand_id", brand.id)
    .single();
  if (!model) notFound();

  const { data: periods } = await supabase
    .from("periods")
    .select("*")
    .eq("model_id", model.id)
    .order("ordre");

  const list = periods ?? [];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] py-8 sm:py-12">
          <Breadcrumb items={[
            { label: "Accueil",    href: "/" },
            { label: "Marques",   href: "/marques" },
            { label: brand.nom,   href: `/marques/${brandSlug}` },
            { label: model.nom },
          ]} />

          <div className="mb-8">
            <h1 className="font-display text-[clamp(26px,3.5vw,42px)]">
              {brand.nom} <span className="text-mute">{model.nom}</span>
            </h1>
            <p className="text-ink2 text-[14.5px] mt-1">
              {list.length} génération{list.length !== 1 ? "s" : ""}
            </p>
          </div>

          {list.length === 0 ? (
            <p className="text-mute py-12 text-center">Aucune période disponible pour le moment.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line border border-line rounded-[12px] overflow-hidden">
              {list.map((period) => {
                const years =
                  period.annee_debut && period.annee_fin
                    ? `${period.annee_debut} – ${period.annee_fin}`
                    : period.annee_debut
                    ? `depuis ${period.annee_debut}`
                    : period.annee_fin
                    ? `jusqu'à ${period.annee_fin}`
                    : "";
                return (
                  <Link
                    key={period.id}
                    href={`/marques/${brandSlug}/${modelSlug}/${period.id}`}
                    className="flex items-center justify-between px-5 py-4 bg-card hover:bg-soft transition-colors duration-[150ms] group"
                  >
                    <div>
                      <span className="font-medium text-[15px]">{period.label}</span>
                      {years && (
                        <span className="ml-3 text-[13px] text-mute">{years}</span>
                      )}
                    </div>
                    <span className="text-mute group-hover:text-ember-ink transition-colors duration-[150ms]" aria-hidden>›</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
