"use client";

import { useState } from "react";
import type { TokenRequest, TokenRequestStatut } from "@/lib/types";

const ALL_STATUTS: TokenRequestStatut[] = [
  "en_attente","code_genere","expediee","livree","utilisee","annulee",
];

const STATUS_LABEL: Record<TokenRequestStatut, string> = {
  en_attente:  "En attente",
  code_genere: "Code généré",
  expediee:    "Expédiée",
  livree:      "Livrée",
  utilisee:    "Utilisée",
  annulee:     "Annulée",
};

const STATUS_BADGE: Record<TokenRequestStatut, string> = {
  en_attente:  "bg-soft text-mute",
  code_genere: "bg-[#EFF6FF] text-[#1D4ED8]",
  expediee:    "bg-ember-soft text-ember-ink",
  livree:      "bg-[#ECFDF5] text-[#047857]",
  utilisee:    "bg-[#F5F3FF] text-[#6D28D9]",
  annulee:     "bg-soft text-mute",
};

interface Props {
  requests: (TokenRequest & { code_indice?: string; atelier_nom?: string })[];
  generateCodeAction: (requestId: string, tokens: number, jours: number) => Promise<{ ok: boolean; code?: string; message?: string }>;
  markShippedAction:  (requestId: string, transporteur: string, numero: string) => Promise<{ ok: boolean; message?: string }>;
}

