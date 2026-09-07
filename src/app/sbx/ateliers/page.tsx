import { revalidatePath }    from "next/cache";
import { createClient }      from "../../../../lib/supabase/server";
import { SbxAteliersPanel }  from "./SbxAteliersPanel";
import type { Atelier }      from "@/lib/types";

interface AtelierWithMeta extends Atelier {
  email?: string;
  solde:  number;
}

export default async function SbxAteliersPage() {
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("ateliers")
    .select("*, user:profiles!ateliers_user_id_profiles_fkey(email)")
    .order("statut", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div>
        <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Ateliers</h1>
        <div className="bg-red-900/20 border border-red-800/40 rounded-[12px] px-5 py-4">
          <p className="text-red-400 text-sm font-medium">Erreur lors du chargement</p>
          <p className="text-red-400/60 text-xs mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  const atelierIds: string[] = (raw ?? []).map((a: Record<string, unknown>) => a.id as string);

  // Batch solde computation — one query instead of N RPCs
  const soldesMap: Record<string, number> = {};
  if (atelierIds.length > 0) {
    const { data: ledgerRows } = await supabase
      .from("token_ledger")
      .select("atelier_id, delta")
      .in("atelier_id", atelierIds);
    for (const row of ledgerRows ?? []) {
      const r = row as { atelier_id: string; delta: number };
      soldesMap[r.atelier_id] = (soldesMap[r.atelier_id] ?? 0) + r.delta;
    }
  }

  const ateliers: AtelierWithMeta[] = (raw ?? []).map((a: Record<string, unknown>) => ({
    ...(a as unknown as Atelier),
    email: (a.user as { email: string } | null)?.email,
    solde: soldesMap[a.id as string] ?? 0,
  }));

  async function approuver(id: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("ateliers").update({ statut: "approuve" }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/sbx/ateliers");
    return { ok: true };
  }

  async function refuser(id: string, note: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("ateliers")
      .update({ statut: "refuse", note_admin: note }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/sbx/ateliers");
    return { ok: true };
  }

  async function ajuster(id: string, delta: number, note: string)
    : Promise<{ ok: boolean; nouveau_solde?: number; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data, error } = await sb.rpc("ajuster_solde", {
      p_atelier: id, p_delta: delta, p_note: note,
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/sbx/ateliers");
    return { ok: true, nouveau_solde: data as number };
  }

  async function getLedger(id: string): Promise<{
    id: string; delta: number; motif: string; note: string | null; created_at: string;
  }[]> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return [];
    const { data } = await sb
      .from("token_ledger")
      .select("id, delta, motif, note, created_at")
      .eq("atelier_id", id)
      .order("created_at", { ascending: false })
      .limit(15);
    return (data ?? []) as { id: string; delta: number; motif: string; note: string | null; created_at: string }[];
  }

  async function getDemandes(id: string): Promise<{
    id: string; reference: string; statut: string; cout_tokens: number; created_at: string; livree_le: string | null;
  }[]> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return [];
    const { data } = await sb
      .from("tuning_demandes")
      .select("id, reference, statut, cout_tokens, created_at, livree_le")
      .eq("atelier_id", id)
      .order("created_at", { ascending: false })
      .limit(15);
    return (data ?? []) as { id: string; reference: string; statut: string; cout_tokens: number; created_at: string; livree_le: string | null }[];
  }

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Ateliers</h1>
      <p className="text-white/40 text-[14px] mb-8">
        {ateliers.length} atelier{ateliers.length !== 1 ? "s" : ""}
      </p>
      <SbxAteliersPanel
        ateliers={ateliers}
        approuverAction={approuver}
        refuserAction={refuser}
        ajusterAction={ajuster}
        getLedgerAction={getLedger}
        getDemandesAction={getDemandes}
      />
    </div>
  );
}
