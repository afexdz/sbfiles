import { revalidatePath }       from "next/cache";
import { createClient }          from "../../../../../lib/supabase/server";
import { createActionClient }    from "../../../../../lib/supabase/server";
import { DemandesAdxTabs }       from "@/components/adx/DemandesAdxTabs";
import type { TuningDemande }    from "@/lib/types";

interface EnrichedDemande extends TuningDemande {
  atelier_nom?:  string;
  engine_nom?:   string;
  tuning_nom?:   string;
  brand_nom?:    string;
  model_nom?:    string;
  period_nom?:   string;
  option_noms?:  string[];
}

function enrich(d: Record<string, unknown>): EnrichedDemande {
  const engine = d.engine as {
    nom: string;
    period?: { label: string; model?: { nom: string; brand?: { nom: string } } };
  } | null;
  return {
    ...(d as unknown as TuningDemande),
    atelier_nom: (d.atelier as { nom: string } | null)?.nom,
    engine_nom:  engine?.nom,
    tuning_nom:  (d.tuning_type as { nom_fr: string } | null)?.nom_fr,
    brand_nom:   engine?.period?.model?.brand?.nom,
    model_nom:   engine?.period?.model?.nom,
    period_nom:  engine?.period?.label,
    option_noms: (d.option_noms as string[]) ?? [],
  };
}

const DEMANDE_SELECT = `
  *,
  atelier:ateliers(nom),
  engine:engines(nom, period:periods(label, model:models(nom, brand:brands(nom)))),
  tuning_type:tuning_types(nom_fr)
` as const;

export default async function AdxDemandesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Batch fetch all option IDs across all demandes
  const [aPrendreRaw, mesEnCoursRaw, mesLivreesRaw] = await Promise.all([
    supabase
      .from("tuning_demandes")
      .select(DEMANDE_SELECT)
      .eq("statut", "recue")
      .is("assigned_admin_id", null)
      .order("created_at", { ascending: true }),

    supabase
      .from("tuning_demandes")
      .select(DEMANDE_SELECT)
      .eq("statut", "en_cours")
      .eq("assigned_admin_id", user.id)
      .order("telecharge_le", { ascending: true }),

    supabase
      .from("tuning_demandes")
      .select(DEMANDE_SELECT)
      .eq("statut", "livree")
      .eq("traite_par", user.id)
      .order("livree_le", { ascending: false })
      .limit(50),
  ]);

  const allRaw = [
    ...(aPrendreRaw.data ?? []),
    ...(mesEnCoursRaw.data ?? []),
    ...(mesLivreesRaw.data ?? []),
  ] as Record<string, unknown>[];

  // Batch option names
  const allOptionIds = [...new Set(
    allRaw.flatMap((d) => (d.option_ids as string[] | null) ?? [])
  )];
  const optionMap: Record<string, string> = {};
  if (allOptionIds.length > 0) {
    const { data: opts } = await supabase
      .from("options")
      .select("id, nom_fr")
      .in("id", allOptionIds);
    for (const o of opts ?? []) {
      const opt = o as { id: string; nom_fr: string };
      optionMap[opt.id] = opt.nom_fr;
    }
  }

  function withOptions(d: Record<string, unknown>): EnrichedDemande {
    const base = enrich(d);
    base.option_noms = ((d.option_ids as string[] | null) ?? [])
      .map((id) => optionMap[id]).filter(Boolean);
    return base;
  }

  const aPrendre  = (aPrendreRaw.data  ?? []).map(withOptions);
  const mesEnCours = (mesEnCoursRaw.data ?? []).map(withOptions);
  const mesLivrees = (mesLivreesRaw.data ?? []).map(withOptions);

  // ── Server Actions ──────────────────────────────────────────────────────────

  async function prendreEnCharge(id: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data, error } = await sb.rpc("prendre_en_charge", { p_demande: id });
    if (error) return { ok: false, message: error.message };
    if (!data) return { ok: false, message: "Cette demande vient d'être prise par un autre admin." };
    revalidatePath("/adx/demandes");
    return { ok: true };
  }

  async function telecharger(id: string): Promise<{ ok: boolean; url?: string; message?: string }> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data: { user: u } } = await sb.auth.getUser();

    const { data: d } = await sb
      .from("tuning_demandes")
      .select("fichier_original, fichier_original_nom")
      .eq("id", id)
      .single();
    if (!d) return { ok: false, message: "Demande introuvable." };

    const { data: signed } = await sb.storage
      .from("bin-original")
      .createSignedUrl(d.fichier_original, 3600);

    if (u) {
      await sb.from("admin_actions").insert({
        acteur_id:  u.id,
        action:     "telecharger_fichier_original",
        cible_type: "tuning_demande",
        cible_id:   id,
        details:    { fichier: d.fichier_original },
      });
    }

    return { ok: true, url: signed?.signedUrl };
  }

  async function livrer(fd: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const demandeId = fd.get("demandeId") as string | null;
    const file      = fd.get("file")      as File  | null;
    if (!demandeId || !file) return { ok: false, message: "Données manquantes." };

    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data: { user: u } } = await sb.auth.getUser();

    const filePath = `tune/${demandeId}/${file.name}`;
    const buffer = await file.arrayBuffer();
    const { error: uploadErr } = await sb.storage
      .from("bin-tune")
      .upload(filePath, buffer, { upsert: true, contentType: "application/octet-stream" });

    if (uploadErr) return { ok: false, message: uploadErr.message };

    const { error } = await sb.from("tuning_demandes").update({
      fichier_tune:     filePath,
      fichier_tune_nom: file.name,
      statut:           "livree",
      livree_le:        new Date().toISOString(),
      traite_par:       u?.id ?? null,
    }).eq("id", demandeId);

    if (error) return { ok: false, message: error.message };

    if (u) {
      await sb.from("admin_actions").insert({
        acteur_id:  u.id,
        action:     "livrer_demande",
        cible_type: "tuning_demande",
        cible_id:   demandeId,
      });
    }

    revalidatePath("/adx/demandes");
    return { ok: true };
  }

  async function refuser(id: string, note: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data: { user: u } } = await sb.auth.getUser();
    const { error } = await sb.rpc("rembourser_demande", { p_demande: id, p_note: note });
    if (error) return { ok: false, message: error.message };

    if (u) {
      await sb.from("admin_actions").insert({
        acteur_id:  u.id,
        action:     "refuser_demande",
        cible_type: "tuning_demande",
        cible_id:   id,
        details:    { note },
      });
    }

    revalidatePath("/adx/demandes");
    return { ok: true };
  }

  async function modifierDelai(id: string, delai: number): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("tuning_demandes")
      .update({ delai_heures: delai }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/adx/demandes");
    return { ok: true };
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(24px,3vw,34px)]">Demandes de tuning</h1>
        <p className="text-ink2 text-sm mt-1">
          {aPrendre.length} à prendre
          {mesEnCours.length > 0 && <> · <span className="text-ember font-medium">{mesEnCours.length} en cours</span></>}
        </p>
      </div>
      <DemandesAdxTabs
        aPrendre={aPrendre}
        mesEnCours={mesEnCours}
        mesLivrees={mesLivrees}
        prendreEnChargeAction={prendreEnCharge}
        telechargerAction={telecharger}
        livrerAction={livrer}
        refuserAction={refuser}
        modifierDelaiAction={modifierDelai}
      />
    </div>
  );
}
