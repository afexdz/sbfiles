import { revalidatePath } from "next/cache";
import { createClient }   from "../../../../lib/supabase/server";
import { ReglagesPanel }  from "./ReglagesPanel";

export default async function SbxReglagesPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("app_settings")
    .select("cle, valeur, updated_at")
    .order("cle");

  const settings = (raw ?? []) as { cle: string; valeur: string; updated_at: string }[];

  // History from admin_actions
  const { data: historyRaw } = await supabase
    .from("admin_actions")
    .select("cible_id, details, created_at, acteur:profiles(email)")
    .eq("cible_type", "app_settings")
    .order("created_at", { ascending: false })
    .limit(50);

  const history = (historyRaw ?? []).map((h: Record<string, unknown>) => ({
    cile_id:      h.cible_id as string,
    details:      h.details as Record<string, unknown> | null,
    created_at:   h.created_at as string,
    acteur_email: (h.acteur as { email: string } | null)?.email ?? "—",
  }));

  async function updateSetting(cle: string, valeur: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };

    const { data: old } = await sb.from("app_settings").select("valeur").eq("cle", cle).single();

    const { error } = await sb.from("app_settings")
      .update({ valeur, updated_at: new Date().toISOString() })
      .eq("cle", cle);
    if (error) return { ok: false, message: error.message };

    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb.from("admin_actions").insert({
        acteur:     user.id,
        action:     "modifier_reglage",
        cible_type: "app_settings",
        cible_id:   cle,
        details:    { ancienne_valeur: old?.valeur, nouvelle_valeur: valeur },
      });
    }

    revalidatePath("/sbx/reglages");
    return { ok: true };
  }

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Réglages</h1>
      <p className="text-white/40 text-[14px] mb-8">Paramètres globaux de la plateforme</p>
      <ReglagesPanel settings={settings} history={history} updateAction={updateSetting} />
    </div>
  );
}
