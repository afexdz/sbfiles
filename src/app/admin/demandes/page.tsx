import { revalidatePath }      from "next/cache";
import { createClient }         from "../../../../lib/supabase/server";
import { DemandTable }          from "@/components/admin/DemandTable";
import type { TuningDemande }   from "@/lib/types";

export default async function AdminDemandesPage() {
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
    ...(d as TuningDemande),
    atelier_nom: (d.atelier as { nom: string } | null)?.nom,
    engine_nom:  (d.engine  as { nom: string } | null)?.nom,
    tuning_nom:  (d.tuning_type as { nom_fr: string } | null)?.nom_fr,
  }));

  async function getSignedUrl(demandeId: string): Promise<string | null> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return null;
    const { data: d } = await sb
      .from("tuning_demandes")
      .select("fichier_original")
      .eq("id", demandeId)
      .single();
    if (!d?.fichier_original) return null;
    const { data: signed } = await sb.storage
      .from("bin-original")
      .createSignedUrl(d.fichier_original, 3600);
    return signed?.signedUrl ?? null;
  }

  async function refuser(
    id: string,
    note: string,
  ): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.rpc("rembourser_demande", {
      p_demande: id,
      p_note: note,
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/demandes");
    return { ok: true };
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[clamp(24px,3vw,34px)]">Demandes de tuning</h1>
        <p className="text-ink2 text-[14.5px] mt-1">
          {demandes.length} demande{demandes.length !== 1 ? "s" : ""}
        </p>
      </div>
      <DemandTable
        demandes={demandes}
        getSignedUrl={getSignedUrl}
        refuserAction={refuser}
        livrerAction={async () => ({ ok: false })}
      />
    </>
  );
}
