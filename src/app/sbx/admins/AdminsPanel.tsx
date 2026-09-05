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

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(18);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map((n) => chars[n % chars.length]).join("");
}

interface Props {
  admins:           Profile[];
  creerAction:      (nom: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  modifierAction:   (userId: string, nom: string | null, newPassword: string | null) => Promise<{ ok: boolean; message?: string }>;
  supprimerAction:  (userId: string) => Promise<{ ok: boolean; message?: string }>;
  getActionsAction: (profileId: string) => Promise<AdminAction[]>;
}

export function AdminsPanel({ admins, creerAction, modifierAction, supprimerAction, getActionsAction }: Props) {
  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [cNom,     setCNom]     = useState("");
  const [cEmail,   setCEmail]   = useState("");
  const [cPass,    setCPass]    = useState("");
  const [cBusy,    setCBusy]    = useState(false);
  const [cMsg,     setCMsg]     = useState("");

  // List filters
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "admin" | "super_admin">("");

  // Modify panel
  const [modifyTarget, setModifyTarget]   = useState<Profile | null>(null);
  const [mNom,         setMNom]           = useState("");
  const [mPass,        setMPass]          = useState("");
  const [mBusy,        setMBusy]          = useState(false);
  const [mMsg,         setMMsg]           = useState("");
  const [detailActions, setDetailActions] = useState<AdminAction[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [dBusy,        setDBusy]        = useState(false);
  const [dMsg,         setDMsg]         = useState("");

  const filtered = useMemo(() => admins.filter((a) => {
    if (roleFilter && a.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!a.email?.toLowerCase().includes(q) && !a.nom?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [admins, search, roleFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!cNom.trim() || !cEmail.trim() || !cPass.trim()) return;
    setCBusy(true); setCMsg("");
    const res = await creerAction(cNom.trim(), cEmail.trim().toLowerCase(), cPass);
    setCBusy(false);
    if (res.ok) {
      setCMsg("✓ Administrateur créé.");
      setCNom(""); setCEmail(""); setCPass("");
      setTimeout(() => { setCMsg(""); setShowCreate(false); }, 2000);
    } else {
      setCMsg(`✗ ${res.message}`);
    }
  }

  async function openModify(a: Profile) {
    setModifyTarget(a);
    setMNom(a.nom ?? "");
    setMPass("");
    setMMsg("");
    setDetailActions([]);
    setLoadingDetail(true);
    const actions = await getActionsAction(a.id);
    setDetailActions(actions);
    setLoadingDetail(false);
  }

  async function handleModify(e: React.FormEvent) {
    e.preventDefault();
    if (!modifyTarget) return;
    setMBusy(true); setMMsg("");
    const nom  = mNom.trim() || null;
    const pass = mPass.trim() || null;
    if (!nom && !pass) { setMMsg("Aucun champ à modifier."); setMBusy(false); return; }
    const res = await modifierAction(modifyTarget.id, nom, pass);
    setMBusy(false);
    setMMsg(res.ok ? "✓ Modifications enregistrées." : `✗ ${res.message}`);
    if (res.ok) { setMPass(""); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDBusy(true); setDMsg("");
    const res = await supprimerAction(deleteTarget.id);
    setDBusy(false);
    if (res.ok) {
      setDeleteTarget(null);
    } else {
      setDMsg(`✗ ${res.message}`);
    }
  }

  return (
    <div className="space-y-8">
      {/* Create section */}
      <section className="bg-[#13141A] border border-white/[0.07] rounded-[14px] overflow-hidden">
        <button
          onClick={() => { setShowCreate((v) => !v); setCMsg(""); }}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-white hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer">
          <span>Créer un administrateur</span>
          <span className="text-white/40 text-xl leading-none">{showCreate ? "−" : "+"}</span>
        </button>

        {showCreate && (
          <form onSubmit={handleCreate} className="border-t border-white/[0.07] px-6 pb-6 pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1">Nom complet *</label>
                <input type="text" value={cNom} onChange={(e) => setCNom(e.target.value)}
                  placeholder="Prénom Nom" required
                  className="w-full bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#F5C842]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Adresse e-mail *</label>
                <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)}
                  placeholder="admin@exemple.com" required
                  className="w-full bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#F5C842]/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Mot de passe *</label>
              <div className="flex gap-2">
                <input type="text" value={cPass} onChange={(e) => setCPass(e.target.value)}
                  placeholder="Choisissez ou générez un mot de passe fort" required
                  className="flex-1 bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#F5C842]/50 font-mono" />
                <button type="button" onClick={() => setCPass(generatePassword())}
                  className="px-3 py-2 border border-white/10 text-white/50 text-xs rounded hover:bg-white/[0.05] hover:text-white/70 cursor-pointer transition-colors duration-150 whitespace-nowrap">
                  Générer
                </button>
              </div>
              <p className="text-[10px] text-white/20 mt-1">
                Ce mot de passe sera à transmettre à l&apos;administrateur. Il pourra le modifier après connexion.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={cBusy}
                className="px-5 py-2 bg-[#F5C842] text-[#0B0C10] text-sm font-bold rounded cursor-pointer hover:bg-[#F5C842]/90 transition-colors duration-150 disabled:opacity-50">
                {cBusy ? "Création…" : "Créer le compte admin"}
              </button>
              {cMsg && (
                <p className={`text-sm font-medium ${cMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                  {cMsg}
                </p>
              )}
            </div>
          </form>
        )}
      </section>

      {/* List */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input type="text" placeholder="Rechercher nom ou email…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#13141A] border border-white/10 rounded-[8px] px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F5C842]/50 w-52" />
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
                    className={`border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] ${modifyTarget?.id === a.id ? "bg-white/[0.05]" : ""}`}>
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
                    <td className="px-5 py-3 text-right">
                      {a.role !== "super_admin" && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openModify(a)}
                            className="text-xs px-3 py-1 border border-white/10 text-white/50 rounded hover:bg-white/[0.05] cursor-pointer transition-colors duration-150">
                            Modifier
                          </button>
                          <button onClick={() => { setDeleteTarget(a); setDMsg(""); }}
                            className="text-xs px-3 py-1 border border-red-800/60 text-red-400 rounded hover:bg-red-900/20 cursor-pointer transition-colors duration-150">
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modify panel */}
        {modifyTarget && (
          <div className="w-[300px] shrink-0 bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{modifyTarget.nom ?? "—"}</p>
                <p className="text-xs text-white/40">{modifyTarget.email ?? "—"}</p>
              </div>
              <button onClick={() => setModifyTarget(null)}
                className="text-white/30 hover:text-white text-xl leading-none cursor-pointer">×</button>
            </div>

            <form onSubmit={handleModify} className="space-y-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Nom</label>
                <input type="text" value={mNom} onChange={(e) => setMNom(e.target.value)}
                  placeholder="Prénom Nom"
                  className="w-full bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#F5C842]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Nouveau mot de passe</label>
                <div className="flex gap-1.5">
                  <input type="text" value={mPass} onChange={(e) => setMPass(e.target.value)}
                    placeholder="Laisser vide = inchangé"
                    className="flex-1 min-w-0 bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#F5C842]/50 font-mono" />
                  <button type="button" onClick={() => setMPass(generatePassword())}
                    className="px-2 py-2 border border-white/10 text-white/40 text-[11px] rounded hover:bg-white/[0.05] cursor-pointer transition-colors duration-150 whitespace-nowrap">
                    Gen
                  </button>
                </div>
              </div>
              <button type="submit" disabled={mBusy}
                className="w-full py-2 bg-[#F5C842] text-[#0B0C10] text-sm font-bold rounded cursor-pointer hover:bg-[#F5C842]/90 transition-colors duration-150 disabled:opacity-50">
                {mBusy ? "…" : "Enregistrer"}
              </button>
              {mMsg && (
                <p className={`text-xs font-medium ${mMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                  {mMsg}
                </p>
              )}
            </form>

            <div className="border-t border-white/[0.05] pt-4">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">Actions récentes</p>
              {loadingDetail ? (
                <p className="text-white/20 text-xs">Chargement…</p>
              ) : detailActions.length === 0 ? (
                <p className="text-white/20 text-xs">Aucune action.</p>
              ) : (
                <div className="space-y-2">
                  {detailActions.map((ac) => (
                    <div key={ac.id} className="border-b border-white/[0.04] pb-2 last:border-0">
                      <p className="text-xs font-mono text-[#F5C842]">{ac.action}</p>
                      {ac.cible_type && <p className="text-[10px] text-white/30">{ac.cible_type}</p>}
                      <p className="text-[10px] text-white/20">{new Date(ac.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !dBusy && setDeleteTarget(null)}>
          <div className="bg-[#13141A] border border-white/10 rounded-[14px] max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg text-white mb-2">Supprimer l&apos;administrateur</h3>
            <p className="text-sm text-white/60 mb-1">
              <span className="text-white font-medium">{deleteTarget.email}</span>
            </p>
            <p className="text-sm text-white/40 mb-6">
              Le compte sera définitivement supprimé. Cette action est irréversible et journalisée.
            </p>
            {dMsg && (
              <p className="text-sm font-medium mb-4 text-red-400">{dMsg}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => !dBusy && setDeleteTarget(null)} disabled={dBusy}
                className="flex-1 border border-white/10 text-white/60 text-sm py-2 rounded cursor-pointer hover:border-white/20 transition-colors duration-150 disabled:opacity-50">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={dBusy}
                className="flex-1 bg-red-700 text-white text-sm font-semibold py-2 rounded cursor-pointer hover:bg-red-600 transition-colors duration-150 disabled:opacity-50">
                {dBusy ? "…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
