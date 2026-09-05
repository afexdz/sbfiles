import { revalidatePath }   from "next/cache";
import { createClient }     from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { AdminsPanel }      from "./AdminsPanel";
import type { Profile }     from "@/lib/types";

async function requireSuperAdmin() {
  const sb = await createClient().catch(() => null);
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "super_admin") return null;
  return { sb, userId: user.id };
}

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

  async function creerAdmin(nom: string, email: string, password: string)
    : Promise<{ ok: boolean; message?: string }> {
    "use server";
    const ctx = await requireSuperAdmin();
    if (!ctx) return { ok: false, message: "Non autorisé." };

    const admin = createAdminClient();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nom },
    });
    if (createErr) return { ok: false, message: createErr.message };

    await admin.from("profiles").upsert({
      id:    created.user.id,
      role:  "admin",
      nom,
      email,
    }, { onConflict: "id" });

    await ctx.sb.from("admin_actions").insert({
      acteur:     ctx.userId,
      action:     "creer_admin",
      cible_type: "profile",
      cible_id:   created.user.id,
      details:    { email, nom },
    });

    revalidatePath("/sbx/admins");
    return { ok: true };
  }

  async function modifierAdmin(userId: string, nom: string | null, newPassword: string | null)
    : Promise<{ ok: boolean; message?: string }> {
    "use server";
    const ctx = await requireSuperAdmin();
    if (!ctx) return { ok: false, message: "Non autorisé." };

    const admin = createAdminClient();

    if (newPassword) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) return { ok: false, message: error.message };
    }

    if (nom !== null) {
      await admin.from("profiles").update({ nom }).eq("id", userId);
    }

    await ctx.sb.from("admin_actions").insert({
      acteur:     ctx.userId,
      action:     "modifier_admin",
      cible_type: "profile",
      cible_id:   userId,
      details:    {
        champs: [...(nom !== null ? ["nom"] : []), ...(newPassword ? ["password"] : [])],
      },
    });

    revalidatePath("/sbx/admins");
    return { ok: true };
  }

  async function supprimerAdmin(userId: string)
    : Promise<{ ok: boolean; message?: string }> {
    "use server";
    const ctx = await requireSuperAdmin();
    if (!ctx) return { ok: false, message: "Non autorisé." };

    await ctx.sb.from("admin_actions").insert({
      acteur:     ctx.userId,
      action:     "supprimer_admin",
      cible_type: "profile",
      cible_id:   userId,
    });

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
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
      <AdminsPanel
        admins={admins}
        creerAction={creerAdmin}
        modifierAction={modifierAdmin}
        supprimerAction={supprimerAdmin}
        getActionsAction={getActions}
      />
    </div>
  );
}
