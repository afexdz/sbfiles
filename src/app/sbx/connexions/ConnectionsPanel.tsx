"use client";

import { useState, useMemo } from "react";

interface LoginAttempt {
  id:         string;
  email:      string | null;
  ip:         string | null;
  user_agent: string | null;
  reussi:     boolean;
  created_at: string;
}

interface Props {
  attempts:      LoginAttempt[];
  suspiciousKeys: string[]; // "ip|email" pairs with 3+ recent failures
}

export function ConnectionsPanel({ attempts, suspiciousKeys }: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ok" | "fail">("");

  const suspicious = useMemo(() => new Set(suspiciousKeys), [suspiciousKeys]);

  const filtered = useMemo(() => attempts.filter((a) => {
    if (statusFilter === "ok"   && !a.reussi) return false;
    if (statusFilter === "fail" &&  a.reussi) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !a.email?.toLowerCase().includes(q) &&
        !a.ip?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }), [attempts, statusFilter, search]);

  const suspiciousCount = suspiciousKeys.length;

  return (
    <div className="space-y-5">
      {/* Warning banner */}
      {suspiciousCount > 0 && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-[12px] px-5 py-4">
          <p className="text-red-400 text-sm font-semibold mb-2">
            ⚠ {suspiciousCount} combinaison{suspiciousCount > 1 ? "s" : ""} IP / compte suspecte{suspiciousCount > 1 ? "s" : ""}
          </p>
          <p className="text-red-400/70 text-xs">
            3 échecs ou plus dans les 24 dernières heures depuis la même adresse IP sur le même compte.
            Les lignes concernées sont surlignées ci-dessous.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suspiciousKeys.map((key) => {
              const [ip, email] = key.split("|");
              return (
                <span key={key} className="inline-block px-2 py-0.5 bg-red-900/40 border border-red-800/40 rounded text-xs font-mono text-red-300">
                  {ip} → {email}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Rechercher email ou IP…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#13141A] border border-white/10 rounded-[8px] px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F5C842]/50 w-52"
        />
        <div className="flex gap-1">
          {([
            { value: "",     label: `Tous (${attempts.length})` },
            { value: "ok",   label: `Réussis (${attempts.filter((a) => a.reussi).length})` },
            { value: "fail", label: `Échecs (${attempts.filter((a) => !a.reussi).length})` },
          ] as const).map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors duration-150 ${statusFilter === value ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-white/30">{filtered.length} entrée{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.07] text-[11px] text-white/40 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">IP</th>
              <th className="text-left px-5 py-3">User-Agent</th>
              <th className="text-left px-5 py-3">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-white/30">
                  Aucune tentative de connexion.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const key         = `${a.ip}|${a.email}`;
              const isSuspicious = !a.reussi && suspicious.has(key);
              return (
                <tr key={a.id}
                  className={`border-b border-white/[0.05] last:border-0 ${
                    isSuspicious
                      ? "border-l-2 border-l-red-500 bg-red-900/10 hover:bg-red-900/15"
                      : "hover:bg-white/[0.03]"
                  }`}>
                  <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 text-xs">{a.email ?? "—"}</td>
                  <td className="px-5 py-3 text-xs font-mono">
                    {isSuspicious && <span className="inline-block mr-1 text-red-400">⚠</span>}
                    {a.ip ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-white/30 text-xs max-w-[240px] truncate" title={a.user_agent ?? undefined}>
                    {a.user_agent ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {a.reussi ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-900/30 text-green-400">
                        Réussi
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-900/30 text-red-400">
                        Échec
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
