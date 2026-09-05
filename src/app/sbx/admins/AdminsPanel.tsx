"use client";

import { useState, useMemo } from "react";
import type { Profile } from "@/lib/types";

type AdminAction = {
  id: string; action: string; cible_type: string | null; created_at: string; details: Record<string, unknown> | null;
};

const ROLE_BADGE: Record<string, string> = {
  admin:       "bg-white/10 text-white/70",
  super_admin: "bg-[#F5C842]/20 text-[#F5C842]",
};

interface Props {
  admins:           Profile[];
  promouvoirAction: (email: string)     => Promise<{ ok: boolean; message?: string }>;
  revoquerAction:   (profileId: string) => Promise<{ ok: boolean; message?: string }>;
  getActionsAction: (profileId: string) => Promise<AdminAction[]>;
}

export function AdminsPanel({ admins, promouvoirAction, revoquerAction, getActionsAction }: Props) {
  const [email, setEmail]           = useState("");
  const [promoMsg, setPromoMsg]     = useState("");
  const [promoBusy, setPromoBusy]   = useState(false);

  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "admin" | "super_admin">("");

  const [revokeId, setRevokeId]     = useState<string | null>(null);
  const [revokeMsg, setRevokeMsg]   = useState("");
  const [revokeBusy, setRevokeBusy] = useState(false);

  const [detail, setDetail]               = useState<Profile | null>(null);
  const [detailActions, setDetailActions] = useState<AdminAction[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filtered = useMemo(() => admins.filter((a) => {
    if (roleFilter && a.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!a.email?.toLowerCase().includes(q) && !a.nom?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [admins, search, roleFilter]);

  async function handlePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPromoBusy(true); setPromoMsg("");
    const res = await promouvoirAction(email.trim().toLowerCase());
    setPromoBusy(false);
    setPromoMsg(res.ok ? "✓ Compte promu admin." : `✗ ${res.message}`);
    if (res.ok) setEmail("");
  }

  async function handleRevoke(id: string) {
    setRevokeBusy(true); setRevokeMsg("");
    const res = await revoquerAction(id);
    setRevokeBusy(false);
    setRevokeMsg(res.ok ? "✓ Droits révoqués." : `✗ ${res.message}`);
    if (res.ok) setRevokeId(null);
  }

  async function openDetail(a: Profile) {
    setDetail(a);
    setDetailActions([]);
    setLoadingDetail(true);
    const actions = await getActionsAction(a.id);
    setDetailActions(actions);
    setLoadingDetail(false);
  }

  return (
    <div className="space-y-8">
      {/* Promote form */}
      <section className="bg-[#13141A] border border-white/[0.07] rounded-[14px] p-6">
        <h2 className="text-sm font-semibold text-white mb-1">Promouvoir un compte admin</h2>
        <p className="text-xs text-white/40 mb-4">
          Le compte doit déjà exister (s&apos;être inscrit via /inscription).
        </p>
        <form onSubmit={handlePromo} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            required
            className="flex-1 bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F5C842]/50"
          />
          <button type="submit" disabled={promoBusy}
            className="px-5 py-2 bg-[#F5C842] text-[#0B0C10] text-sm font-bold rounded cursor-pointer hover:bg-[#F5C842]/90 transition-colors duration-150 disabled:opacity-50 whitespace-nowrap">
            {promoBusy ? "…" : "Promouvoir admin"}
          </button>
        </form>
        {promoMsg && (
          <p className={`mt-3 text-sm font-medium ${promoMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
            {promoMsg}
          </p>
        )}
      </section>

      {/* List */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search + filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Rechercher nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#13141A] border border-white/10 rounded-[8px] px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F5C842]/50 w-52"
            />
            <div className="flex gap-1">
              {(["", "admin", "super_admin"] as const).map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors duration-150 ${roleFilter === r ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
                  {r === "" ? `Tous (${admins.length})` : r === "admin" ? `Admin (${admins.filter((a) => a.role === "admin").length})` : `Super Admin (${admins.filter((a) => a.role === "super_admin").length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/[0.07] text-xs text-white/40 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Nom</th>
                  <th className="text-left px-5 py-3">Rôle</th>
                  <th className="text-left px-5 py-3">Depuis</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">Aucun administrateur.</td></tr>
                )}
                {filtered.map((a) => (
                  <tr key={a.id}
                    onClick={() => openDetail(a)}
                    className={`border-b border-white/[0.05] last:border-0 cursor-pointer hover:bg-white/[0.03] ${detail?.id === a.id ? "bg-white/[0.05]" : ""}`}>
                    <td className="px-5 py-3 font-medium">{a.email ?? "—"}</td>
                    <td className="px-5 py-3 text-white/60">{a.nom ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[a.role] ?? ""}`}>
                        {a.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs">
                      {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {a.role !== "super_admin" && (
                        <button
                          onClick={() => { setRevokeId(a.id); setRevokeMsg(""); }}
                          className="text-xs px-3 py-1 border border-red-800/60 text-red-400 rounded hover:bg-red-900/20 cursor-pointer transition-colors duration-150">
                          Révoquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {detail && (
          <div className="w-[300px] shrink-0 bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{detail.nom ?? "—"}</p>
                <p className="text-xs text-white/40">{detail.email ?? "—"}</p>
              </div>
              <button onClick={() => setDetail(null)}
                className="text-white/30 hover:text-white text-xl leading-none cursor-pointer">×</button>
            </div>
            <div className="flex gap-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[detail.role] ?? ""}`}>
                {detail.role}
              </span>
              <span className="text-xs text-white/30">
                depuis {new Date(detail.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Actions récentes</p>
              {loadingDetail ? (
                <p className="text-white/30 text-xs">Chargement…</p>
              ) : detailActions.length === 0 ? (
                <p className="text-white/20 text-xs">Aucune action enregistrée.</p>
              ) : (
                <div className="space-y-2.5">
                  {detailActions.map((ac) => (
                    <div key={ac.id} className="border-b border-white/[0.05] pb-2 last:border-0">
                      <p className="text-xs font-mono text-[#F5C842]">{ac.action}</p>
                      {ac.cible_type && (
                        <p className="text-[10px] text-white/30">{ac.cible_type}</p>
                      )}
                      <p className="text-[10px] text-white/20">{new Date(ac.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Revoke modal */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setRevokeId(null)}>
          <div className="bg-[#13141A] border border-white/10 rounded-[14px] max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg text-white mb-2">Révoquer les droits admin</h3>
            <p className="text-sm text-white/50 mb-6">
              Le compte repassera au rôle « user ». Cette action est journalisée.
            </p>
            {revokeMsg && (
              <p className={`text-sm font-medium mb-4 ${revokeMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {revokeMsg}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setRevokeId(null)}
                className="flex-1 border border-white/10 text-white/60 text-sm py-2 rounded cursor-pointer hover:border-white/20 transition-colors duration-150">
                Annuler
              </button>
              <button onClick={() => handleRevoke(revokeId)} disabled={revokeBusy}
                className="flex-1 bg-red-700 text-white text-sm font-semibold py-2 rounded cursor-pointer hover:bg-red-600 transition-colors duration-150 disabled:opacity-50">
                {revokeBusy ? "…" : "Confirmer la révocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
