import { notFound }     from "next/navigation";
import Link              from "next/link";
import type { Metadata } from "next";
import { createClient }  from "../../../../../../../lib/supabase/server";
import { Header }        from "@/components/layout/Header";
import { Footer }        from "@/components/layout/Footer";
import { Breadcrumb }    from "@/components/ui/Breadcrumb";
import { DynoChart }     from "@/components/DynoChart";
import { Button }        from "@/components/ui/Button";
import type { TuningFile, TuningType, Option, Fuel } from "@/lib/types";

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
  params: Promise<{ brand: string; model: string; period: string; engine: string }>;
}): Promise<Metadata> {
  const { engine: engineId } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("engines")
      .select(`nom, period:periods(label, model:models(nom, brand:brands(nom)))`)
      .eq("id", engineId)
      .single();
    if (data) {
      type PeriodNested = { label: string; model: { nom: string; brand: { nom: string }[] }[] };
      const p = (Array.isArray(data.period) ? data.period[0] : data.period) as PeriodNested | null;
      const m = Array.isArray(p?.model) ? p!.model[0] : p?.model;
      const b = Array.isArray(m?.brand) ? m!.brand[0] : m?.brand;
      const title = [b?.nom, m?.nom, data.nom].filter(Boolean).join(" · ");
      return {
        title: `${title} — SBFiles`,
        description: `Fichiers de reprogrammation pour ${title}. Stage 1, Stage 2, E85, suppressions. Téléchargement immédiat.`,
      };
    }
  } catch { /* ignore */ }
  return { title: "Fiche moteur — SBFiles" };
}

interface FileWithType extends TuningFile {
  tuning_type: TuningType;
}

