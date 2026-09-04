"use client";

import { useState } from "react";
import type { Atelier, AtelierStatut } from "@/lib/types";

const STATUS_LABEL: Record<AtelierStatut, string> = {
  en_attente: "En attente",
  approuve:   "Approuvé",
  refuse:     "Refusé",
};
const STATUS_BADGE: Record<AtelierStatut, string> = {
  en_attente: "bg-soft text-mute",
  approuve:   "bg-[#ECFDF5] text-[#047857]",
  refuse:     "bg-[#FEF2F2] text-[#B91C1C]",
};

interface AtelierWithSolde extends Atelier {
  solde?: number;
}

interface Props {
  ateliers:       AtelierWithSolde[];
  approuverAction:(id: string)               => Promise<{ ok: boolean; message?: string }>;
  refuserAction:  (id: string, note: string) => Promise<{ ok: boolean; message?: string }>;
  ajusterAction:  (id: string, delta: number, note: string) => Promise<{ ok: boolean; nouveau_solde?: number; message?: string }>;
}

export function AteliersTable({ ateliers, approuverAction, refuserAction, ajusterAction }: Props) {
  const [filter, setFilter]     = useState<AtelierStatut | "">("");
  const [modal, setModal]       = useState<AtelierWithSolde | null>(null);
  const [refusNote, setRefusNote] = useState("");
  const [adjDelta, setAdjDelta] = useState<number>(0);
  const [adjNote, setAdjNote]   = useState("");
  const [msg, setMsg]           = useState("");
  const [busy, setBusy]         = useState(false);

  const STATUTS: AtelierStatut[] = ["en_attente","approuve","refuse"];

  const filtered = filter ? ateliers.filter((a) => a.statut === filter) : ateliers;

  function openModal(a: AtelierWithSolde) {
    setModal(a); setMsg(""); setRefusNote(""); setAdjDelta(0); setAdjNote("");
  }

  async function handleApprouver() {
    if (!modal) return;
    setBusy(true);
    const res = await approuverAction(modal.id);
    setBusy(false);
    setMsg(res.ok ? "✓ Atelier approuvé." : `✗ ${res.message}`);
  }

  async function handleRefuser() {
    if (!modal || !refusNote.trim()) { setMsg("Motif requis."); return; }
    setBusy(true);
    const res = await refuserAction(modal.id, refusNote.trim());
    setBusy(false);
    setMsg(res.ok ? "✓ Atelier refusé." : `✗ ${res.message}`);
  }

  async function handleAdjust() {
    if (!modal || adjDelta === 0 || !adjNote.trim()) { setMsg("Delta et note requis."); return; }
    setBusy(true);
    const res = await ajusterAction(modal.id, adjDelta, adjNote.trim());
    setBusy(false);
    setMsg(res.ok ? `✓ Nouveau solde : ${res.nouveau_solde} token(s).` : `✗ ${res.message}`);
  }

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-[background,border-color,color] duration-150 ${!filter ? "bg-ember text-white border-ember" : "bg-card text-ink2 border-line hover:border-ink2"}`}
        >
          Tous ({ateliers.length})
        </button>
        {STATUTS.map((s) => {
          const count = ateliers.filter((a) => a.statut === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilter(s === filter ? "" : s)}
              className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-[background,border-color,color] duration-150 ${filter === s ? "bg-ember text-white border-ember" : "bg-card text-ink2 border-line hover:border-ink2"}`}
            >
              {STATUS_LABEL[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="border border-line rounded-[10px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-soft border-b border-line text-ink2 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Atelier</th>
              <th className="text-left px-4 py-3">Ville</th>
              <th className="text-left px-4 py-3">Téléphone</th>
              <th className="text-left px-4 py-3">Solde</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Inscription</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-mute text-sm">Aucun atelier.</td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-soft/40">
                <td className="px-4 py-3 font-medium">{a.nom}</td>
                <td className="px-4 py-3 text-ink2">{a.ville ?? "—"}</td>
                <td className="px-4 py-3 text-ink2">{a.telephone ?? "—"}</td>
                <td className="px-4 py-3 font-mono">{a.solde ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[a.statut]}`}>
                    {STATUS_LABEL[a.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-mute text-xs">
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openModal(a)}
                    className="text-xs font-medium px-3 py-1 border border-line2 rounded text-ink2 hover:border-ink2 cursor-pointer transition-colors duration-150"
                  >
                    Gérer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modale gestion atelier */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-[14px] shadow-card-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-display text-xl">{modal.nom}</h2>
              <button onClick={() => setModal(null)} className="text-mute hover:text-ink text-lg leading-none cursor-pointer">✕</button>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
              <dt className="text-mute">Statut</dt>
              <dd>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[modal.statut]}`}>
                  {STATUS_LABEL[modal.statut]}
                </span>
              </dd>
              <dt className="text-mute">Solde</dt><dd>{modal.solde ?? 0} tokens</dd>
              <dt className="text-mute">Ville</dt><dd>{modal.ville ?? "—"}</dd>
              <dt className="text-mute">Téléphone</dt><dd>{modal.telephone ?? "—"}</dd>
              {modal.adresse && <><dt className="text-mute">Adresse</dt><dd>{modal.adresse}</dd></>}
            </dl>

            {msg && (
              <p className={`text-sm font-medium mb-4 ${msg.startsWith("✓") ? "text-ok" : "text-ember"}`} role="alert">
                {msg}
              </p>
            )}

            {/* Actions d'approbation */}
            {modal.statut === "en_attente" && (
              <div className="border-t border-line pt-4 space-y-3">
                <p className="text-sm font-medium">Validation</p>
                <button
                  onClick={handleApprouver}
                  disabled={busy}
                  className="w-full bg-ok text-white text-sm font-semibold py-2 rounded cursor-pointer transition-colors duration-150 disabled:opacity-50"
                  style={{ background: "#12A150" }}
                >
                  {busy ? "…" : "Approuver l'atelier"}
                </button>
                <textarea
                  rows={2}
                  placeholder="Motif de refus (obligatoire)"
                  value={refusNote}
                  onChange={(e) => setRefusNote(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ember resize-none"
                />
                <button
                  onClick={handleRefuser}
                  disabled={busy || !refusNote.trim()}
                  className="w-full border border-[#B91C1C] text-[#B91C1C] text-sm font-medium py-2 rounded cursor-pointer hover:bg-[#FEF2F2] transition-colors duration-150 disabled:opacity-50"
                >
                  Refuser
                </button>
              </div>
            )}

            {/* Ajustement de solde */}
            {modal.statut === "approuve" && (
              <div className="border-t border-line pt-4 space-y-3">
                <p className="text-sm font-medium">Ajustement de solde</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={adjDelta || ""}
                    onChange={(e) => setAdjDelta(parseInt(e.target.value) || 0)}
                    placeholder="±delta (ex. 5 ou -2)"
                    className="flex-1 bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ember"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Note obligatoire…"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ember resize-none"
                />
                <button
                  onClick={handleAdjust}
                  disabled={busy || adjDelta === 0 || !adjNote.trim()}
                  className="w-full bg-ember text-white text-sm font-semibold py-2 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50"
                >
                  {busy ? "…" : "Appliquer l'ajustement"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
