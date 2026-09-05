import { revalidatePath } from "next/cache";
import { createClient }   from "../../../../lib/supabase/server";
import { AdminsPanel }    from "./AdminsPanel";
import type { Profile }   from "@/lib/types";

export default async function SbxAdminsPage() {
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("profiles")
    .select("id, role, nom, email, created_at")
    .in("role", ["admin", "super_admin"])
    .order("role")
    .order("email");

  const admins = (raw ?? []) as Profile[];

  if (error) {
    return (
      <div>
        <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Administrateurs</h1>
        <div className="bg-red-900/20 border border-red-800/40 rounded-[12px] px-5 py-4">
          <p className="text-red-400 text-sm font-medium">Erreur lors du chargement</p>
          <p className="text-red-400/60 text-xs mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  async function promouvoir(email: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.rpc("creer_admin", { p_email: email });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/sbx/admins");
    return { ok: true };
  }

  async function revoquer(profileId: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.rpc("revoquer_admin", { p_profile: profileId });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/sbx/admins");
    return { ok: true };
  }

  async function getActions(profileId: string): Promise<{
    id: string; action: string; cible_type: string | null; created_at: string; details: Record<string, unknown> | null;
  }[]> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return [];
    const { data } = await sb
      .from("admin_actions")
      .select("id, action, cible_type, created_at, details")
      .eq("acteur", profileId)
      .order("created_at", { ascending: false })
      .limit(15);
    return (data ?? []) as { id: string; action: string; cible_type: string | null; created_at: string; details: Record<string, unknown> | null }[];
  }

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Administrateurs</h1>
      <AdminsPanel admins={admins} promouvoirAction={promouvoir} revoquerAction={revoquer} getActionsAction={getActions} />
    </div>
  );
}
