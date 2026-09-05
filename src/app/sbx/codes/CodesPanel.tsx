"use client";

import { useState, useMemo } from "react";

type CodeStatus = "actif" | "utilise" | "expire";

interface CodeRow {
  id:              string;
  code_indice:     string;
  tokens:          number;
  expire_le:       string;
  utilise_le:      string | null;
  created_at:      string;
  computedStatus:  CodeStatus;
}

const STATUS_LABEL: Record<CodeStatus, string> = {
  actif:   "Actif",
  utilise: "Utilisé",
  expire:  "Expiré",
};
const STATUS_BADGE: Record<CodeStatus, string> = {
  actif:   "bg-green-900/30 text-green-400",
  utilise: "bg-white/10 text-white/40",
  expire:  "bg-red-900/30 text-red-400",
};

interface Props { codes: CodeRow[]; }

export function CodesPanel({ codes }: Props) {
  const [filter, setFilter] = useState<CodeStatus | "">("");

  const filtered = useMemo(() =>
    filter ? codes.filter((c) => c.computedStatus === filter) : codes,
    [codes, filter]
  );

  const counts = useMemo(() => ({
    actif:   codes.filter((c) => c.computedStatus === "actif").length,
    utilise: codes.filter((c) => c.computedStatus === "utilise").length,
    expire:  codes.filter((c) => c.computedStatus === "expire").length,
  }), [codes]);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setFilter("")}
          className={`px-3 py-1 text-xs rounded transition-colors duration-150 cursor-pointer ${!filter ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
          Tous ({codes.length})
        </button>
        {(["actif", "utilise", "expire"] as CodeStatus[]).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded transition-colors duration-150 cursor-pointer ${filter === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
            {STATUS_LABEL[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.07] text-[11px] text-white/40 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Indice (4 derniers)</th>
              <th className="text-right px-5 py-3">Tokens</th>
              <th className="text-left px-5 py-3">Statut</th>
              <th className="text-left px-5 py-3">Expire le</th>
              <th className="text-left px-5 py-3">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30">Aucun code.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                <td className="px-5 py-3 font-mono">
                  <span className="text-white/30">••••-••••-</span>
                  <span className="text-white font-bold">{c.code_indice}</span>
                </td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-[#F5C842]">{c.tokens}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.computedStatus]}`}>
                    {STATUS_LABEL[c.computedStatus]}
                  </span>
                </td>
                <td className="px-5 py-3 text-white/40 text-xs">
                  {new Date(c.expire_le).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-5 py-3 text-white/40 text-xs">
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
