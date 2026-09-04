"use client";

import { useState } from "react";
import type { TuningDemande, DemandeStatut } from "@/lib/types";

const STATUS_LABEL: Record<DemandeStatut, string> = {
  recue:    "Reçue",
  en_cours: "En cours",
  livree:   "Livrée",
  refusee:  "Refusée",
  annulee:  "Annulée",
};

const STATUS_BADGE: Record<DemandeStatut, string> = {
  recue:    "bg-[#EFF6FF] text-[#1D4ED8]",
  en_cours: "bg-ember-soft text-ember-ink",
  livree:   "bg-[#ECFDF5] text-[#047857]",
  refusee:  "bg-[#FEF2F2] text-[#B91C1C]",
  annulee:  "bg-soft text-mute",
};

interface EnrichedDemande extends TuningDemande {
  atelier_nom?: string;
  engine_nom?: string;
  tuning_nom?: string;
  signed_url?: string;
}

interface Props {
  demandes:           EnrichedDemande[];
  getSignedUrl:       (demandeId: string) => Promise<string | null>;
  refuserAction:      (id: string, note: string) => Promise<{ ok: boolean; message?: string }>;
  livrerAction:       (id: string, tuneFile: File, nom: string) => Promise<{ ok: boolean; message?: string }>;
}

export function DemandTable({ demandes, getSignedUrl, refuserAction }: Props) {
  const [filter, setFilter]         = useState<DemandeStatut | "">("");
  const [detail, setDetail]         = useState<EnrichedDemande | null>(null);
  const [refusNote, setRefusNote]   = useState("");
  const [refusing, setRefusing]     = useState(false);
  const [refusMsg, setRefusMsg]     = useState("");
  const [signedUrl, setSignedUrl]   = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const STATUTS: DemandeStatut[] = ["recue","en_cours","livree","refusee","annulee"];

  const filtered = filter ? demandes.filter((d) => d.statut === filter) : demandes;

  async function openDetail(d: EnrichedDemande) {
    setDetail(d);
    setRefusNote("");
    setRefusMsg("");
    setSignedUrl(null);
    setLoadingUrl(true);
    const url = await getSignedUrl(d.id);
    setSignedUrl(url);
    setLoadingUrl(false);
  }

  async function handleRefuse() {
    if (!detail || !refusNote.trim()) { setRefusMsg("Motif requis."); return; }
    setRefusing(true);
    const res = await refuserAction(detail.id, refusNote.trim());
    setRefusing(false);
    setRefusMsg(res.ok ? "✓ Demande refusée et remboursée." : `✗ ${res.message}`);
  }

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-[background,border-color,color] duration-150 ${!filter ? "bg-ember text-white border-ember" : "bg-card text-ink2 border-line hover:border-ink2"}`}
        >
          Toutes ({demandes.length})
        </button>
        {STATUTS.map((s) => {
          const count = demandes.filter((d) => d.statut === s).length;
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
              <th className="text-left px-4 py-3">Réf.</th>
              <th className="text-left px-4 py-3">Atelier</th>
              <th className="text-left px-4 py-3">Moteur</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Tokens</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-mute text-sm">Aucune demande.</td>
              </tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0 hover:bg-soft/40">
                <td className="px-4 py-3 font-mono text-xs font-medium">{d.reference}</td>
                <td className="px-4 py-3 text-sm">{d.atelier_nom ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-ink2">{d.engine_nom ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-ink2">{d.tuning_nom ?? "—"}</td>
                <td className="px-4 py-3">{d.cout_tokens}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[d.statut]}`}>
                    {STATUS_LABEL[d.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-mute text-xs whitespace-nowrap">
                  {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openDetail(d)}
                    className="text-xs font-medium px-3 py-1 border border-line2 rounded text-ink2 hover:border-ink2 cursor-pointer transition-colors duration-150"
                  >
                    Détail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Panneau détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="bg-card rounded-[14px] shadow-card-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-display text-xl">{detail.reference}</h2>
              <button onClick={() => setDetail(null)} className="text-mute hover:text-ink text-lg leading-none cursor-pointer">✕</button>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
              <dt className="text-mute">Atelier</dt><dd>{detail.atelier_nom ?? "—"}</dd>
              <dt className="text-mute">Moteur</dt><dd>{detail.engine_nom ?? "—"}</dd>
              <dt className="text-mute">Type</dt><dd>{detail.tuning_nom ?? "—"}</dd>
              <dt className="text-mute">Options</dt><dd>{detail.option_ids.length > 0 ? `${detail.option_ids.length} option(s)` : "Aucune"}</dd>
              <dt className="text-mute">Coût</dt><dd>{detail.cout_tokens} tokens</dd>
              <dt className="text-mute">Fichier</dt><dd className="font-mono text-xs truncate">{detail.fichier_original_nom}</dd>
              <dt className="text-mute">Taille</dt><dd>{(detail.fichier_original_taille / 1024).toFixed(1)} Ko</dd>
              <dt className="text-mute">Statut</dt>
              <dd>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[detail.statut]}`}>
                  {STATUS_LABEL[detail.statut]}
                </span>
              </dd>
            </dl>

            {detail.note_atelier && (
              <div className="bg-soft rounded p-3 text-sm text-ink2 mb-4">
                <p className="text-xs text-mute mb-1">Note atelier</p>
                {detail.note_atelier}
              </div>
            )}

            {/* Téléchargement fichier original */}
            <div className="mb-4">
              <p className="text-xs text-mute mb-2 uppercase tracking-wider">Fichier original</p>
              {loadingUrl ? (
                <p className="text-sm text-mute">Chargement…</p>
              ) : signedUrl ? (
                <a
                  href={signedUrl}
                  download={detail.fichier_original_nom}
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "var(--ember)", textDecoration: "underline" }}
                >
                  ↓ Télécharger {detail.fichier_original_nom}
                </a>
              ) : (
                <p className="text-sm text-mute">URL indisponible.</p>
              )}
            </div>

            {/* Refuser */}
            {!["refusee","annulee","livree"].includes(detail.statut) && (
              <div className="border-t border-line pt-4">
                <p className="text-sm font-medium mb-2">Refuser et rembourser</p>
                <textarea
                  rows={2}
                  placeholder="Motif obligatoire…"
                  value={refusNote}
                  onChange={(e) => setRefusNote(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ember resize-none mb-2"
                />
                {refusMsg && (
                  <p className={`text-sm font-medium mb-2 ${refusMsg.startsWith("✓") ? "text-ok" : "text-ember"}`}>
                    {refusMsg}
                  </p>
                )}
                <button
                  onClick={handleRefuse}
                  disabled={refusing || !refusNote.trim()}
                  className="w-full border border-[#B91C1C] text-[#B91C1C] text-sm font-medium py-2 rounded cursor-pointer hover:bg-[#FEF2F2] transition-colors duration-150 disabled:opacity-50"
                >
                  {refusing ? "Traitement…" : "Refuser et rembourser"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
