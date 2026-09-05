"use client";

import { useState, useMemo } from "react";

interface ActionEntry {
  id:           string;
  action:       string;
  cible_type:   string | null;
  cible_id:     string | null;
  details:      Record<string, unknown> | null;
  created_at:   string;
  acteur_email: string;
}

interface Props {
  actions:      ActionEntry[];
  acteurs:      string[];
  actionTypes:  string[];
}

export function JournalPanel({ actions, acteurs, actionTypes }: Props) {
  const [acteurFilter, setActeurFilter]     = useState("");
  const [actionFilter, setActionFilter]     = useState("");
  const [expandedId, setExpandedId]         = useState<string | null>(null);

  const filtered = useMemo(() => actions.filter((a) => {
    if (acteurFilter && a.acteur_email !== acteurFilter) return false;
    if (actionFilter && a.action !== actionFilter)       return false;
    return true;
  }), [actions, acteurFilter, actionFilter]);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-[11px] uppercase tracking-wider text-white/40">Acteur</label>
          <select value={acteurFilter} onChange={(e) => setActeurFilter(e.target.value)}
            className="bg-[#0B0C10] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F5C842]/50">
            <option value="">Tous</option>
            {acteurs.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-[11px] uppercase tracking-wider text-white/40">Type d&apos;action</label>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#0B0C10] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F5C842]/50">
            <option value="">Toutes</option>
            {actionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {(acteurFilter || actionFilter) && (
          <button onClick={() => { setActeurFilter(""); setActionFilter(""); }}
            className="text-xs text-white/40 hover:text-white transition-colors duration-150 cursor-pointer">
            Réinitialiser
          </button>
        )}
        <span className="ml-auto text-xs text-white/30">
          {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
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
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30">Aucune action.</td></tr>
            )}
            {filtered.map((a) => (
              <>
                <tr key={a.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 text-xs">{a.acteur_email}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[#F5C842]">{a.action}</td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {a.cible_type ?? "—"}
                    {a.cible_id && (
                      <span className="ml-1 font-mono text-white/20">{a.cible_id.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {a.details ? (
                      <button
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        className="text-white/40 hover:text-[#F5C842] transition-colors duration-150 cursor-pointer font-mono">
                        {expandedId === a.id ? "▲ masquer" : "▼ voir"}
                      </button>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                </tr>
                {expandedId === a.id && a.details && (
                  <tr key={`${a.id}-detail`} className="border-b border-white/[0.05] bg-[#0B0C10]">
                    <td colSpan={5} className="px-5 py-3">
                      <pre className="text-[11px] text-white/50 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(a.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
