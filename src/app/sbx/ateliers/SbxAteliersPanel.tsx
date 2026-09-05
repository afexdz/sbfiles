"use client";

import { useState, useMemo } from "react";
import type { Atelier, AtelierStatut } from "@/lib/types";

interface AtelierWithMeta extends Atelier {
  email?: string;
  solde:  number;
}

type LedgerEntry = { id: string; delta: number; motif: string; note: string | null; created_at: string };
type Demande     = { id: string; reference: string; statut: string; cout_tokens: number; created_at: string; livree_le: string | null };

const STATUS_LABEL: Record<AtelierStatut, string> = {
  en_attente: "En attente",
  approuve:   "Approuvé",
  refuse:     "Refusé",
};
const STATUS_BADGE: Record<AtelierStatut, string> = {
  en_attente: "bg-[#F5C842]/10 text-[#F5C842]",
  approuve:   "bg-green-900/30 text-green-400",
  refuse:     "bg-red-900/30 text-red-400",
};
const DEMANDE_BADGE: Record<string, string> = {
  recue:    "bg-white/10 text-white/60",
  en_cours: "bg-[#F5C842]/10 text-[#F5C842]",
  livree:   "bg-green-900/30 text-green-400",
  refusee:  "bg-red-900/30 text-red-400",
  annulee:  "bg-white/5 text-white/30",
};
const MOTIF_LABEL: Record<string, string> = {
  recharge:         "Recharge",
  demande_tuning:   "Demande tuning",
  remboursement:    "Remboursement",
  ajustement_admin: "Ajustement admin",
};

type ModalType = "approuver" | "refuser" | "ajuster";

interface Props {
  ateliers:          AtelierWithMeta[];
  approuverAction:   (id: string) => Promise<{ ok: boolean; message?: string }>;
  refuserAction:     (id: string, note: string) => Promise<{ ok: boolean; message?: string }>;
  ajusterAction:     (id: string, delta: number, note: string) => Promise<{ ok: boolean; nouveau_solde?: number; message?: string }>;
  getLedgerAction:   (id: string) => Promise<LedgerEntry[]>;
  getDemandesAction: (id: string) => Promise<Demande[]>;
}

