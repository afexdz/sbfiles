import { notFound }           from "next/navigation";
import type { Metadata }       from "next";
import { createClient }        from "../../../../../../../lib/supabase/server";
import { Header }              from "@/components/layout/Header";
import { Footer }              from "@/components/layout/Footer";
import { EngineFicheClient }   from "./EngineFicheClient";
import type { Engine, TuningFile, TuningType, Option } from "@/lib/types";

export const dynamicParams = true;
export async function generateStaticParams() { return []; }

interface FileWithType extends TuningFile { tuning_type: TuningType; }

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
      .select("nom, period:periods(label, model:models(nom, brand:brands(nom)))")
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

export default async function EnginePage({
  params,
}: {
  params: Promise<{ brand: string; model: string; period: string; engine: string }>;
}) {
  const { brand: brandSlug, model: modelSlug, period: periodId, engine: engineId } = await params;
  const supabase = await createClient();

  // ── 1. Current engine + full hierarchy ──────────────────────────────────────
  const { data: engine } = await supabase
    .from("engines")
    .select(`
      *,
      period:periods!inner(
        id, label, annee_debut, annee_fin, image_url,
        model:models!inner(
          id, nom, slug,
          brand:brands!inner(id, nom, slug)
        )
      )
    `)
    .eq("id", engineId)
    .single();

  if (!engine) notFound();

  const period = engine.period as {
    id: string; label: string; annee_debut: number | null; annee_fin: number | null;
    image_url: string | null;
    model: { id: string; nom: string; slug: string; brand: { id: string; nom: string; slug: string } };
  };
  const model  = period.model;
  const brand  = model.brand;

  if (brand.slug !== brandSlug || model.slug !== modelSlug || period.id !== periodId) notFound();

  // ── 2. Parallel: all period engines, all periods of model, options ─────────
  const [
    { data: rawPeriodEngines },
    { data: rawAllPeriods },
    { data: rawOptions },
  ] = await Promise.all([
    supabase
      .from("engines")
      .select("*")
      .eq("period_id", period.id)
      .order("nom"),
    supabase
      .from("periods")
      .select("id, label, annee_debut, annee_fin")
      .eq("model_id", model.id)
      .order("ordre"),
    supabase.from("options").select("*").order("ordre"),
  ]);

  let periodEngines: Engine[] = (rawPeriodEngines ?? []) as Engine[];
  const allPeriods             = rawAllPeriods ?? [];
  const options: Option[]      = (rawOptions ?? []) as Option[];

  // Ensure the current engine is always present — guards against a Supabase
  // query failure or empty result which would crash EngineFicheClient.
  if (!periodEngines.find((e) => e.id === engineId)) {
    const fallback: Engine = {
      id:          engine.id as string,
      period_id:   period.id,
      nom:         engine.nom as string,
      code_moteur: (engine.code_moteur ?? null) as string | null,
      carburant:   (engine.carburant ?? null) as Engine["carburant"],
      ch_stock:    (engine.ch_stock ?? null) as number | null,
      nm_stock:    (engine.nm_stock ?? null) as number | null,
      ecu:         (engine.ecu ?? null) as string | null,
    };
    periodEngines = [fallback, ...periodEngines];
  }

  // ── 3. Batch-fetch tuning files for all period engines ────────────────────
  const allEngineIds = periodEngines.map((e) => e.id);
  const { data: rawAllFiles } = allEngineIds.length
    ? await supabase
        .from("files")
        .select("*, tuning_type:tuning_types(*)")
        .in("engine_id", allEngineIds)
        .eq("actif", true)
        .order("tuning_type(ordre)")
    : { data: [] };

  const filesByEngine: Record<string, FileWithType[]> = {};
  for (const f of (rawAllFiles ?? []) as FileWithType[]) {
    (filesByEngine[f.engine_id] ??= []).push(f);
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] py-8 sm:py-12">
          <EngineFicheClient
            initialEngineId={engineId}
            engines={periodEngines}
            filesByEngine={filesByEngine}
            options={options}
            period={{
              id:          period.id,
              label:       period.label,
              annee_debut: period.annee_debut,
              annee_fin:   period.annee_fin,
              image_url:   period.image_url,
            }}
            allPeriods={allPeriods}
            brand={{ nom: brand.nom, slug: brand.slug }}
            model={{ nom: model.nom, slug: model.slug }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
