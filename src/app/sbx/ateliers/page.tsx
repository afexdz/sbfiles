import { revalidatePath }  from "next/cache";
import { createClient }     from "../../../../lib/supabase/server";
import { AteliersTable }    from "@/components/admin/AteliersTable";
import type { Atelier }     from "@/lib/types";

export default async function SbxAteliersPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("ateliers")
    .select("*, user:profiles(email)")
    .order("statut", { ascending: true })
    .order("created_at", { ascending: true });

  const atelierIds: string[] = (raw ?? []).map((a: Record<string, unknown>) => a.id as string);
  const soldesMap: Record<string, number> = {};
  for (const id of atelierIds) {
    const { data: s } = await supabase.rpc("solde_tokens", { p_atelier: id });
    soldesMap[id] = (s as number | null) ?? 0;
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

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Ateliers</h1>
      <p className="text-white/40 text-[14px] mb-8">
        {ateliers.length} atelier{ateliers.length !== 1 ? "s" : ""}
      </p>
      {/* AteliersTable uses light-mode classes — wrapper forces a light context */}
      <div className="bg-card rounded-[14px] p-4 sm:p-6">
        <AteliersTable ateliers={ateliers} approuverAction={approuver} refuserAction={refuser} ajusterAction={ajuster} />
      </div>
    </div>
  );
}
