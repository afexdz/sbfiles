import { revalidatePath } from "next/cache";
import { createClient }   from "../../../../lib/supabase/server";
import { AdminsPanel }    from "./AdminsPanel";
import type { Profile }   from "@/lib/types";

export default async function SbxAdminsPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("profiles")
    .select("id, role, nom, email, created_at")
    .in("role", ["admin", "super_admin"])
    .order("role")
    .order("email");

  const admins = (raw ?? []) as Profile[];

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

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Administrateurs</h1>
      <AdminsPanel admins={admins} promouvoirAction={promouvoir} revoquerAction={revoquer} />
    </div>
  );
}