export function SbxAteliersPanel({
  ateliers, approuverAction, refuserAction, ajusterAction, getLedgerAction, getDemandesAction,
}: Props) {
  const [filter, setFilter]   = useState<AtelierStatut | "">("");
  const [search, setSearch]   = useState("");

  const [selected, setSelected]           = useState<AtelierWithMeta | null>(null);
  const [ledger, setLedger]               = useState<LedgerEntry[]>([]);
  const [demandes, setDemandes]           = useState<Demande[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [modal, setModal]       = useState<{ type: ModalType; atelier: AtelierWithMeta } | null>(null);
  const [refusNote, setRefusNote] = useState("");
  const [adjDelta, setAdjDelta]   = useState("0");
  const [adjNote, setAdjNote]     = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const STATUTS: AtelierStatut[] = ["en_attente", "approuve", "refuse"];

  const filtered = useMemo(() => {
    let r = ateliers;
    if (filter) r = r.filter((a) => a.statut === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((a) =>
        a.nom.toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.ville ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [ateliers, filter, search]);

  async function openDetail(a: AtelierWithMeta) {
    setSelected(a);
    setLedger([]);
    setDemandes([]);
    setLoadingDetail(true);
    const [l, d] = await Promise.all([getLedgerAction(a.id), getDemandesAction(a.id)]);
    setLedger(l);
    setDemandes(d);
    setLoadingDetail(false);
  }

  function openModal(type: ModalType, atelier: AtelierWithMeta) {
    setModal({ type, atelier });
    setRefusNote(""); setAdjDelta("0"); setAdjNote(""); setActionMsg("");
  }

  async function executeAction() {
    if (!modal) return;
    setActionBusy(true);
    setActionMsg("");

    let res: { ok: boolean; message?: string; nouveau_solde?: number };
    if (modal.type === "approuver") {
      res = await approuverAction(modal.atelier.id);
    } else if (modal.type === "refuser") {
      res = await refuserAction(modal.atelier.id, refusNote);
    } else {
      res = await ajusterAction(modal.atelier.id, Number(adjDelta), adjNote);
    }

    setActionBusy(false);
    if (res.ok) {
      const label = modal.type === "approuver" ? "Atelier approuvé." : modal.type === "refuser" ? "Atelier refusé." : "Solde ajusté.";
      setActionMsg(`✓ ${label}`);
      if (modal.type === "ajuster" && res.nouveau_solde != null && selected?.id === modal.atelier.id) {
        setSelected((prev) => prev ? { ...prev, solde: res.nouveau_solde! } : null);
      }
      setTimeout(() => setModal(null), 1200);
    } else {
      setActionMsg(`✗ ${res.message}`);
    }
  }

  return (
    <div className="flex gap-6">
      {/* Table */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#13141A] border border-white/10 rounded-[8px] px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F5C842]/50 w-44"
          />
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilter("")}
              className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors duration-150 ${!filter ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
              Tous ({ateliers.length})
            </button>
            {STATUTS.map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors duration-150 ${filter === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
                {STATUS_LABEL[s]} ({ateliers.filter((a) => a.statut === s).length})
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-white/[0.07] rounded-[12px] px-5 py-10 text-center text-white/30 text-sm">
            Aucun atelier.
          </div>
        ) : (
          <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/[0.07] text-[11px] text-white/40 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Atelier</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Ville</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-right px-4 py-3">Tokens</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}
                    onClick={() => openDetail(a)}
                    className={`border-b border-white/[0.05] last:border-0 cursor-pointer hover:bg-white/[0.04] transition-colors duration-100 ${selected?.id === a.id ? "bg-white/[0.06]" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white text-sm">{a.nom}</p>
                      <p className="text-[11px] text-white/40">{a.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs hidden md:table-cell">{a.ville ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[a.statut]}`}>
                        {STATUS_LABEL[a.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#F5C842] text-sm">{a.solde}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {a.statut === "en_attente" && (
                          <>
                            <button onClick={() => openModal("approuver", a)}
                              className="text-[11px] px-2 py-1 border border-green-700/50 text-green-400 rounded hover:bg-green-900/20 cursor-pointer transition-colors duration-150">
                              Approuver
                            </button>
                            <button onClick={() => openModal("refuser", a)}
                              className="text-[11px] px-2 py-1 border border-red-800/50 text-red-400 rounded hover:bg-red-900/20 cursor-pointer transition-colors duration-150">
                              Refuser
                            </button>
                          </>
                        )}
                        <button onClick={() => openModal("ajuster", a)}
                          className="text-[11px] px-2 py-1 border border-white/10 text-white/50 rounded hover:bg-white/[0.05] cursor-pointer transition-colors duration-150">
                          Tokens
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[340px] shrink-0 space-y-4">
          <div className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white text-sm">{selected.nom}</h3>
                <p className="text-xs text-white/40">{selected.email ?? "—"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white text-xl leading-none cursor-pointer">×</button>
            </div>
            <div className="space-y-0">
              <DetailRow label="Statut">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[selected.statut]}`}>
                  {STATUS_LABEL[selected.statut]}
                </span>
              </DetailRow>
              <DetailRow label="Solde tokens">
                <span className="font-mono font-semibold text-[#F5C842]">{selected.solde}</span>
              </DetailRow>
              <DetailRow label="Ville">{selected.ville ?? "—"}</DetailRow>
              <DetailRow label="Adresse"><span className="break-words">{selected.adresse ?? "—"}</span></DetailRow>
              <DetailRow label="Téléphone">{selected.telephone ?? "—"}</DetailRow>
              <DetailRow label="RC">{selected.registre_commerce ?? "—"}</DetailRow>
              {selected.note_admin && (
                <DetailRow label="Note admin">
                  <span className="text-amber-400">{selected.note_admin}</span>
                </DetailRow>
              )}
              <DetailRow label="Inscrit le">
                {new Date(selected.created_at).toLocaleDateString("fr-FR")}
              </DetailRow>
            </div>
          </div>

          {loadingDetail ? (
            <div className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5 text-center text-white/30 text-sm">
              Chargement…
            </div>
          ) : (
            <>
              <div className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
                <h4 className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Historique tokens</h4>
                {ledger.length === 0 ? (
                  <p className="text-white/20 text-xs">Aucun mouvement.</p>
                ) : (
                  <div className="space-y-2.5">
                    {ledger.map((l) => (
                      <div key={l.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-white/60">{MOTIF_LABEL[l.motif] ?? l.motif}</p>
                          {l.note && <p className="text-[10px] text-white/30 truncate max-w-[180px]">{l.note}</p>}
                          <p className="text-[10px] text-white/20">{new Date(l.created_at).toLocaleString("fr-FR")}</p>
                        </div>
                        <span className={`text-xs font-mono font-semibold shrink-0 ${l.delta > 0 ? "text-green-400" : "text-red-400"}`}>
                          {l.delta > 0 ? `+${l.delta}` : l.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
                <h4 className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Demandes de tuning</h4>
                {demandes.length === 0 ? (
                  <p className="text-white/20 text-xs">Aucune demande.</p>
                ) : (
                  <div className="space-y-2.5">
                    {demandes.map((d) => (
                      <div key={d.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-white/60">{d.reference}</p>
                          <p className="text-[10px] text-white/20">{new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${DEMANDE_BADGE[d.statut] ?? "text-white/30"}`}>
                            {d.statut}
                          </span>
                          <p className="text-[10px] text-white/30 mt-0.5 font-mono">{d.cout_tokens}t</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !actionBusy && setModal(null)}>
          <div className="bg-[#13141A] border border-white/10 rounded-[14px] max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg text-white mb-1">
              {modal.type === "approuver" && "Approuver l'atelier"}
              {modal.type === "refuser"   && "Refuser l'atelier"}
              {modal.type === "ajuster"   && "Ajuster le solde"}
            </h3>
            <p className="text-sm text-white/50 mb-4">{modal.atelier.nom}</p>

            {modal.type === "approuver" && (
              <p className="text-sm text-white/40 mb-4">
                L&apos;atelier sera approuvé et pourra accéder à la plateforme. Action journalisée.
              </p>
            )}

            {modal.type === "refuser" && (
              <div className="mb-4">
                <label className="block text-xs text-white/40 mb-1">Note admin (optionnel)</label>
                <textarea value={refusNote} onChange={(e) => setRefusNote(e.target.value)}
                  rows={2} placeholder="Motif du refus…"
                  className="w-full bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#F5C842]/50 resize-none" />
              </div>
            )}

            {modal.type === "ajuster" && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Delta (positif ou négatif)</label>
                  <input type="number" value={adjDelta} onChange={(e) => setAdjDelta(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F5C842]/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Note *</label>
                  <input type="text" value={adjNote} onChange={(e) => setAdjNote(e.target.value)}
                    placeholder="Raison de l'ajustement…" required
                    className="w-full bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#F5C842]/50" />
                </div>
              </div>
            )}

            {actionMsg && (
              <p className={`text-sm font-medium mb-4 ${actionMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {actionMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => !actionBusy && setModal(null)} disabled={actionBusy}
                className="flex-1 border border-white/10 text-white/60 text-sm py-2 rounded cursor-pointer hover:border-white/20 transition-colors duration-150 disabled:opacity-50">
                Annuler
              </button>
              <button onClick={executeAction} disabled={actionBusy}
                className={`flex-1 text-sm font-semibold py-2 rounded cursor-pointer transition-colors duration-150 disabled:opacity-50 ${
                  modal.type === "refuser"   ? "bg-red-700 hover:bg-red-600 text-white"
                  : modal.type === "approuver" ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-[#F5C842] hover:bg-[#F5C842]/90 text-[#0B0C10]"
                }`}>
                {actionBusy ? "…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <span className="text-white/70 text-xs text-right">{children}</span>
    </div>
  );
}
