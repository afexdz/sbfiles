"use client";

import { useState, useRef } from "react";
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
}

interface Props {
  demandes: EnrichedDemande[];
  telechargerFichier: (id: string) => Promise<{ ok: boolean; url?: string; message?: string }>;
  livrerDemande:      (fd: FormData)  => Promise<{ ok: boolean; message?: string }>;
  modifierDelai:      (id: string, delai: number) => Promise<{ ok: boolean; message?: string }>;
  refuserAction:      (id: string, note: string)  => Promise<{ ok: boolean; message?: string }>;
}

export function DemandTableAdx({
  demandes,
  telechargerFichier,
  livrerDemande,
  modifierDelai,
  refuserAction,
}: Props) {
  const [filter, setFilter]       = useState<DemandeStatut | "">("");
  const [detail, setDetail]       = useState<EnrichedDemande | null>(null);
  const [msg, setMsg]             = useState("");
  const [busy, setBusy]           = useState(false);
  const [refusNote, setRefusNote] = useState("");
  const [delaiEdit, setDelaiEdit] = useState<number>(24);
  const [livrerFile, setLivrerFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const STATUTS: DemandeStatut[] = ["recue", "en_cours", "livree", "refusee", "annulee"];
  const filtered = filter ? demandes.filter((d) => d.statut === filter) : demandes;

  function openDetail(d: EnrichedDemande) {
    setDetail(d);
    setMsg("");
    setRefusNote("");
    setDelaiEdit(d.delai_heures ?? 24);
    setLivrerFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleTelecharger() {
    if (!detail) return;
    setBusy(true);
    const res = await telechargerFichier(detail.id);
    setBusy(false);
    if (res.ok && res.url) {
      window.open(res.url, "_blank");
      setDetail((d) => d ? { ...d, statut: "en_cours", telecharge_le: new Date().toISOString() } : d);
      setMsg("✓ Fichier téléchargé, demande passée en cours.");
    } else {
      setMsg(`✗ ${res.message ?? "Erreur."}`);
    }
  }

  async function handleLivrer() {
    if (!detail || !livrerFile) { setMsg("Sélectionnez un fichier."); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("demandeId", detail.id);
    fd.append("file", livrerFile, livrerFile.name);
    const res = await livrerDemande(fd);
    setBusy(false);
    setMsg(res.ok ? "✓ Fichier livré." : `✗ ${res.message}`);
    if (res.ok) { setLivrerFile(null); setDetail((d) => d ? { ...d, statut: "livree" } : d); }
  }

  async function handleDelai() {
    if (!detail) return;
    setBusy(true);
    const res = await modifierDelai(detail.id, delaiEdit);
    setBusy(false);
    setMsg(res.ok ? `✓ Délai mis à jour : ${delaiEdit}h.` : `✗ ${res.message}`);
    if (res.ok) setDetail((d) => d ? { ...d, delai_heures: delaiEdit } : d);
  }

  async function handleRefuser() {
    if (!detail || !refusNote.trim()) { setMsg("Motif requis."); return; }
    setBusy(true);
    const res = await refuserAction(detail.id, refusNote.trim());
    setBusy(false);
    setMsg(res.ok ? "✓ Demande refusée et remboursée." : `✗ ${res.message}`);
    if (res.ok) setDetail((d) => d ? { ...d, statut: "refusee" } : d);
  }

  function elapsedLabel(d: EnrichedDemande): string {
    if (!d.telecharge_le) return "";
    const deadline = new Date(d.telecharge_le).getTime() + (d.delai_heures ?? 24) * 3_600_000;
    const rem = deadline - Date.now();
    if (rem <= 0) return "⚠ Dépassé";
    const h = Math.floor(rem / 3_600_000);
    const m = Math.floor((rem % 3_600_000) / 60_000);
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-[background,border-color,color] duration-150 ${!filter ? "bg-ember text-white border-ember" : "bg-card text-ink2 border-line hover:border-ink2"}`}>
          Toutes ({demandes.length})
        </button>
        {STATUTS.map((s) => {
          const count = demandes.filter((d) => d.statut === s).length;
          if (count === 0) return null;
          return (
            <button key={s} onClick={() => setFilter(s === filter ? "" : s)}
              className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-[background,border-color,color] duration-150 ${filter === s ? "bg-ember text-white border-ember" : "bg-card text-ink2 border-line hover:border-ink2"}`}>
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
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Délai</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-mute text-sm">Aucune demande.</td></tr>
            )}
            {filtered.map((d) => {
              const elapsed = elapsedLabel(d);
              return (
                <tr key={d.id} className="border-b border-line last:border-0 hover:bg-soft/40">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{d.reference}</td>
                  <td className="px-4 py-3 text-sm">{d.atelier_nom ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink2">{d.engine_nom ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink2">{d.tuning_nom ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[d.statut]}`}>
                      {STATUS_LABEL[d.statut]}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-mono ${elapsed.startsWith("⚠") ? "text-ember font-bold" : "text-ink2"}`}>
                    {elapsed || "—"}
                  </td>
                  <td className="px-4 py-3 text-mute text-xs whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(d)}
                      className="text-xs font-medium px-3 py-1 border border-line2 rounded text-ink2 hover:border-ink2 cursor-pointer transition-colors duration-150">
                      Gérer
                    </button>
                  </td>
                </tr>
              );
            })}
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
              <dt className="text-mute">Tokens</dt><dd>{detail.cout_tokens}</dd>
              <dt className="text-mute">Statut</dt>
              <dd><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[detail.statut]}`}>{STATUS_LABEL[detail.statut]}</span></dd>
              {detail.telecharge_le && (
                <>
                  <dt className="text-mute">Téléchargé le</dt>
                  <dd className="text-xs">{new Date(detail.telecharge_le).toLocaleString("fr-FR")}</dd>
                </>
              )}
            </dl>

            {msg && (
              <p className={`text-sm font-medium mb-4 ${msg.startsWith("✓") ? "text-ok" : "text-ember"}`} role="alert">{msg}</p>
            )}

            {/* Télécharger fichier original */}
            {!["livree","refusee","annulee"].includes(detail.statut) && (
              <div className="border-t border-line pt-4 mb-4">
                <p className="text-sm font-medium mb-2">Fichier original</p>
                <p className="text-xs text-ink2 mb-2 font-mono">{detail.fichier_original_nom}</p>
                <button onClick={handleTelecharger} disabled={busy}
                  className="w-full bg-soft border border-line2 text-ink text-sm font-medium py-2 rounded cursor-pointer hover:border-ink2 transition-colors duration-150 disabled:opacity-50">
                  {busy ? "…" : detail.statut === "recue" ? "↓ Télécharger & passer en cours" : "↓ Re-télécharger"}
                </button>
              </div>
            )}

            {/* Livrer */}
            {detail.statut === "en_cours" && (
              <div className="border-t border-line pt-4 mb-4">
                <p className="text-sm font-medium mb-2">Livrer le fichier tuné</p>
                <input ref={fileRef} type="file"
                  onChange={(e) => setLivrerFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-ink2 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-line2 file:text-xs file:font-medium file:bg-soft file:cursor-pointer mb-3"
                />
                <button onClick={handleLivrer} disabled={busy || !livrerFile}
                  className="w-full bg-ember text-white text-sm font-semibold py-2 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50">
                  {busy ? "Envoi…" : "Livrer"}
                </button>
              </div>
            )}

            {/* Modifier le délai */}
            {!["livree","refusee","annulee"].includes(detail.statut) && (
              <div className="border-t border-line pt-4 mb-4">
                <p className="text-sm font-medium mb-2">Délai de livraison (heures)</p>
                <div className="flex gap-2">
                  <input type="number" min={1} max={168} value={delaiEdit}
                    onChange={(e) => setDelaiEdit(parseInt(e.target.value) || 24)}
                    className="flex-1 bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ember" />
                  <button onClick={handleDelai} disabled={busy}
                    className="px-4 py-2 border border-line2 rounded text-sm font-medium text-ink2 hover:border-ink2 cursor-pointer transition-colors duration-150 disabled:opacity-50">
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Refuser */}
            {!["refusee","annulee","livree"].includes(detail.statut) && (
              <div className="border-t border-line pt-4">
                <p className="text-sm font-medium mb-2">Refuser et rembourser</p>
                <textarea rows={2} placeholder="Motif obligatoire…" value={refusNote}
                  onChange={(e) => setRefusNote(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ember resize-none mb-2" />
                <button onClick={handleRefuser} disabled={busy || !refusNote.trim()}
                  className="w-full border border-[#B91C1C] text-[#B91C1C] text-sm font-medium py-2 rounded cursor-pointer hover:bg-[#FEF2F2] transition-colors duration-150 disabled:opacity-50">
                  {busy ? "…" : "Refuser et rembourser"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
