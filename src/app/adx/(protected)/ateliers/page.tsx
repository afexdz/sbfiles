import { revalidatePath }             from "next/cache";
import { createClient }              from "../../../../../lib/supabase/server";
import { AteliersTable }             from "@/components/admin/AteliersTable";
import { sendAtelierApprouveEmail }  from "@/lib/email";
import type { Atelier }              from "@/lib/types";

export default async function AdxAteliersPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("ateliers")
    .select("*, user:profiles!ateliers_user_id_profiles_fkey(email)")
    .order("statut", { ascending: true })
    .order("created_at", { ascending: true });

  const atelierIds: string[] = (raw ?? []).map((a: Record<string, unknown>) => a.id as string);
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

  const ateliers = (raw ?? []).map((a: Record<string, unknown>) => ({
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

    revalidatePath("/adx/ateliers");
    return { ok: true };
  }

  async function refuser(id: string, note: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("ateliers")
      .update({ statut: "refuse", note_admin: note }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/adx/ateliers");
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
    revalidatePath("/adx/ateliers");
    return { ok: true, nouveau_solde: data as number };
  }

  const pending = ateliers.filter((a) => a.statut === "en_attente").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[clamp(24px,3vw,34px)]">Ateliers</h1>
        <p className="text-ink2 text-[14.5px] mt-1">
          {ateliers.length} atelier{ateliers.length !== 1 ? "s" : ""}
          {pending > 0 && <> — <span className="text-ember font-medium">{pending} en attente</span></>}
        </p>
      </div>
      <AteliersTable ateliers={ateliers} approuverAction={approuver} refuserAction={refuser} ajusterAction={ajuster} />
    </>
  );
}