export function RechargeTable({ requests, generateCodeAction, markShippedAction }: Props) {
  const [filter, setFilter]           = useState<TokenRequestStatut | "">("");
  const [modal, setModal]             = useState<TokenRequest | null>(null);
  const [genTokens, setGenTokens]     = useState(1);
  const [genJours, setGenJours]       = useState(30);
  const [genResult, setGenResult]     = useState<{ code: string } | null>(null);
  const [generating, setGenerating]   = useState(false);
  const [copied, setCopied]           = useState(false);
  const [shipModal, setShipModal]     = useState<TokenRequest | null>(null);
  const [transporteur, setTransporteur] = useState("");
  const [numero, setNumero]           = useState("");
  const [shipping, setShipping]       = useState(false);
  const [shipMsg, setShipMsg]         = useState("");

  const filtered = filter
    ? requests.filter((r) => r.statut === filter)
    : requests;

  async function handleGenerate() {
    if (!modal) return;
    setGenerating(true);
    const res = await generateCodeAction(modal.id, genTokens, genJours);
    setGenerating(false);
    if (res.ok && res.code) {
      setGenResult({ code: res.code });
    } else {
      alert(res.message ?? "Erreur.");
      setModal(null);
    }
  }

  async function handleShip() {
    if (!shipModal) return;
    setShipping(true);
    const res = await markShippedAction(shipModal.id, transporteur, numero);
    setShipping(false);
    setShipMsg(res.ok ? "✓ Statut mis à jour." : `✗ ${res.message}`);
    if (res.ok) { setTransporteur(""); setNumero(""); }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {/* Filtre */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-[background,border-color,color] duration-150 ${
            !filter ? "bg-ember text-white border-ember" : "bg-card text-ink2 border-line hover:border-ink2"
          }`}
        >
          Toutes ({requests.length})
        </button>
        {ALL_STATUTS.map((s) => {
          const count = requests.filter((r) => r.statut === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilter(s === filter ? "" : s)}
              className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-[background,border-color,color] duration-150 ${
                filter === s ? "bg-ember text-white border-ember" : "bg-card text-ink2 border-line hover:border-ink2"
              }`}
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
              <th className="text-left px-4 py-3">Tokens</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Code (4 derniers)</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-mute text-sm">
                  Aucune demande.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-soft/40">
                <td className="px-4 py-3 font-medium">{r.atelier_nom ?? r.atelier_id.slice(0, 8)}</td>
                <td className="px-4 py-3">{r.tokens_demandes}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.statut]}`}>
                    {STATUS_LABEL[r.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {r.code_indice ? `••••-••••-${r.code_indice}` : "—"}
                </td>
                <td className="px-4 py-3 text-mute text-xs">
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {r.statut === "en_attente" && (
                      <button
                        onClick={() => { setModal(r); setGenTokens(r.tokens_demandes); setGenResult(null); }}
                        className="text-xs font-medium px-3 py-1 border border-ember rounded text-ember hover:bg-ember-soft cursor-pointer transition-colors duration-150"
                      >
                        Générer un code
                      </button>
                    )}
                    {r.statut === "code_genere" && (
                      <button
                        onClick={() => { setShipModal(r); setShipMsg(""); }}
                        className="text-xs font-medium px-3 py-1 border border-line2 rounded text-ink2 hover:border-ink2 cursor-pointer transition-colors duration-150"
                      >
                        Marquer expédiée
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modale génération de code */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { if (!genResult) setModal(null); }}>
          <div className="bg-card rounded-[14px] shadow-card-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            {!genResult ? (
              <>
                <h2 className="font-display text-xl mb-4">Générer un code de recharge</h2>
                <p className="text-ink2 text-sm mb-4">
                  Demande : <strong>{modal.tokens_demandes} tokens</strong>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre de tokens</label>
                    <input
                      type="number"
                      min={1}
                      value={genTokens}
                      onChange={(e) => setGenTokens(parseInt(e.target.value) || 1)}
                      className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ember"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Validité (jours)</label>
                    <input
                      type="number"
                      min={1}
                      value={genJours}
                      onChange={(e) => setGenJours(parseInt(e.target.value) || 30)}
                      className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ember"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 border border-line2 bg-card text-ink2 text-sm font-medium py-2 rounded cursor-pointer hover:border-ink2 transition-colors duration-150"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 bg-ember text-white text-sm font-semibold py-2 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50"
                  >
                    {generating ? "Génération…" : "Générer"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl mb-2">Code généré</h2>
                <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                  ⚠ Ce code ne sera <strong>jamais affiché à nouveau</strong>. Copiez-le maintenant et transmettez-le à l&apos;atelier.
                </div>
                <div className="bg-ink text-white font-mono text-2xl font-bold tracking-[0.2em] text-center py-4 px-6 rounded-lg my-4 select-all">
                  {genResult.code}
                </div>
                <button
                  onClick={() => copyCode(genResult!.code)}
                  className="w-full border border-line2 text-ink2 text-sm font-medium py-2 rounded cursor-pointer hover:border-ink2 transition-colors duration-150"
                >
                  {copied ? "✓ Copié !" : "Copier le code"}
                </button>
                <button
                  onClick={() => { setModal(null); setGenResult(null); }}
                  className="w-full mt-2 bg-ember text-white text-sm font-semibold py-2 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150"
                >
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modale expédition */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShipModal(null)}>
          <div className="bg-card rounded-[14px] shadow-card-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl mb-4">Marquer comme expédiée</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Transporteur</label>
                <input
                  type="text"
                  value={transporteur}
                  onChange={(e) => setTransporteur(e.target.value)}
                  placeholder="ex. Yalidine, Zr Express…"
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ember"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Numéro de suivi</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Numéro de colis"
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ember"
                />
              </div>
            </div>
            {shipMsg && (
              <p className={`mt-3 text-sm font-medium ${shipMsg.startsWith("✓") ? "text-ok" : "text-ember"}`}>
                {shipMsg}
              </p>
            )}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShipModal(null)}
                className="flex-1 border border-line2 bg-card text-ink2 text-sm font-medium py-2 rounded cursor-pointer hover:border-ink2 transition-colors duration-150"
              >
                Fermer
              </button>
              <button
                onClick={handleShip}
                disabled={shipping}
                className="flex-1 bg-ember text-white text-sm font-semibold py-2 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50"
              >
                {shipping ? "Enregistrement…" : "Confirmer l'expédition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
