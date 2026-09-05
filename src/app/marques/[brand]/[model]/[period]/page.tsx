import { notFound }    from "next/navigation";
import Link             from "next/link";
import type { Metadata } from "next";
import { createClient } from "../../../../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { Breadcrumb }   from "@/components/ui/Breadcrumb";
import type { Engine }  from "@/lib/types";

export const dynamicParams = true;
export async function generateStaticParams() { return []; }

const FUEL_LABEL: Record<string, string> = {
  essence: "Essence",
  diesel:  "Diesel",
  hybride: "Hybride",
};
const FUEL_BADGE: Record<string, string> = {
  essence: "bg-[#FFF7ED] text-[#C2410C]",
  diesel:  "bg-[#EFF6FF] text-[#1D4ED8]",
  hybride: "bg-[#F0FDF4] text-[#15803D]",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; period: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug, period: periodId } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("periods")
      .select("label, model:models(nom, brand:brands(nom))")
      .eq("id", periodId)
      .single();
    if (data) {
      type Nested = { nom: string; brand: { nom: string }[] };
      const model = (Array.isArray(data.model) ? data.model[0] : data.model) as Nested | null;
      const brandNom = model?.brand?.[0]?.nom ?? brandSlug;
      return { title: `${brandNom} ${model?.nom ?? modelSlug} ${data.label} — SBFiles` };
    }
  } catch { /* ignore */ }
  return { title: "Motorisations — SBFiles" };
}

export default async function PeriodPage({
  params,
}: {
  params: Promise<{ brand: string; model: string; period: string }>;
}) {
  const { brand: brandSlug, model: modelSlug, period: periodId } = await params;
  const supabase = await createClient();

  const { data: period } = await supabase
    .from("periods")
    .select(`
      *,
      model:models!inner(
        id, nom, slug,
        brand:brands!inner(id, nom, slug)
      )
    `)
    .eq("id", periodId)
    .single();

  if (!period) notFound();

  const model = period.model as { id: string; nom: string; slug: string; brand: { id: string; nom: string; slug: string } };
  const brand = model.brand;

  /* Validate the brand/model slugs match */
  if (brand.slug !== brandSlug || model.slug !== modelSlug) notFound();

  const { data: engines } = await supabase
    .from("engines")
    .select("*")
    .eq("period_id", periodId)
    .order("nom");

  const list: Engine[] = engines ?? [];

  const years =
    period.annee_debut && period.annee_fin
      ? `${period.annee_debut} – ${period.annee_fin}`
      : period.annee_debut
      ? `depuis ${period.annee_debut}`
      : "";

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] py-8 sm:py-12">
          <Breadcrumb items={[
            { label: "Accueil",      href: "/" },
            { label: "Marques",     href: "/marques" },
            { label: brand.nom,     href: `/marques/${brandSlug}` },
            { label: model.nom,     href: `/marques/${brandSlug}/${modelSlug}` },
            { label: period.label },
          ]} />

          <div className="mb-8">
            <h1 className="font-display text-[clamp(24px,3.5vw,40px)]">
              {brand.nom} {model.nom}
              <span className="text-mute"> · {period.label}</span>
            </h1>
            {years && <p className="text-ink2 text-[14.5px] mt-1">{years}</p>}
            <p className="text-mute text-[13.5px] mt-0.5">
              {list.length} motorisation{list.length !== 1 ? "s" : ""}
            </p>
          </div>

          {list.length === 0 ? (
            <p className="text-mute py-12 text-center">Aucune motorisation disponible.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block border border-line rounded-[12px] overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-soft border-b border-line text-ink2 text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3">Motorisation</th>
                      <th className="text-left px-4 py-3">Carburant</th>
                      <th className="text-right px-4 py-3">Puissance</th>
                      <th className="text-right px-4 py-3">Couple</th>
                      <th className="text-left px-4 py-3">Calculateur</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((engine) => (
                      <tr key={engine.id} className="border-b border-line last:border-0 hover:bg-soft/50 group transition-colors duration-[120ms]">
                        <td className="px-5 py-3 font-medium">{engine.nom}</td>
                        <td className="px-4 py-3">
                          {engine.carburant ? (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${FUEL_BADGE[engine.carburant] ?? ""}`}>
                              {FUEL_LABEL[engine.carburant] ?? engine.carburant}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {engine.ch_stock ? <><strong>{engine.ch_stock}</strong> <span className="text-mute text-xs">ch</span></> : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {engine.nm_stock ? <><strong>{engine.nm_stock}</strong> <span className="text-mute text-xs">Nm</span></> : "—"}
                        </td>
                        <td className="px-4 py-3 text-mute font-mono text-xs">{engine.ecu ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/marques/${brandSlug}/${modelSlug}/${periodId}/${engine.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border border-line2 text-ink2 hover:border-ember hover:text-ember-ink transition-[border-color,color] duration-[150ms]"
                          >
                            Voir la fiche
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-3 sm:hidden">
                {list.map((engine) => (
                  <Link
                    key={engine.id}
                    href={`/marques/${brandSlug}/${modelSlug}/${periodId}/${engine.id}`}
                    className="block bg-card border border-line rounded-[12px] p-4 hover:border-line2 hover:shadow-card transition-[border-color,box-shadow] duration-[200ms]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="font-medium leading-snug">{engine.nom}</span>
                      {engine.carburant && (
                        <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${FUEL_BADGE[engine.carburant] ?? ""}`}>
                          {FUEL_LABEL[engine.carburant] ?? engine.carburant}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm">
                      {engine.ch_stock && (
                        <span><strong>{engine.ch_stock}</strong> <span className="text-mute text-xs">ch</span></span>
                      )}
                      {engine.nm_stock && (
                        <span><strong>{engine.nm_stock}</strong> <span className="text-mute text-xs">Nm</span></span>
                      )}
                      {engine.ecu && (
                        <span className="text-mute text-xs font-mono ml-auto">{engine.ecu}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
