"use client";

import { useState } from "react";

export function DownloadButton({
  path,
  nom,
  getUrl,
}: {
  path:   string;
  nom:    string | null;
  getUrl: (path: string) => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    const url = await getUrl(path);
    setBusy(false);
    if (!url) { alert("Fichier indisponible ou lien expiré."); return; }
    const a   = document.createElement("a");
    a.href     = url;
    a.download = nom ?? "fichier-tune.bin";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#ECFDF5] text-[#047857] rounded-[6px] hover:bg-[#D1FAE5] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {busy ? (
        "Génération…"
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Télécharger mon fichier
        </>
      )}
    </button>
  );
}
