import { revalidatePath }       from "next/cache";
import { createClient }          from "../../../../lib/supabase/server";
import { DemandTableAdx }        from "@/components/adx/DemandTableAdx";
import type { TuningDemande }    from "@/lib/types";

export default async function AdxDemandesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tuning_demandes")
    .select(`
      *,
      atelier:ateliers (nom),
      engine:engines (nom),
      tuning_type:tuning_types (nom_fr)
    `)
    .order("created_at", { ascending: false });

  const demandes = (data ?? []).map((d: Record<string, unknown>) => ({
    ...(d as unknown as TuningDemande),
    atelier_nom: (d.atelier as { nom: string } | null)?.nom,
    engine_nom:  (d.engine  as { nom: string } | null)?.nom,
    tuning_nom:  (d.tuning_type as { nom_fr: string } | null)?.nom_fr,
  }));

  async function telechargerFichier(id: string): Promise<{ ok: boolean; url?: string; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data: { user } } = await sb.auth.getUser();

    const { data: d } = await sb
      .from("tuning_demandes")
      .select("fichier_original, statut")
      .eq("id", id).single();

    if (!d) return { ok: false, message: "Demande introuvable." };

    if (d.statut === "recue" && user) {
      await sb.from("tuning_demandes").update({
        telecharge_le:     new Date().toISOString(),
        assigned_admin_id: user.id,
        statut:            "en_cours",
      }).eq("id", id);

      await sb.from("admin_actions").insert({
        acteur_id:  user.id,
        action:     "telecharger_fichier_original",
        cible_type: "tuning_demande",
        cible_id:   id,
        details:    { fichier: d.fichier_original },
      });

      revalidatePath("/adx/demandes");
    }

    const { data: signed } = await sb.storage
      .from("bin-original")
      .createSignedUrl(d.fichier_original, 3600);

    return { ok: true, url: signed?.signedUrl };
  }

  async function livrerDemande(fd: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const demandeId = fd.get("demandeId") as string | null;
    const file      = fd.get("file")      as File  | null;
    if (!demandeId || !file) return { ok: false, message: "Données manquantes." };

    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data: { user } } = await sb.auth.getUser();

    const filePath = `tune/${demandeId}/${file.name}`;
    const { error: uploadErr } = await sb.storage
      .from("bin-tune")
      .upload(filePath, file, { upsert: true });

    if (uploadErr) return { ok: false, message: uploadErr.message };

    const { error } = await sb.from("tuning_demandes").update({
      fichier_tune:     filePath,
      fichier_tune_nom: file.name,
      statut:           "livree",
      livree_le:        new Date().toISOString(),
      traite_par:       user?.id ?? null,
    }).eq("id", demandeId);

    if (error) return { ok: false, message: error.message };

    if (user) {
      await sb.from("admin_actions").insert({
        acteur_id:  user.id,
        action:     "livrer_demande",
        cible_type: "tuning_demande",
        cible_id:   demandeId,
      });
    }

    revalidatePath("/adx/demandes");
    return { ok: true };
  }

  async function modifierDelai(id: string, delai: number): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("tuning_demandes")
      .update({ delai_heures: delai }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/adx/demandes");
    return { ok: true };
  }

  async function refuserAction(id: string, note: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.rpc("rembourser_demande", { p_demande: id, p_note: note });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/adx/demandes");
    return { ok: true };
  }

  const pending = demandes.filter((d) => d.statut === "recue").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[clamp(24px,3vw,34px)]">Demandes de tuning</h1>
        <p className="text-ink2 text-[14.5px] mt-1">
          {demandes.length} demande{demandes.length !== 1 ? "s" : ""}
          {pending > 0 && <> — <span className="text-ember font-medium">{pending} nouvelles</span></>}
        </p>
      </div>
      <DemandTableAdx
        demandes={demandes}
        telechargerFichier={telechargerFichier}
        livrerDemande={livrerDemande}
        modifierDelai={modifierDelai}
        refuserAction={refuserAction}
      />
    </>
  );
}