export default async function EnginePage({
  params,
}: {
  params: Promise<{ brand: string; model: string; period: string; engine: string }>;
}) {
  const { brand: brandSlug, model: modelSlug, period: periodId, engine: engineId } = await params;
  const supabase = await createClient();

  const { data: engine } = await supabase
    .from("engines")
    .select(`
      *,
      period:periods!inner(
        id, label, annee_debut, annee_fin,
        model:models!inner(
          id, nom, slug,
          brand:brands!inner(id, nom, slug)
        )
      )
    `)
    .eq("id", engineId)
    .single();

  if (!engine) notFound();

  const period  = engine.period as { id: string; label: string; annee_debut: number | null; annee_fin: number | null; model: { id: string; nom: string; slug: string; brand: { id: string; nom: string; slug: string } } };
  const model   = period.model;
  const brand   = model.brand;

  /* Validate slugs */
  if (brand.slug !== brandSlug || model.slug !== modelSlug || period.id !== periodId) notFound();

  const [{ data: rawFiles }, { data: rawOptions }] = await Promise.all([
    supabase
      .from("files")
      .select("*, tuning_type:tuning_types(*)")
      .eq("engine_id", engineId)
      .eq("actif", true)
      .order("tuning_type(ordre)"),
    supabase.from("options").select("*").order("ordre"),
  ]);

  const files: FileWithType[]  = (rawFiles  ?? []) as FileWithType[];
  const options: Option[]      = (rawOptions ?? []) as Option[];

  const fuel: Fuel = engine.carburant === "hybride"
    ? "essence"
    : (engine.carburant as Fuel | null) ?? "diesel";

  const hp = engine.ch_stock ?? 150;
  const nm = engine.nm_stock ?? 380;

  const fmt = (n: number) => n.toLocaleString("fr-FR");

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
            { label: period.label,  href: `/marques/${brandSlug}/${modelSlug}/${periodId}` },
            { label: engine.nom },
          ]} />

          {/* Title + badges */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="font-display text-[clamp(24px,3.5vw,40px)] leading-tight">
                {brand.nom} {model.nom}
                <span className="text-mute"> · {engine.nom}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {engine.carburant && (
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${FUEL_BADGE[engine.carburant] ?? ""}`}>
                    {FUEL_LABEL[engine.carburant] ?? engine.carburant}
                  </span>
                )}
                {engine.ecu && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono bg-soft text-mute border border-line">
                    {engine.ecu}
                  </span>
                )}
                {period.annee_debut && (
                  <span className="text-xs text-mute">
                    {period.annee_debut}{period.annee_fin ? ` – ${period.annee_fin}` : "+"}
                  </span>
                )}
              </div>
            </div>

            {/* CTA — visible on large screens */}
            <div className="hidden sm:flex items-center gap-3">
              <Link href={`/demande/${engineId}`}>
                <Button variant="solid" className="whitespace-nowrap">
                  Demander ce fichier →
                </Button>
              </Link>
            </div>
          </div>

          {/* 2-col layout: chart left, comparison right on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 sm:gap-8 mb-8">
            {/* DynoChart */}
            <DynoChart
              hp={hp}
              nm={nm}
              fuel={fuel}
              ecu={engine.ecu ?? "—"}
              title={`${brand.nom} ${model.nom} · ${engine.nom}`}
              defaultStage="stock"
            />

            {/* Comparison table */}
            <div className="bg-card border border-line rounded-lg shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-line">
                <h2 className="font-display text-lg">Comparatif par stage</h2>
              </div>

              {files.length === 0 ? (
                <div className="px-5 py-8 text-mute text-sm text-center">
                  Fichiers disponibles sur demande.
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-soft border-b border-line text-xs text-mute uppercase tracking-wider">
                      <th className="text-left px-5 py-2.5">Stage</th>
                      <th className="text-right px-4 py-2.5">ch</th>
                      <th className="text-right px-4 py-2.5">Nm</th>
                      <th className="text-right px-4 py-2.5">+ch</th>
                      <th className="text-right px-4 py-2.5">+Nm</th>
                      <th className="text-right px-4 py-2.5">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Origin row */}
                    <tr className="border-b border-line bg-soft/40">
                      <td className="px-5 py-2.5 font-medium text-mute">Origine</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{hp}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{nm}</td>
                      <td className="px-4 py-2.5 text-right text-mute">—</td>
                      <td className="px-4 py-2.5 text-right text-mute">—</td>
                      <td className="px-4 py-2.5 text-right text-mute">—</td>
                    </tr>
                    {files.map((file) => {
                      const gainHp = file.ch_tune != null && hp ? file.ch_tune - hp : null;
                      const gainNm = file.nm_tune != null && nm ? file.nm_tune - nm : null;
                      return (
                        <tr key={file.id} className="border-b border-line last:border-0 hover:bg-soft/30 transition-colors">
                          <td className="px-5 py-2.5 font-medium">{file.tuning_type.nom_fr}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                            {file.ch_tune ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                            {file.nm_tune ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ok font-medium">
                            {gainHp != null ? `+${gainHp}` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ok font-medium">
                            {gainNm != null ? `+${gainNm}` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs bg-ember-soft text-ember-ink font-semibold">
                              {file.tuning_type.cout_tokens}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Options section */}
          {options.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-[clamp(20px,2.5vw,28px)] mb-4">Options disponibles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-card border border-line rounded-[10px]"
                  >
                    <span className="text-sm">{opt.nom_fr}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.cout_tokens > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs bg-ember-soft text-ember-ink font-semibold whitespace-nowrap">
                          +{opt.cout_tokens} token{opt.cout_tokens !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-xs text-mute tabular-nums whitespace-nowrap">
                        {fmt(opt.prix_dzd)} DZD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA block */}
          <div className="bg-card border border-line rounded-[14px] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl mb-1">Prêt à reprogrammer ?</h2>
              <p className="text-ink2 text-[14.5px]">
                Transmettez votre fichier stock. Le fichier reprogrammé vous est renvoyé en quelques heures.
              </p>
            </div>
            <Link href={`/demande/${engineId}`} className="shrink-0">
              <Button variant="solid" className="text-base px-6 py-3 whitespace-nowrap">
                Demander ce fichier →
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
