"use client";

import { useState, useMemo } from "react";

interface LedgerEntry {
  id:          string;
  delta:       number;
  motif:       string;
  note:        string | null;
  created_at:  string;
  atelier_nom: string;
}

const MOTIF_LABEL: Record<string, string> = {
  recharge:         "Recharge",
  demande_tuning:   "Demande tuning",
  remboursement:    "Remboursement",
  ajustement_admin: "Ajustement admin",
};

interface Props { entries: LedgerEntry[]; ateliers: string[]; }

export function FinancePanel({ entries, ateliers }: Props) {
  const [atelierFilter, setAtelierFilter] = useState("");
  const [fromDate, setFromDate]           = useState("");
  const [toDate, setToDate]               = useState("");

  const filtered = useMemo(() => entries.filter((e) => {
    if (atelierFilter && e.atelier_nom !== atelierFilter) return false;
    if (fromDate && e.created_at < fromDate) return false;
    if (toDate && e.created_at > toDate + "T23:59:59") return false;
    return true;
  }), [entries, atelierFilter, fromDate, toDate]);

  function downloadCsv() {
    const header = "Date,Atelier,Motif,Note,Delta";
    const rows = filtered.map((e) =>
      [
        new Date(e.created_at).toLocaleString("fr-FR"),
        `"${e.atelier_nom}"`,
        MOTIF_LABEL[e.motif] ?? e.motif,
        `"${(e.note ?? "").replace(/"/g, '""')}"`,
        e.delta,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const a   = document.createElement("a");
    a.href    = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `sbfiles-finance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalDelta = filtered.reduce((s, e) => s + e.delta, 0);

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-[11px] uppercase tracking-wider text-white/40">Atelier</label>
          <select value={atelierFilter} onChange={(e) => setAtelierFilter(e.target.value)}
            className="bg-[#0B0C10] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F5C842]/50">
            <option value="">Tous</option>
            {ateliers.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider text-white/40">De</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="bg-[#0B0C10] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F5C842]/50" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider text-white/40">À</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="bg-[#0B0C10] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F5C842]/50" />
        </div>
        <button onClick={downloadCsv}
          className="ml-auto px-4 py-1.5 border border-[#F5C842]/30 text-[#F5C842] text-xs font-medium rounded cursor-pointer hover:bg-[#F5C842]/10 transition-colors duration-150">
          ↓ Exporter CSV
        </button>
      </div>

      {/* Résumé */}
      <div className="text-sm text-white/50">
        {filtered.length} ligne{filtered.length !== 1 ? "s" : ""} —
        bilan : <span className={totalDelta >= 0 ? "text-green-400" : "text-red-400"}>
          {totalDelta >= 0 ? "+" : ""}{totalDelta}
        </span>
      </div>

      {/* Tableau */}
      <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.07] text-[11px] text-white/40 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Atelier</th>
              <th className="text-left px-5 py-3">Motif</th>
              <th className="text-left px-5 py-3">Note</th>
              <th className="text-right px-5 py-3">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">Aucun mouvement.</td></tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                <td className="px-5 py-3 text-white/50 text-xs whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-5 py-3">{e.atelier_nom}</td>
                <td className="px-5 py-3 text-white/60">{MOTIF_LABEL[e.motif] ?? e.motif}</td>
                <td className="px-5 py-3 text-white/40 text-xs max-w-[200px] truncate">{e.note ?? "—"}</td>
                <td className={`px-5 py-3 text-right font-mono font-semibold tabular-nums ${e.delta > 0 ? "text-green-400" : "text-red-400"}`}>
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
