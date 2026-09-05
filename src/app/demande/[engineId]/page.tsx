import { notFound, redirect } from "next/navigation";
import { createClient }        from "../../../../lib/supabase/server";
import { Header }              from "@/components/layout/Header";
import { Footer }              from "@/components/layout/Footer";
import { DemandeForm }         from "@/components/demande/DemandeForm";
import type { TuningType, Option } from "@/lib/types";

const WRAP = "max-w-[900px] mx-auto px-[clamp(18px,4.5vw,56px)]";

export default async function DemandePage({
  params,
}: {
  params: Promise<{ engineId: string }>;
}) {
  const { engineId } = await params;
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/");

  const [engineRes, typesRes, optionsRes, settingsRes] = await Promise.all([
    supabase
      .from("engines")
      .select(`
        id, nom, code_moteur, carburant, ch_stock, nm_stock,
        period:periods (
          label, annee_debut, annee_fin,
          model:models (
            nom,
            brand:brands (nom)
          )
        )
      `)
      .eq("id", engineId)
      .single(),
    supabase
      .from("tuning_types")
      .select("id, nom_fr, cout_tokens, ordre")
      .order("ordre"),
    supabase
      .from("options")
      .select("id, nom_fr, cout_tokens, ordre")
      .order("ordre"),
    supabase.from("app_settings").select("valeur").eq("cle", "token_dzd").single(),
  ]);

  if (engineRes.error || !engineRes.data) notFound();

  type EngineWithPeriod = {
    id: string; nom: string; code_moteur: string | null;
    carburant: string | null; ch_stock: number | null; nm_stock: number | null;
    period: { label: string; annee_debut: number | null; annee_fin: number | null;
               model: { nom: string; brand: { nom: string } } };
  };
  const engine = engineRes.data as unknown as EngineWithPeriod;
  const tuningTypes = (typesRes.data ?? []) as TuningType[];
  const options     = (optionsRes.data ?? []) as Option[];
  const tokenDzd    = parseInt(settingsRes.data?.valeur ?? "1000");

  // Auth + atelier status
  const { data: { user } } = await supabase.auth.getUser();
  const atelierRes = user
    ? await supabase.from("ateliers").select("id, statut").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const atelier = atelierRes.data;

  const brand  = engine.period.model.brand.nom;
  const model  = engine.period.model.nom;
  const period = engine.period.label;

  let solde = 0;
  if (atelier?.statut === "approuve") {
    const { data: s } = await supabase.rpc("solde_tokens", { p_atelier: atelier.id });
    solde = (s as number) ?? 0;
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-8 sm:py-12`}>
          {/* En-tête véhicule */}
          <div className="mb-8 pb-6 border-b border-line">
            <p className="text-mute text-sm mb-1">Demande de tuning</p>
            <h1 className="font-display text-[clamp(24px,3vw,34px)]">
              {brand} {model} — {period}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-ink2">
              <span>{engine.nom}</span>
              {engine.code_moteur && <span className="font-mono text-xs bg-soft px-2 py-0.5 rounded">{engine.code_moteur}</span>}
              {engine.carburant && <span className="capitalize">{engine.carburant}</span>}
              {engine.ch_stock && <span>{engine.ch_stock} ch stock</span>}
            </div>
          </div>

          {/* Garde : non connecté */}
          {!user && (
            <div className="bg-card border border-line rounded-[14px] p-8 text-center shadow-card">
              <p className="text-ink2 mb-4">
                Connectez-vous à votre compte atelier pour soumettre une demande.
              </p>
              <a
                href="/connexion"
                className="inline-block bg-ember text-white font-semibold text-sm px-6 py-3 rounded hover:bg-ember-ink transition-colors duration-150"
              >
                Se connecter
              </a>
            </div>
          )}

          {/* Garde : en attente de validation */}
          {user && atelier?.statut === "en_attente" && (
            <div className="bg-card border border-line rounded-[14px] p-8 text-center shadow-card">
              <p className="text-2xl mb-3">⏳</p>
              <p className="text-ink2">
                Votre dossier atelier est en cours de validation. Vous pourrez soumettre des demandes une fois approuvé.
              </p>
            </div>
          )}

          {/* Garde : pas d'atelier */}
          {user && !atelier && (
            <div className="bg-card border border-line rounded-[14px] p-8 text-center shadow-card">
              <p className="text-ink2 mb-4">
                Vous devez d&apos;abord créer un compte atelier.
              </p>
              <a
                href="/inscription"
                className="inline-block bg-ember text-white font-semibold text-sm px-6 py-3 rounded hover:bg-ember-ink transition-colors duration-150"
              >
                Créer mon compte atelier
              </a>
            </div>
          )}

          {/* Formulaire actif */}
          {atelier?.statut === "approuve" && (
            <DemandeForm
              engineId={engineId}
              atelierId={atelier.id}
              solde={solde}
              tokenDzd={tokenDzd}
              tuningTypes={tuningTypes}
              options={options}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
