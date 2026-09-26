"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { TuningDemande } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EnrichedDemande extends TuningDemande {
  atelier_nom?:  string;
  engine_nom?:   string;
  tuning_nom?:   string;
  brand_nom?:    string;
  model_nom?:    string;
  period_nom?:   string;
  option_noms?:  string[];
}

type Tab = "a_prendre" | "en_cours" | "livrees";

interface Props {
  aPrendre:               EnrichedDemande[];
  mesEnCours:             EnrichedDemande[];
  mesLivrees:             EnrichedDemande[];
  prendreEnChargeAction:  (id: string)          => Promise<{ ok: boolean; message?: string }>;
  telechargerAction:      (id: string)          => Promise<{ ok: boolean; url?: string; message?: string }>;
  livrerAction:           (fd: FormData)        => Promise<{ ok: boolean; message?: string }>;
  refuserAction:          (id: string, note: string) => Promise<{ ok: boolean; message?: string }>;
  modifierDelaiAction:    (id: string, delai: number) => Promise<{ ok: boolean; message?: string }>;
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function useCountdown() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

function countdown(d: EnrichedDemande): { label: string; overdue: boolean } {
  if (!d.telecharge_le) return { label: "—", overdue: false };
  const deadline = new Date(d.telecharge_le).getTime() + (d.delai_heures ?? 24) * 3_600_000;
  const rem = deadline - Date.now();
  if (rem <= 0) {
    const over = Math.abs(rem);
    const h = Math.floor(over / 3_600_000);
    const m = Math.floor((over % 3_600_000) / 60_000);
    return { label: `Dépassé de ${h}h ${String(m).padStart(2, "0")}m`, overdue: true };
  }
  const h = Math.floor(rem / 3_600_000);
  const m = Math.floor((rem % 3_600_000) / 60_000);
  return { label: `${h}h ${String(m).padStart(2, "0")}m`, overdue: false };
}

// ── Vehicle label ─────────────────────────────────────────────────────────────

function vehicleLabel(d: EnrichedDemande) {
  const parts = [d.brand_nom, d.model_nom, d.period_nom, d.engine_nom].filter(Boolean);
  return parts.join(" / ") || d.engine_nom || "—";
}

// ── Main component ────────────────────────────────────────────────────────────

export function DemandesAdxTabs({
  aPrendre, mesEnCours, mesLivrees,
  prendreEnChargeAction, telechargerAction, livrerAction, refuserAction, modifierDelaiAction,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("a_prendre");
  useCountdown(); // forces re-render every minute to refresh countdowns

  const current = activeTab === "a_prendre" ? aPrendre
    : activeTab === "en_cours" ? mesEnCours
    : mesLivrees;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-line">
        {([
          ["a_prendre", "À prendre",          aPrendre.length],
          ["en_cours",  "Mes demandes en cours", mesEnCours.length],
          ["livrees",   "Mes livrées",          mesLivrees.length],
        ] as [Tab, string, number][]).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-[color,border-color] duration-150 cursor-pointer ${
              activeTab === key
                ? "border-ember text-ember"
                : "border-transparent text-ink2 hover:text-ink hover:border-line2"
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === key
                ? "bg-ember/10 text-ember"
                : count > 0
                  ? "bg-soft text-mute"
                  : "bg-soft text-mute/50"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {current.length === 0 ? (
        <div className="bg-card border border-line rounded-[12px] px-6 py-12 text-center text-mute text-sm">
          {activeTab === "a_prendre" && "Aucune demande en attente."}
          {activeTab === "en_cours"  && "Aucune demande en cours."}
          {activeTab === "livrees"   && "Aucune demande livrée."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {current.map((d) =>
            activeTab === "a_prendre"
              ? <APrendreCard key={d.id} d={d} onPrendre={prendreEnChargeAction} />
              : activeTab === "en_cours"
                ? <EnCoursCard key={d.id} d={d}
                    onTelecharger={telechargerAction}
                    onLivrer={livrerAction}
                    onRefuser={refuserAction}
                    onModifierDelai={modifierDelaiAction}
                  />
                : <LivreeCard key={d.id} d={d} onTelecharger={telechargerAction} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Card: À prendre ───────────────────────────────────────────────────────────

function APrendreCard({
  d,
  onPrendre,
}: {
  d: EnrichedDemande;
  onPrendre: (id: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState("");

  async function handle() {
    setBusy(true);
    setMsg("");
    const res = await onPrendre(d.id);
    setBusy(false);
    if (!res.ok) setMsg(res.message ?? "Erreur.");
  }

  return (
    <div className="bg-card border border-line rounded-[12px] p-5 flex flex-col gap-3">
      <CardHeader d={d} />
      <CardBody d={d} />
      {msg && <p className="text-xs text-ember font-medium">{msg}</p>}
      <button
        onClick={handle}
        disabled={busy}
        className="mt-auto w-full bg-ember text-white text-sm font-semibold py-2.5 rounded-[8px] hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50 cursor-pointer"
      >
        {busy ? "Traitement…" : "Prendre en charge"}
      </button>
    </div>
  );
}

// ── Card: En cours ────────────────────────────────────────────────────────────

function EnCoursCard({
  d,
  onTelecharger,
  onLivrer,
  onRefuser,
  onModifierDelai,
}: {
  d: EnrichedDemande;
  onTelecharger: (id: string) => Promise<{ ok: boolean; url?: string; message?: string }>;
  onLivrer:      (fd: FormData) => Promise<{ ok: boolean; message?: string }>;
  onRefuser:     (id: string, note: string) => Promise<{ ok: boolean; message?: string }>;
  onModifierDelai: (id: string, delai: number) => Promise<{ ok: boolean; message?: string }>;
}) {
  useCountdown();
  const { label, overdue } = countdown(d);

  const [busy, setBusy]             = useState(false);
  const [msg, setMsg]               = useState("");
  const [modal, setModal]           = useState<"livrer" | "refuser" | "delai" | null>(null);
  const [livrerFile, setLivrerFile] = useState<File | null>(null);
  const [refusNote, setRefusNote]   = useState("");
  const [delaiEdit, setDelaiEdit]   = useState(d.delai_heures ?? 24);
  const fileRef = useRef<HTMLInputElement>(null);

  function openModal(m: "livrer" | "refuser" | "delai") {
    setModal(m);
    setMsg("");
    setLivrerFile(null);
    setRefusNote("");
    setDelaiEdit(d.delai_heures ?? 24);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleTelecharger() {
    setBusy(true);
    setMsg("");
    const res = await onTelecharger(d.id);
    setBusy(false);
    if (res.ok && res.url) window.open(res.url, "_blank");
    else setMsg(res.message ?? "Erreur.");
  }

  async function handleLivrer() {
    if (!livrerFile) { setMsg("Sélectionnez un fichier."); return; }
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    fd.append("demandeId", d.id);
    fd.append("file", livrerFile, livrerFile.name);
    const res = await onLivrer(fd);
    setBusy(false);
    if (res.ok) setModal(null);
    else setMsg(res.message ?? "Erreur.");
  }

  async function handleRefuser() {
    if (!refusNote.trim()) { setMsg("Motif requis."); return; }
    setBusy(true);
    setMsg("");
    const res = await onRefuser(d.id, refusNote.trim());
    setBusy(false);
    if (res.ok) setModal(null);
    else setMsg(res.message ?? "Erreur.");
  }

  async function handleDelai() {
    setBusy(true);
    setMsg("");
    const res = await onModifierDelai(d.id, delaiEdit);
    setBusy(false);
    if (res.ok) setModal(null);
    else setMsg(res.message ?? "Erreur.");
  }

  return (
    <>
      <div className="bg-card border border-line rounded-[12px] p-5 flex flex-col gap-3">
        <CardHeader d={d} />
        <CardBody d={d} />

        {/* Countdown */}
        <div className={`flex items-center gap-2 rounded-[8px] px-3 py-2 ${
          overdue ? "bg-[#FEF2F2] border border-[#FECACA]" : "bg-soft border border-line"
        }`}>
          <span className="text-xs text-mute">Délai restant</span>
          <span className={`ml-auto text-sm font-semibold font-mono ${overdue ? "text-[#B91C1C]" : "text-ink"}`}>
            {label}
          </span>
          <button
            onClick={() => openModal("delai")}
            className="text-[10px] text-mute hover:text-ink2 cursor-pointer transition-colors ml-1"
            title="Modifier le délai"
          >
            ✎
          </button>
        </div>

        {msg && <p className="text-xs text-ember font-medium">{msg}</p>}

        {/* Actions */}
        <div className="flex gap-2 mt-auto flex-wrap">
          <button
            onClick={handleTelecharger}
            disabled={busy}
            className="flex-1 min-w-0 text-xs font-medium px-3 py-2 border border-line2 rounded-[6px] text-ink2 hover:border-ink2 hover:text-ink cursor-pointer transition-colors duration-150 disabled:opacity-50"
          >
            ↓ Original
          </button>
          <button
            onClick={() => openModal("livrer")}
            disabled={busy}
            className="flex-1 min-w-0 text-xs font-semibold px-3 py-2 bg-ember text-white rounded-[6px] hover:bg-ember-ink cursor-pointer transition-colors duration-150 disabled:opacity-50"
          >
            Livrer
          </button>
          <button
            onClick={() => openModal("refuser")}
            disabled={busy}
            className="text-xs font-medium px-3 py-2 border border-[#FECACA] text-[#B91C1C] rounded-[6px] hover:bg-[#FEF2F2] cursor-pointer transition-colors duration-150 disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      </div>

      {/* Livrer modal */}
      {modal === "livrer" && (
        <Modal title="Livrer le fichier tuné" onClose={() => setModal(null)}>
          <p className="text-xs text-mute mb-3 font-mono">{d.reference}</p>
          <input
            ref={fileRef}
            type="file"
            onChange={(e) => setLivrerFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink2 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-line2 file:text-xs file:font-medium file:bg-soft file:cursor-pointer mb-4"
          />
          {msg && <p className="text-xs text-ember mb-3">{msg}</p>}
          <ModalActions
            onCancel={() => setModal(null)}
            onConfirm={handleLivrer}
            confirmLabel="Livrer"
            confirmClass="bg-ember text-white hover:bg-ember-ink"
            busy={busy}
            disabled={!livrerFile}
          />
        </Modal>
      )}

      {/* Refuser modal */}
      {modal === "refuser" && (
        <Modal title="Refuser et rembourser" onClose={() => setModal(null)}>
          <p className="text-xs text-mute mb-3 font-mono">{d.reference}</p>
          <textarea
            rows={3}
            placeholder="Motif obligatoire…"
            value={refusNote}
            onChange={(e) => setRefusNote(e.target.value)}
            className="w-full bg-bg border border-line rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-ember resize-none mb-4"
          />
          {msg && <p className="text-xs text-ember mb-3">{msg}</p>}
          <ModalActions
            onCancel={() => setModal(null)}
            onConfirm={handleRefuser}
            confirmLabel="Refuser et rembourser"
            confirmClass="border border-[#B91C1C] text-[#B91C1C] hover:bg-[#FEF2F2]"
            busy={busy}
            disabled={!refusNote.trim()}
          />
        </Modal>
      )}

      {/* Délai modal */}
      {modal === "delai" && (
        <Modal title="Modifier le délai" onClose={() => setModal(null)}>
          <label className="block text-xs text-mute mb-2">Délai de livraison (heures)</label>
          <input
            type="number" min={1} max={168}
            value={delaiEdit}
            onChange={(e) => setDelaiEdit(parseInt(e.target.value) || 24)}
            className="w-full bg-bg border border-line rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-ember mb-4"
          />
          {msg && <p className="text-xs text-ember mb-3">{msg}</p>}
          <ModalActions
            onCancel={() => setModal(null)}
            onConfirm={handleDelai}
            confirmLabel="Enregistrer"
            confirmClass="bg-ember text-white hover:bg-ember-ink"
            busy={busy}
          />
        </Modal>
      )}
    </>
  );
}

// ── Card: Livrée ──────────────────────────────────────────────────────────────

function LivreeCard({
  d,
  onTelecharger,
}: {
  d: EnrichedDemande;
  onTelecharger: (id: string) => Promise<{ ok: boolean; url?: string; message?: string }>;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState("");

  async function handleTelecharger() {
    setBusy(true);
    setMsg("");
    const res = await onTelecharger(d.id);
    setBusy(false);
    if (res.ok && res.url) window.open(res.url, "_blank");
    else setMsg(res.message ?? "Erreur.");
  }

  return (
    <div className="bg-card border border-line rounded-[12px] p-5 flex flex-col gap-3 opacity-80">
      <CardHeader d={d} badge="livree" />
      <CardBody d={d} />
      {d.livree_le && (
        <p className="text-xs text-mute">
          Livrée le {new Date(d.livree_le).toLocaleDateString("fr-FR")}
        </p>
      )}
      {msg && <p className="text-xs text-ember font-medium">{msg}</p>}
      <button
        onClick={handleTelecharger}
        disabled={busy}
        className="mt-auto text-xs text-mute hover:text-ink2 cursor-pointer transition-colors duration-150 disabled:opacity-50 text-left"
      >
        ↓ Re-télécharger l&apos;original
      </button>
    </div>
  );
}

// ── Shared card sub-components ────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  recue:    "bg-[#EFF6FF] text-[#1D4ED8]",
  en_cours: "bg-ember-soft text-ember-ink",
  livree:   "bg-[#ECFDF5] text-[#047857]",
  refusee:  "bg-[#FEF2F2] text-[#B91C1C]",
  annulee:  "bg-soft text-mute",
};
const STATUS_LABEL: Record<string, string> = {
  recue:    "Reçue",
  en_cours: "En cours",
  livree:   "Livrée",
  refusee:  "Refusée",
  annulee:  "Annulée",
};

function CardHeader({ d, badge }: { d: EnrichedDemande; badge?: string }) {
  const statusKey = badge ?? d.statut;
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-mono text-xs font-semibold text-ink">{d.reference}</p>
        <p className="text-xs text-mute mt-0.5">
          {new Date(d.created_at).toLocaleDateString("fr-FR")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-mono text-mute">{d.cout_tokens}t</span>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[statusKey] ?? "bg-soft text-mute"}`}>
          {STATUS_LABEL[statusKey] ?? statusKey}
        </span>
      </div>
    </div>
  );
}

function CardBody({ d }: { d: EnrichedDemande }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1.5">
        <span className="text-[10px] text-mute uppercase tracking-wider shrink-0 w-14 pt-px">Atelier</span>
        <span className="text-sm font-medium text-ink truncate">{d.atelier_nom ?? "—"}</span>
      </div>
      <div className="flex items-start gap-1.5">
        <span className="text-[10px] text-mute uppercase tracking-wider shrink-0 w-14 pt-px">Véhicule</span>
        <span className="text-xs text-ink2 leading-snug">{vehicleLabel(d)}</span>
      </div>
      <div className="flex items-start gap-1.5">
        <span className="text-[10px] text-mute uppercase tracking-wider shrink-0 w-14 pt-px">Tuning</span>
        <span className="text-xs text-ink2">{d.tuning_nom ?? "—"}</span>
      </div>
      {d.option_noms && d.option_noms.length > 0 && (
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] text-mute uppercase tracking-wider shrink-0 w-14 pt-px">Options</span>
          <div className="flex flex-wrap gap-1">
            {d.option_noms.map((o, i) => (
              <span key={i} className="text-[10px] bg-soft border border-line px-1.5 py-0.5 rounded text-ink2">
                {o}
              </span>
            ))}
          </div>
        </div>
      )}
      {d.note_atelier && (
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] text-mute uppercase tracking-wider shrink-0 w-14 pt-px">Note</span>
          <span className="text-xs text-ink2 italic">{d.note_atelier}</span>
        </div>
      )}
    </div>
  );
}

// ── Modal helper ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-[14px] shadow-card-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">{title}</h2>
          <button onClick={onClose} className="text-mute hover:text-ink text-xl leading-none cursor-pointer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel, onConfirm, confirmLabel, confirmClass, busy, disabled = false,
}: {
  onCancel:     () => void;
  onConfirm:    () => void;
  confirmLabel: string;
  confirmClass: string;
  busy:         boolean;
  disabled?:    boolean;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        disabled={busy}
        className="flex-1 border border-line text-ink2 text-sm py-2 rounded-[8px] cursor-pointer hover:border-line2 transition-colors duration-150 disabled:opacity-50"
      >
        Annuler
      </button>
      <button
        onClick={onConfirm}
        disabled={busy || disabled}
        className={`flex-1 text-sm font-semibold py-2 rounded-[8px] cursor-pointer transition-colors duration-150 disabled:opacity-50 ${confirmClass}`}
      >
        {busy ? "…" : confirmLabel}
      </button>
    </div>
  );
}
