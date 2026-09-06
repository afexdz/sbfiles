"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GenererCodeResult } from "./codeActions";

type CodeStatus = "actif" | "utilise" | "expire";

interface CodeRow {
  id:             string;
  code_indice:    string;
  tokens:         number;
  expire_le:      string;
  utilise_le:     string | null;
  created_at:     string;
  computedStatus: CodeStatus;
}

interface RevealedCode {
  code:     string;
  tokens:   number;
  id:       string;
  expireAt: string;
}

const STATUS_LABEL: Record<CodeStatus, string> = { actif: "Actif", utilise: "Utilisé", expire: "Expiré" };
const STATUS_BADGE: Record<CodeStatus, string> = {
  actif:   "bg-green-900/30 text-green-400",
  utilise: "bg-white/10 text-white/40",
  expire:  "bg-red-900/30 text-red-400",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function toISODatetime(dateStr: string) {
  return new Date(dateStr + "T23:59:59").toISOString();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

// ── Canvas card export ────────────────────────────────────────────────────────

function exportCard(code: string, tokens: number) {
  const W = 856, H = 540, S = 2;
  const canvas = document.createElement("canvas");
  canvas.width  = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(S, S);

  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(0, 0, W, H, 28);
  } else {
    ctx.rect(0, 0, W, H);
  }
  ctx.clip();

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#111318");
  grad.addColorStop(1, "#0B0C10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(245,200,66,0.05)";
  ctx.beginPath(); ctx.arc(W - 80, 90, 220, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(245,200,66,0.03)";
  ctx.beginPath(); ctx.arc(80, H - 50, 180, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#F5C842";
  ctx.fillRect(0, 0, W, 6);

  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "#FFFFFF";
  ctx.font         = "bold 24px Arial, sans-serif";
  ctx.fillText("SBFiles", 44, 50);
  const bw = ctx.measureText("SBFiles").width;
  ctx.fillStyle = "#F5C842";
  ctx.fillText(" ·", 44 + bw, 50);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font      = "13px Arial, sans-serif";
  ctx.fillText("Code de recharge", 44, 78);

  ctx.fillStyle    = "#F5C842";
  ctx.font         = "bold 110px Arial, sans-serif";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(tokens), W / 2, H / 2 - 16);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font      = "500 16px Arial, sans-serif";
  ctx.fillText("TOKENS", W / 2, H / 2 + 68);

  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(60, H - 112);
  ctx.lineTo(W - 60, H - 112);
  ctx.stroke();

  ctx.fillStyle    = "rgba(255,255,255,0.85)";
  ctx.font         = "bold 28px 'Courier New', Courier, monospace";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(code, W / 2, H - 70);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font      = "11px Arial, sans-serif";
  ctx.fillText("À saisir dans votre espace atelier · sbfiles.com", W / 2, H - 38);

  const filename = `sbfiles-${code.replace(/-/g, "")}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  codes:           CodeRow[];
  tokenDzd:        number;
  genererAction:   (tokens: number, jours: number) => Promise<GenererCodeResult>;
  modifierAction:  (id: string, tokens: number, expireAt: string) => Promise<{ ok: boolean; error?: string }>;
  invaliderAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CodesPanel({ codes, tokenDzd, genererAction, modifierAction, invaliderAction }: Props) {
  const router = useRouter();

  const [rows, setRows] = useState<CodeRow[]>(codes);
  useEffect(() => { setRows(codes); }, [codes]);

  const [filter, setFilter] = useState<CodeStatus | "">("");

  const [showGen,   setShowGen]   = useState(false);
  const [genTokens, setGenTokens] = useState(5);
  const [genDebut,  setGenDebut]  = useState(todayStr);
  const [genFin,    setGenFin]    = useState(() => addDays(todayStr(), 30));
  const [genBusy,   setGenBusy]   = useState(false);
  const [genErr,    setGenErr]    = useState<string | null>(null);

  const [revealed, setRevealed] = useState<RevealedCode | null>(null);
  const [copied,   setCopied]   = useState(false);

  const [editRow,    setEditRow]    = useState<CodeRow | null>(null);
  const [editTokens, setEditTokens] = useState(0);
  const [editFin,    setEditFin]    = useState("");
  const [editBusy,   setEditBusy]   = useState(false);
  const [editErr,    setEditErr]    = useState<string | null>(null);

  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr,  setDeleteErr]  = useState<string | null>(null);

  const genValid = genTokens >= 1 && !!genDebut && !!genFin && genFin > genDebut;
  const genJours = genValid
    ? Math.max(1, Math.ceil((new Date(genFin).getTime() - new Date(genDebut).getTime()) / 86400000))
    : 0;

  const filtered = useMemo(() =>
    filter ? rows.filter((r) => r.computedStatus === filter) : rows,
    [rows, filter],
  );
  const counts = useMemo(() => ({
    actif:   rows.filter((r) => r.computedStatus === "actif").length,
    utilise: rows.filter((r) => r.computedStatus === "utilise").length,
    expire:  rows.filter((r) => r.computedStatus === "expire").length,
  }), [rows]);

  function openGenModal() {
    setGenErr(null);
    setGenTokens(5);
    setGenDebut(todayStr());
    setGenFin(addDays(todayStr(), 30));
    setShowGen(true);
  }

  async function handleGenerate() {
    if (!genValid) return;
    setGenBusy(true);
    setGenErr(null);
    const res = await genererAction(genTokens, genJours);
    setGenBusy(false);
    if (!res.ok) { setGenErr(res.error ?? "Erreur inconnue."); return; }

    setShowGen(false);
    setRevealed({ code: res.code!, tokens: res.tokens!, id: res.id!, expireAt: res.expireAt! });

    const now = new Date().toISOString();
    const newRow: CodeRow = {
      id:             res.id!,
      code_indice:    res.codeIndice!,
      tokens:         res.tokens!,
      expire_le:      res.expireAt!,
      utilise_le:     null,
      created_at:     res.createdAt ?? now,
      computedStatus: "actif",
    };
    setRows((prev) => [newRow, ...prev]);
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function dismissRevealed() {
    setRevealed(null);
    router.refresh();
  }

  function openEdit(row: CodeRow) {
    setEditRow(row);
    setEditTokens(row.tokens);
    setEditFin(row.expire_le.slice(0, 10));
    setEditErr(null);
  }

  async function handleEdit() {
    if (!editRow || editTokens < 1 || !editFin) return;
    setEditBusy(true);
    setEditErr(null);
    const res = await modifierAction(editRow.id, editTokens, toISODatetime(editFin));
    setEditBusy(false);
    if (!res.ok) { setEditErr(res.error ?? "Erreur."); return; }
    setRows((prev) => prev.map((r) => r.id === editRow.id
      ? { ...r, tokens: editTokens, expire_le: toISODatetime(editFin) }
      : r,
    ));
    setEditRow(null);
  }

  async function handleInvalidate() {
    if (!deleteId) return;
    setDeleteBusy(true);
    setDeleteErr(null);
    const res = await invaliderAction(deleteId);
    setDeleteBusy(false);
    if (!res.ok) { setDeleteErr(res.error ?? "Erreur."); return; }
    setRows((prev) => prev.map((r) => r.id === deleteId
      ? { ...r, expire_le: new Date(Date.now() - 1000).toISOString(), computedStatus: "expire" as CodeStatus }
      : r,
    ));
    setDeleteId(null);
  }

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilter("")}
            className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors duration-150 ${!filter ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
            Tous ({rows.length})
          </button>
          {(["actif", "utilise", "expire"] as CodeStatus[]).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors duration-150 ${filter === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}>
              {STATUS_LABEL[s]} ({counts[s]})
            </button>
          ))}
        </div>
        <button onClick={openGenModal}
          className="bg-[#F5C842] text-[#0B0C10] text-sm font-semibold px-4 py-2 rounded-[8px] hover:bg-[#f0c030] transition-colors duration-150 cursor-pointer shrink-0">
          + Générer un code
        </button>
      </div>

      {/* Revealed code — full-screen modal, z-[60] above the gen modal */}
      {revealed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-[540px] bg-[#13141A] border border-[#F5C842]/30 rounded-[20px] p-8 shadow-2xl">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#F5C842]/10 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5C842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h2 className="text-white font-display text-lg leading-tight">Code généré</h2>
                <p className="text-[#F5C842] text-xs font-medium mt-0.5">Affiché une seule fois — agissez maintenant</p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-[#F5C842]/[0.06] border border-[#F5C842]/20 rounded-[10px] px-4 py-3 mb-6">
              <p className="text-[#F5C842] text-sm font-medium">
                Ce code ne sera plus jamais affiché. Copiez-le ou exportez la carte maintenant.
              </p>
            </div>

            {/* Code */}
            <div className="bg-black/40 rounded-[12px] px-6 py-5 mb-6 text-center">
              <span className="font-mono text-[clamp(28px,6vw,42px)] font-bold text-white tracking-[0.25em] break-all select-all">
                {revealed.code}
              </span>
              <p className="text-white/25 text-xs mt-3 tabular-nums">
                {revealed.tokens} token{revealed.tokens !== 1 ? "s" : ""} · Expire le {fmtDate(revealed.expireAt)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <button onClick={() => handleCopy(revealed.code)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.07] hover:bg-white/[0.11] text-white text-sm rounded-[10px] transition-colors cursor-pointer font-medium">
                {copied ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg><span className="text-green-400">Copié !</span></>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier le code</>
                )}
              </button>
              <button onClick={() => exportCard(revealed.code, revealed.tokens)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 bg-[#F5C842]/[0.12] hover:bg-[#F5C842]/[0.2] text-[#F5C842] text-sm font-medium rounded-[10px] transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exporter en carte PNG
              </button>
            </div>

            {/* Dismiss — intentional, no X in corner */}
            <button onClick={dismissRevealed}
              className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-white/50 hover:text-white text-sm rounded-[10px] transition-colors cursor-pointer">
              J&apos;ai terminé, fermer
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.07] text-[11px] text-white/40 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Indice</th>
              <th className="text-right px-4 py-3">Tokens</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Expire le</th>
              <th className="text-left px-4 py-3">Créé le</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-white/30">Aucun code.</td></tr>
            )}
            {filtered.map((c) => {
              const isActive   = c.computedStatus === "actif";
              const isDeleting = deleteId === c.id;
              return (
                <tr key={c.id} className={`border-b border-white/[0.05] last:border-0 transition-colors ${isDeleting ? "bg-red-900/10" : "hover:bg-white/[0.02]"}`}>
                  <td className="px-5 py-3 font-mono">
                    <span className="text-white/30">••••-••••-</span>
                    <span className="text-white font-bold">{c.code_indice}</span>
                    {revealed?.id === c.id && (
                      <span className="ml-2 text-[10px] text-[#F5C842] font-medium">NEW</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#F5C842]">{c.tokens}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.computedStatus]}`}>
                      {STATUS_LABEL[c.computedStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{fmtDate(c.expire_le)}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {isActive && !isDeleting && (
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(c)}
                          className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer">
                          Modifier
                        </button>
                        <button onClick={() => { setDeleteErr(null); setDeleteId(c.id); }}
                          className="text-xs text-red-400/60 hover:text-red-400 transition-colors cursor-pointer">
                          Annuler
                        </button>
                      </div>
                    )}
                    {isActive && isDeleting && (
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {deleteErr && <span className="text-red-400 text-xs">{deleteErr}</span>}
                        <span className="text-xs text-white/50">Confirmer&nbsp;?</span>
                        <button onClick={handleInvalidate} disabled={deleteBusy}
                          className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer disabled:opacity-50">
                          {deleteBusy ? "…" : "Oui, annuler"}
                        </button>
                        <button onClick={() => { setDeleteId(null); setDeleteErr(null); }} disabled={deleteBusy}
                          className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer">
                          Non
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Generate modal */}
      {showGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-[440px] bg-[#13141A] border border-white/[0.07] rounded-[16px] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg text-white">Générer un code</h2>
              <button onClick={() => setShowGen(false)} aria-label="Fermer"
                className="text-white/30 hover:text-white transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">Nombre de tokens</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} max={9999}
                    value={genTokens}
                    onChange={(e) => setGenTokens(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-black/30 border border-white/[0.1] rounded-[8px] px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#F5C842]/50 transition-colors"
                  />
                  <span className="text-white/40 text-sm shrink-0 tabular-nums">
                    = {(genTokens * tokenDzd).toLocaleString("fr-FR")} <span className="text-white/25">DZD</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">Début</label>
                  <input
                    type="date" value={genDebut}
                    onChange={(e) => {
                      setGenDebut(e.target.value);
                      if (genFin <= e.target.value) setGenFin(addDays(e.target.value, 1));
                    }}
                    className="w-full bg-black/30 border border-white/[0.1] rounded-[8px] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5C842]/50 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">Expiration</label>
                  <input
                    type="date" value={genFin} min={addDays(genDebut, 1)}
                    onChange={(e) => setGenFin(e.target.value)}
                    className="w-full bg-black/30 border border-white/[0.1] rounded-[8px] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5C842]/50 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              {genValid && (
                <p className="text-white/30 text-xs">Validité : {genJours} jour{genJours > 1 ? "s" : ""}</p>
              )}

              {genErr && (
                <p className="text-red-400 text-xs bg-red-900/20 rounded-[6px] px-3 py-2">{genErr}</p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowGen(false)}
                className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-sm rounded-[8px] transition-colors cursor-pointer">
                Annuler
              </button>
              <button onClick={handleGenerate} disabled={!genValid || genBusy}
                className="flex-1 py-2.5 bg-[#F5C842] hover:bg-[#f0c030] text-[#0B0C10] text-sm font-semibold rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {genBusy ? "Génération…" : "Générer le code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-[400px] bg-[#13141A] border border-white/[0.07] rounded-[16px] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg text-white">Modifier le code</h2>
              <button onClick={() => setEditRow(null)} aria-label="Fermer"
                className="text-white/30 hover:text-white transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p className="text-white/30 text-xs font-mono mb-4">
              ••••-••••-<span className="text-white/60">{editRow.code_indice}</span>
              <span className="ml-2 text-white/20">Le code en clair n&apos;est pas modifiable.</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">Tokens</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} max={9999}
                    value={editTokens}
                    onChange={(e) => setEditTokens(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-black/30 border border-white/[0.1] rounded-[8px] px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#F5C842]/50 transition-colors"
                  />
                  <span className="text-white/30 text-xs shrink-0">{(editTokens * tokenDzd).toLocaleString("fr-FR")} DZD</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">Date d&apos;expiration</label>
                <input
                  type="date" value={editFin} min={todayStr()}
                  onChange={(e) => setEditFin(e.target.value)}
                  className="w-full bg-black/30 border border-white/[0.1] rounded-[8px] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5C842]/50 transition-colors [color-scheme:dark]"
                />
              </div>
              {editErr && (
                <p className="text-red-400 text-xs bg-red-900/20 rounded-[6px] px-3 py-2">{editErr}</p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setEditRow(null)}
                className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-sm rounded-[8px] transition-colors cursor-pointer">
                Annuler
              </button>
              <button onClick={handleEdit} disabled={editBusy || editTokens < 1 || !editFin}
                className="flex-1 py-2.5 bg-[#F5C842] hover:bg-[#f0c030] text-[#0B0C10] text-sm font-semibold rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {editBusy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
