"use client";

import { useState } from "react";

interface Setting { cle: string; valeur: string; updated_at: string; }

type HistoryEntry = { cile_id: string; details: Record<string, unknown> | null; created_at: string; acteur_email: string };

const SETTING_LABEL: Record<string, string> = {
  token_dzd: "Valeur d'un token (DZD)",
};

interface Props {
  settings:     Setting[];
  history:      HistoryEntry[];
  updateAction: (cle: string, valeur: string) => Promise<{ ok: boolean; message?: string }>;
}

export function ReglagesPanel({ settings, history, updateAction }: Props) {
  const [vals, setVals]       = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.cle, s.valeur]))
  );
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [msgs, setMsgs]       = useState<Record<string, string>>({});
  const [busy, setBusy]       = useState<Record<string, boolean>>({});

  function requestSave(cle: string) {
    setPending((p) => ({ ...p, [cle]: true }));
    setMsgs((m) => ({ ...m, [cle]: "" }));
  }

  async function confirmSave(cle: string) {
    setBusy((b) => ({ ...b, [cle]: true }));
    const res = await updateAction(cle, vals[cle] ?? "");
    setBusy((b) => ({ ...b, [cle]: false }));
    setPending((p) => ({ ...p, [cle]: false }));
    setMsgs((m) => ({ ...m, [cle]: res.ok ? "✓ Enregistré" : `✗ ${res.message}` }));
  }

  function cancelSave(cle: string) {
    setPending((p) => ({ ...p, [cle]: false }));
    const orig = settings.find((s) => s.cle === cle);
    if (orig) setVals((v) => ({ ...v, [cle]: orig.valeur }));
    setMsgs((m) => ({ ...m, [cle]: "" }));
  }

  function historyFor(cle: string) {
    return history.filter((h) => h.cile_id === cle);
  }

  return (
    <div className="space-y-6">
      {settings.length === 0 && (
        <p className="text-white/30 text-sm">Aucun paramètre.</p>
      )}
      {settings.map((s) => {
        const entries = historyFor(s.cle);
        return (
          <div key={s.cle} className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
            <label className="block text-sm font-semibold text-white mb-1">
              {SETTING_LABEL[s.cle] ?? s.cle}
            </label>
            <p className="text-[11px] text-white/30 font-mono mb-3">cle: {s.cle}</p>

            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={vals[s.cle] ?? ""}
                onChange={(e) => {
                  setVals((v) => ({ ...v, [s.cle]: e.target.value }));
                  setPending((p) => ({ ...p, [s.cle]: false }));
                  setMsgs((m) => ({ ...m, [s.cle]: "" }));
                }}
                disabled={busy[s.cle]}
                className="flex-1 bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F5C842]/50 disabled:opacity-50"
              />
              {!pending[s.cle] ? (
                <button
                  onClick={() => requestSave(s.cle)}
                  disabled={busy[s.cle] || vals[s.cle] === s.valeur}
                  className="px-4 py-2 border border-[#F5C842]/30 text-[#F5C842] text-sm font-semibold rounded cursor-pointer hover:bg-[#F5C842]/10 transition-colors duration-150 disabled:opacity-40 whitespace-nowrap">
                  Enregistrer
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => cancelSave(s.cle)}
                    className="px-3 py-2 border border-white/10 text-white/50 text-sm rounded cursor-pointer hover:border-white/20 transition-colors duration-150">
                    Annuler
                  </button>
                  <button onClick={() => confirmSave(s.cle)} disabled={busy[s.cle]}
                    className="px-4 py-2 bg-[#F5C842] text-[#0B0C10] text-sm font-bold rounded cursor-pointer hover:bg-[#F5C842]/90 transition-colors duration-150 disabled:opacity-50 whitespace-nowrap">
                    {busy[s.cle] ? "…" : "Confirmer"}
                  </button>
                </div>
              )}
            </div>

            {pending[s.cle] && (
              <p className="text-xs text-amber-400/80 mb-2">
                Nouvelle valeur : <strong>{vals[s.cle]}</strong> — confirmez pour enregistrer.
              </p>
            )}
            {msgs[s.cle] && (
              <p className={`text-xs font-medium mb-2 ${msgs[s.cle].startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {msgs[s.cle]}
              </p>
            )}

            <p className="text-[11px] text-white/20 mb-4">
              Mis à jour le {new Date(s.updated_at).toLocaleString("fr-FR")}
            </p>

            {entries.length > 0 && (
              <div className="border-t border-white/[0.05] pt-4">
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Historique des modifications</p>
                <div className="space-y-1.5">
                  {entries.slice(0, 5).map((h, i) => {
                    const d = h.details as { ancienne_valeur?: string; nouvelle_valeur?: string } | null;
                    return (
                      <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-white/30 font-mono">
                          {d?.ancienne_valeur ?? "—"}
                          {" → "}
                          <span className="text-white/50">{d?.nouvelle_valeur ?? "—"}</span>
                        </span>
                        <span className="text-white/20 text-[10px] whitespace-nowrap">
                          {h.acteur_email} · {new Date(h.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
