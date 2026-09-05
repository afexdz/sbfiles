import { createClient }  from "../../../../lib/supabase/server";
import { JournalPanel }  from "./JournalPanel";

export default async function SbxJournalPage() {
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("admin_actions")
    .select("id, action, cible_type, cible_id, details, created_at, acteur:profiles(email)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div>
        <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Journal d&apos;actions</h1>
        <div className="bg-red-900/20 border border-red-800/40 rounded-[12px] px-5 py-4">
          <p className="text-red-400 text-sm font-medium">Erreur lors du chargement</p>
          <p className="text-red-400/60 text-xs mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  const actions = (raw ?? []).map((r: Record<string, unknown>) => ({
    id:           r.id as string,
    action:       r.action as string,
    cible_type:   r.cible_type as string | null,
    cible_id:     r.cible_id as string | null,
    details:      r.details as Record<string, unknown> | null,
    created_at:   r.created_at as string,
    acteur_email: (r.acteur as { email: string } | null)?.email ?? "—",
  }));

  const acteurs     = [...new Set(actions.map((a) => a.acteur_email))].filter((e) => e !== "—").sort();
  const actionTypes = [...new Set(actions.map((a) => a.action))].sort();

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Journal d&apos;actions</h1>
      <p className="text-white/40 text-[14px] mb-8">{actions.length} entrée{actions.length !== 1 ? "s" : ""}</p>
      <JournalPanel actions={actions} acteurs={acteurs} actionTypes={actionTypes} />
    </div>
  );
}
