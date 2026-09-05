"use client";

import { useState } from "react";

interface Setting { cle: string; valeur: string; updated_at: string; }

const SETTING_LABEL: Record<string, string> = {
  token_dzd: "Valeur d'un token (DZD)",
};

interface Props {
  settings:     Setting[];
  updateAction: (cle: string, valeur: string) => Promise<{ ok: boolean; message?: string }>;
}

export function ReglagesPanel({ settings, updateAction }: Props) {
  const [vals, setVals]   = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.cle, s.valeur]))
  );
  const [msgs, setMsgs]   = useState<Record<string, string>>({});
  const [busy, setBusy]   = useState<Record<string, boolean>>({});

  async function save(cle: string) {
    setBusy((b) => ({ ...b, [cle]: true }));
    const res = await updateAction(cle, vals[cle] ?? "");
    setBusy((b) => ({ ...b, [cle]: false }));
    setMsgs((m) => ({ ...m, [cle]: res.ok ? "✓ Enregistré" : `✗ ${res.message}` }));
  }

  return (
    <div className="space-y-4">
      {settings.map((s) => (
        <div key={s.cle} className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
          <label className="block text-sm font-semibold text-white mb-1">
            {SETTING_LABEL[s.cle] ?? s.cle}
          </label>
          <p className="text-[11px] text-white/30 font-mono mb-3">cle: {s.cle}</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={vals[s.cle] ?? ""}
              onChange={(e) => setVals((v) => ({ ...v, [s.cle]: e.target.value }))}
              className="flex-1 bg-[#0B0C10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F5C842]/50"
            />
            <button onClick={() => save(s.cle)} disabled={busy[s.cle]}
              className="px-4 py-2 bg-[#F5C842] text-[#0B0C10] text-sm font-bold rounded cursor-pointer hover:bg-[#F5C842]/90 transition-colors duration-150 disabled:opacity-50 whitespace-nowrap">
              {busy[s.cle] ? "…" : "Enregistrer"}
            </button>
          </div>
          {msgs[s.cle] && (
            <p className={`mt-2 text-xs font-medium ${msgs[s.cle].startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
              {msgs[s.cle]}
            </p>
          )}
          <p className="mt-2 text-[11px] text-white/20">
            Mis à jour le {new Date(s.updated_at).toLocaleString("fr-FR")}
          </p>
        </div>
      ))}
      {settings.length === 0 && (
        <p className="text-white/30 text-sm">Aucun paramètre.</p>
      )}
    </div>
  );
}
