import { createClient, createActionClient } from "../../../../lib/supabase/server";
import { createAdminClient }               from "../../../../lib/supabase/admin";
import { SbxAteliersPanel }           from "./SbxAteliersPanel";
import { sendAtelierApprouveEmail }   from "@/lib/email";
import type { Atelier }               from "@/lib/types";

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
    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("ateliers").update({ statut: "approuve" }).eq("id", id);
    if (error) return { ok: false, message: error.message };

    // Récupère l'email du propriétaire de l'atelier et envoie la notification
    const { data: row } = await sb
      .from("ateliers")
      .select("user_id")
      .eq("id", id)
      .single();
    if (row) {
      const { data: profile } = await sb
        .from("profiles")
        .select("email")
        .eq("id", row.user_id)
        .single();
      if (profile?.email) await sendAtelierApprouveEmail(profile.email);
    }

    return { ok: true };
  }

  async function refuser(id: string, note: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("ateliers")
      .update({ statut: "refuse", note_admin: note }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  async function ajuster(id: string, delta: number, note: string)
    : Promise<{ ok: boolean; nouveau_solde?: number; message?: string }> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data, error } = await sb.rpc("ajuster_solde", {
      p_atelier: id, p_delta: delta, p_note: note,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, nouveau_solde: data as number };
  }

  async function getLedger(id: string): Promise<{
    id: string; delta: number; motif: string; note: string | null; created_at: string;
  }[]> {
    "use server";
    const sb = await createActionClient().catch(() => null);
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
    traite_par: string | null; assigned_admin_id: string | null;
    traite_par_nom: string | null; assigned_admin_nom: string | null;
  }[]> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return [];
    const { data } = await sb
      .from("tuning_demandes")
      .select("id, reference, statut, cout_tokens, created_at, livree_le, traite_par, assigned_admin_id")
      .eq("atelier_id", id)
      .order("created_at", { ascending: false })
      .limit(15);

    const rows = (data ?? []) as {
      id: string; reference: string; statut: string; cout_tokens: number;
      created_at: string; livree_le: string | null;
      traite_par: string | null; assigned_admin_id: string | null;
    }[];

    const adminIds = [...new Set(
      rows.flatMap((r) => [r.traite_par, r.assigned_admin_id].filter(Boolean) as string[])
    )];
    const adminMap: Record<string, string> = {};
    if (adminIds.length > 0) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, nom, email")
        .in("id", adminIds);
      for (const p of profiles ?? []) {
        const profile = p as { id: string; nom: string | null; email: string | null };
        adminMap[profile.id] = profile.nom || profile.email || "Admin";
      }
    }

    return rows.map((r) => ({
      ...r,
      traite_par_nom:       r.traite_par       ? (adminMap[r.traite_par] ?? null)       : null,
      assigned_admin_nom:   r.assigned_admin_id ? (adminMap[r.assigned_admin_id] ?? null) : null,
    }));
  }

  async function getDemandeHistory(demandeId: string): Promise<{
    id: string; action: string; acteur_nom: string | null; created_at: string;
  }[]> {
    "use server";
    const sb = await createActionClient().catch(() => null);
    if (!sb) return [];
    const { data } = await sb
      .from("admin_actions")
      .select("id, action, acteur_id, created_at")
      .eq("cible_type", "tuning_demande")
      .eq("cible_id", demandeId)
      .order("created_at", { ascending: true });

    const rows = (data ?? []) as { id: string; action: string; acteur_id: string | null; created_at: string }[];
    const acteurIds = [...new Set(rows.map((r) => r.acteur_id).filter(Boolean) as string[])];
    const acteurMap: Record<string, string> = {};
    if (acteurIds.length > 0) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, nom, email")
        .in("id", acteurIds);
      for (const p of profiles ?? []) {
        const profile = p as { id: string; nom: string | null; email: string | null };
        acteurMap[profile.id] = profile.nom || profile.email || "Admin";
      }
    }
    return rows.map((r) => ({
      id:         r.id,
      action:     r.action,
      acteur_nom: r.acteur_id ? (acteurMap[r.acteur_id] ?? null) : null,
      created_at: r.created_at,
    }));
  }

  async function resetPassword(email: string): Promise<{ ok: boolean; link?: string; message?: string }> {
    "use server";
    const sb = createAdminClient();
    const { data, error } = await sb.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "https://www.sbfiles.com/reinitialiser-mot-de-passe" },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, link: data.properties.action_link };
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
        getDemandeHistoryAction={getDemandeHistory}
        resetPasswordAction={resetPassword}
      />
    </div>
  );
}
