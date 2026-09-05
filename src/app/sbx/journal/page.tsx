import { createClient } from "../../../../lib/supabase/server";

export default async function SbxJournalPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("admin_actions")
    .select("id, action, cible_type, cible_id, details, created_at, acteur:profiles(email)")
    .order("created_at", { ascending: false })
    .limit(500);

  const actions = (raw ?? []).map((r: Record<string, unknown>) => ({
    id:          r.id as string,
    action:      r.action as string,
    cible_type:  r.cible_type as string | null,
    cible_id:    r.cible_id as string | null,
    details:     r.details as Record<string, unknown> | null,
    created_at:  r.created_at as string,
    acteur_email:(r.acteur as { email: string } | null)?.email ?? "—",
  }));

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Journal d&apos;actions</h1>
      <p className="text-white/40 text-[14px] mb-8">{actions.length} entrée{actions.length !== 1 ? "s" : ""}</p>

      <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.07] text-[11px] text-white/40 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Acteur</th>
              <th className="text-left px-5 py-3">Action</th>
              <th className="text-left px-5 py-3">Cible</th>
              <th className="text-left px-5 py-3">Détails</th>
            </tr>
          </thead>
          <tbody>
            {actions.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30">Aucune action journalisée.</td></tr>
            )}
            {actions.map((a) => (
              <tr key={a.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap">
                  {new Date(a.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-5 py-3 text-xs">{a.acteur_email}</td>
                <td className="px-5 py-3 font-mono text-xs text-[#F5C842]">{a.action}</td>
                <td className="px-5 py-3 text-white/40 text-xs">
                  {a.cible_type ? `${a.cible_type}` : "—"}
                  {a.cible_id && (
                    <span className="ml-1 font-mono text-white/20">{a.cible_id.slice(0, 8)}…</span>
                  )}
                </td>
                <td className="px-5 py-3 text-white/30 text-xs max-w-[200px] truncate font-mono">
                  {a.details ? JSON.stringify(a.details) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
