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

  async function updateSetting(cle: string, valeur: string): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb.from("app_settings")
      .update({ valeur, updated_at: new Date().toISOString() })
      .eq("cle", cle);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/sbx/reglages");
    return { ok: true };
  }

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Réglages</h1>
      <p className="text-white/40 text-[14px] mb-8">Paramètres globaux de la plateforme</p>
      <ReglagesPanel settings={settings} updateAction={updateSetting} />
    </div>
  );
}
