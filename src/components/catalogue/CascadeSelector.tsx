"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronRight, ChevronDown, Calendar, Gauge, CheckCircle } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { DynoChart } from "@/components/DynoChart";
import { DemandeCTA } from "@/components/engine/DemandeCTA";
import { fmt } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Fuel = "essence" | "diesel" | "hybride";

interface ModelRow  { id: string; nom: string; slug: string }
interface PeriodRow { id: string; label: string; annee_debut: number | null; annee_fin: number | null; image_url: string | null }
interface EngineRow {
  id: string;
  nom: string;
  carburant: string | null;
  ch_stock: number | null;
  nm_stock: number | null;
  ecu: string | null;
  disponible: boolean;
}
interface FileRow {
  id: string;
  ch_tune: number | null;
  nm_tune: number | null;
  tuning_type: { id: string; nom_fr: string; cout_tokens: number };
}
interface OptionRow { id: string; nom_fr: string; prix_dzd: number; cout_tokens: number }

export interface BrandInfo { id: string; nom: string; slug: string; logo_url: string | null }

interface Props { brand: BrandInfo; models: ModelRow[] }

// ── Constants ─────────────────────────────────────────────────────────────────

const FUEL_LABEL: Record<string, string> = {
  essence: "Essence",
  diesel:  "Diesel",
  hybride: "Hybride",
};

const FUEL_BADGE_CLS: Record<string, string> = {
  essence: "bg-[#FFF7ED] text-[#C2410C]",
  diesel:  "bg-[#EFF6FF] text-[#1D4ED8]",
  hybride: "bg-[#F0FDF4] text-[#15803D]",
};

// ── FadeSlide — remount to trigger transition ─────────────────────────────────

function FadeSlide({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(12px)",
        transition:
          "opacity 250ms cubic-bezier(.2,.8,.3,1), transform 250ms cubic-bezier(.2,.8,.3,1)",
      }}
    >
      {children}
    </div>
  );
}

// ── FuelBadge ─────────────────────────────────────────────────────────────────

function FuelBadge({ fuel }: { fuel: string | null }) {
  if (!fuel || !FUEL_BADGE_CLS[fuel]) return null;
  return (
    <span
      className={`inline-block px-1.5 py-px rounded text-[10px] font-medium shrink-0 ${FUEL_BADGE_CLS[fuel]}`}
    >
      {FUEL_LABEL[fuel]}
    </span>
  );
}

// ── ColHeader ─────────────────────────────────────────────────────────────────

function ColHeader({
  children,
  title,
  sub,
}: {
  children: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--soft)] flex items-center gap-3 shrink-0">
      <span className="flex items-center justify-center text-[var(--mute)] opacity-70 shrink-0">
        {children}
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mute)] leading-none">
          {title}
        </p>
        {sub && (
          <p className="text-[13px] font-semibold text-[var(--ink)] truncate leading-tight mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── EmptyCol / LoadingCol ─────────────────────────────────────────────────────

function EmptyCol({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-5 text-center select-none">
      <span className="opacity-20 text-[var(--mute)]">{icon}</span>
      <p className="text-[12.5px] text-[var(--mute)] leading-snug max-w-[130px]">{text}</p>
    </div>
  );
}

function LoadingCol() {
  return (
    <div className="py-10 flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--mute)] animate-pulse"
          style={{ animationDelay: `${i * 180}ms` }}
        />
      ))}
    </div>
  );
}

// ── SelItem (model / period) ──────────────────────────────────────────────────

function SelItem({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left flex items-center justify-between gap-2 px-4 py-3 transition-all duration-[150ms]",
        selected
          ? "bg-[var(--ember-soft)] text-[var(--ember-ink)] border-l-[3px] border-[var(--ember)] pl-[13px] font-semibold"
          : "bg-[var(--card)] text-[var(--ink2)] hover:bg-[var(--soft)] hover:translate-x-[3px]",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-[13.5px] truncate">{label}</p>
        {sub && <p className="text-[11px] text-[var(--mute)] mt-px">{sub}</p>}
      </div>
      {selected ? (
        <CheckCircle size={14} className="shrink-0 text-[var(--ember)]" aria-hidden />
      ) : (
        <ChevronRight size={14} className="shrink-0 text-[var(--mute)]" aria-hidden />
      )}
    </button>
  );
}

// ── EngineItem ────────────────────────────────────────────────────────────────

function EngineItem({
  engine,
  selected,
  onClick,
}: {
  engine: EngineRow;
  selected: boolean;
  onClick: () => void;
}) {
  if (!engine.disponible) {
    return (
      <div className="px-4 py-3 flex items-center justify-between gap-2 bg-[var(--soft)] opacity-50 cursor-not-allowed select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13.5px] text-[var(--ink2)] truncate">{engine.nom}</span>
          <FuelBadge fuel={engine.carburant} />
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--line)] text-[var(--mute)] whitespace-nowrap shrink-0">
          Bientôt disponible
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left flex items-center justify-between gap-2 px-4 py-3 transition-all duration-[150ms]",
        selected
          ? "bg-[var(--ember-soft)] text-[var(--ember-ink)] border-l-[3px] border-[var(--ember)] pl-[13px] font-semibold"
          : "bg-[var(--card)] text-[var(--ink2)] hover:bg-[var(--soft)] hover:translate-x-[3px]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13.5px] truncate">{engine.nom}</span>
        <FuelBadge fuel={engine.carburant} />
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-1">
        {engine.ch_stock != null && (
          <span className="text-[12px] tabular-nums">
            <strong
              className={selected ? "text-[var(--ember-ink)]" : "text-[var(--ink)]"}
            >
              {engine.ch_stock}
            </strong>
            <span className="text-[var(--mute)] text-[10px] ml-0.5">ch</span>
          </span>
        )}
        {selected ? (
          <CheckCircle size={13} className="text-[var(--ember)]" aria-hidden />
        ) : (
          <ChevronRight size={13} className="text-[var(--mute)]" aria-hidden />
        )}
      </div>
    </button>
  );
}

// ── EnginePanel ───────────────────────────────────────────────────────────────

function EnginePanel({
  brand,
  model,
  period,
  engine,
  files,
  options,
  loading,
}: {
  brand: BrandInfo;
  model: ModelRow;
  period: PeriodRow;
  engine: EngineRow;
  files: FileRow[];
  options: OptionRow[];
  loading: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!period.image_url && !imgFailed;

  const dynoFuel: Fuel =
    engine.carburant === "hybride"
      ? "essence"
      : (engine.carburant as Fuel | null) ?? "diesel";
  const hp = engine.ch_stock ?? 150;
  const nm = engine.nm_stock ?? 380;

  return (
    <div className="mt-6">
      {/* ── Vehicle photo / placeholder ──────────────────────────────── */}
      {showImage ? (
        <div
          className="relative w-full rounded-[12px] overflow-hidden mb-4 bg-[var(--soft)]"
          style={{ aspectRatio: "16/9" }}
        >
          <Image
            src={period.image_url!}
            alt={`${brand.nom} ${model.nom} ${period.label}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1300px) 90vw, 1232px"
            className="object-cover"
            priority
            unoptimized
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <div
          className="w-full rounded-[12px] bg-[var(--soft)] border border-[var(--line)] flex flex-col items-center justify-center gap-3 mb-4"
          style={{ aspectRatio: "16/9", minHeight: "180px" }}
        >
          <svg
            width="52" height="52" viewBox="0 0 24 24"
            fill="none" stroke="var(--line2)"
            strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2l2-1 2-3h10l2 3 2 1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
            <circle cx="7.5" cy="17" r="2.5" />
            <circle cx="16.5" cy="17" r="2.5" />
            <path d="M7.5 14.5h9" />
          </svg>
          <span className="text-[var(--mute)] text-sm">Photo à venir</span>
        </div>
      )}

    <div className="border border-[var(--line)] rounded-[14px] overflow-hidden shadow-card bg-[var(--card)]">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-[clamp(18px,2.2vw,26px)] leading-tight">
            {brand.nom} {model.nom}
            <span className="text-[var(--mute)]"> · {engine.nom}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {engine.carburant && (
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${FUEL_BADGE_CLS[engine.carburant] ?? ""}`}
              >
                {FUEL_LABEL[engine.carburant] ?? engine.carburant}
              </span>
            )}
            {engine.ecu && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono bg-[var(--soft)] text-[var(--mute)] border border-[var(--line)]">
                {engine.ecu}
              </span>
            )}
            {period.annee_debut && (
              <span className="text-xs text-[var(--mute)]">
                {period.annee_debut}
                {period.annee_fin ? ` – ${period.annee_fin}` : "+"}
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:block shrink-0">
          <DemandeCTA engineId={engine.id} />
        </div>
      </div>

      {loading ? (
        <div className="py-16">
          <LoadingCol />
        </div>
      ) : (
        <>
          {/* DynoChart + comparison table */}
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <DynoChart
              hp={hp}
              nm={nm}
              fuel={dynoFuel}
              ecu={engine.ecu ?? "—"}
              title={`${brand.nom} ${model.nom} · ${engine.nom}`}
              defaultStage="stock"
            />

            <div className="bg-[var(--card)] border border-[var(--line)] rounded-lg shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--line)]">
                <h3 className="font-display text-lg">Comparatif par stage</h3>
              </div>
              {files.length === 0 ? (
                <div className="px-5 py-8 text-[var(--mute)] text-sm text-center">
                  Fichiers disponibles sur demande.
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--soft)] border-b border-[var(--line)] text-xs text-[var(--mute)] uppercase tracking-wider">
                      <th className="text-left px-5 py-2.5">Stage</th>
                      <th className="text-right px-4 py-2.5">ch</th>
                      <th className="text-right px-4 py-2.5">Nm</th>
                      <th className="text-right px-4 py-2.5">+ch</th>
                      <th className="text-right px-4 py-2.5">+Nm</th>
                      <th className="text-right px-4 py-2.5">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--line)] bg-[var(--soft)]/40">
                      <td className="px-5 py-2.5 font-medium text-[var(--mute)]">Origine</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{hp}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{nm}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--mute)]">—</td>
                      <td className="px-4 py-2.5 text-right text-[var(--mute)]">—</td>
                      <td className="px-4 py-2.5 text-right text-[var(--mute)]">—</td>
                    </tr>
                    {files.map((file) => {
                      const gainHp = file.ch_tune != null ? file.ch_tune - hp : null;
                      const gainNm = file.nm_tune != null ? file.nm_tune - nm : null;
                      return (
                        <tr
                          key={file.id}
                          className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]/30 transition-colors"
                        >
                          <td className="px-5 py-2.5 font-medium">{file.tuning_type.nom_fr}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                            {file.ch_tune ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                            {file.nm_tune ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ok font-medium">
                            {gainHp != null ? `+${gainHp}` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ok font-medium">
                            {gainNm != null ? `+${gainNm}` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--ember-soft)] text-[var(--ember-ink)] font-semibold">
                              {file.tuning_type.cout_tokens}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Options */}
          {options.length > 0 && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <h3 className="font-display text-lg mb-3">Options disponibles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--card)] border border-[var(--line)] rounded-[10px]"
                  >
                    <span className="text-sm">{opt.nom_fr}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.cout_tokens > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--ember-soft)] text-[var(--ember-ink)] font-semibold whitespace-nowrap">
                          +{opt.cout_tokens}
                        </span>
                      )}
                      <span className="text-xs text-[var(--mute)] tabular-nums whitespace-nowrap">
                        {fmt(opt.prix_dzd)} DZD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA block */}
          <div className="mx-5 sm:mx-6 mb-5 sm:mb-6 bg-[var(--card)] border border-[var(--line)] rounded-[14px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg sm:text-xl mb-1">Prêt à reprogrammer ?</h3>
              <p className="text-[var(--ink2)] text-[13.5px]">
                Transmettez votre fichier stock. Réponse en quelques heures.
              </p>
            </div>
            <DemandeCTA engineId={engine.id} className="shrink-0" />
          </div>
        </>
      )}
    </div>
    </div>
  );
}

// ── AccordionStep (mobile) ────────────────────────────────────────────────────

function AccordionStep({
  stepIndex,
  currentStep,
  title,
  icon,
  selectedLabel,
  children,
  onReopen,
}: {
  stepIndex: number;
  currentStep: number;
  title: string;
  icon: React.ReactNode;
  selectedLabel: string | null;
  children: React.ReactNode;
  onReopen: () => void;
}) {
  const isCompleted = currentStep > stepIndex && !!selectedLabel;
  const isActive    = currentStep === stepIndex;
  const isLocked    = !isCompleted && !isActive;

  return (
    <div
      className={[
        "border rounded-[12px] overflow-hidden transition-shadow duration-200",
        isActive
          ? "border-[var(--ember)]/30 bg-[var(--card)] shadow-card"
          : isCompleted
          ? "border-[var(--line)] bg-[var(--card)]"
          : "border-[var(--line)] bg-[var(--soft)] opacity-40",
      ].join(" ")}
    >
      {/* Header */}
      {isCompleted ? (
        <button
          onClick={onReopen}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[var(--soft)] transition-colors duration-150 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[var(--ember)] opacity-80 shrink-0">{icon}</span>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mute)]">
                {title}
              </p>
              <p className="text-[14px] font-semibold text-[var(--ember-ink)]">{selectedLabel}</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-[var(--mute)] -rotate-90 shrink-0" aria-hidden />
        </button>
      ) : (
        <div
          className={[
            "flex items-center gap-2.5 px-4 py-3.5",
            isActive ? "border-b border-[var(--line)] bg-[var(--soft)]" : "",
          ].join(" ")}
        >
          <span
            className={[
              "shrink-0",
              isActive ? "text-[var(--ember)] opacity-80" : "text-[var(--mute)]",
            ].join(" ")}
          >
            {icon}
          </span>
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mute)]">
            {title}
          </p>
        </div>
      )}

      {/* Animated content via grid-template-rows */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isActive ? "1fr" : "0fr",
          transition: "grid-template-rows 280ms cubic-bezier(.2,.8,.3,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          {!isLocked && children}
        </div>
      </div>
    </div>
  );
}

// ── CascadeSelector ───────────────────────────────────────────────────────────

export function CascadeSelector({ brand, models }: Props) {
  const [selModel,  setSelModel]  = useState<ModelRow | null>(null);
  const [selPeriod, setSelPeriod] = useState<PeriodRow | null>(null);
  const [selEngine, setSelEngine] = useState<EngineRow | null>(null);

  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [engines, setEngines] = useState<EngineRow[]>([]);
  const [detail,  setDetail]  = useState<{ files: FileRow[]; options: OptionRow[] } | null>(null);

  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [loadingEngines, setLoadingEngines] = useState(false);
  const [loadingDetail,  setLoadingDetail]  = useState(false);

  const [mobileStep, setMobileStep] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);

  const pickModel = useCallback(async (model: ModelRow) => {
    if (selModel?.id === model.id) return;
    setSelModel(model);
    setSelPeriod(null);
    setSelEngine(null);
    setPeriods([]);
    setEngines([]);
    setDetail(null);
    setMobileStep(1);

    setLoadingPeriods(true);
    const sb = createClient();
    const { data } = await sb
      .from("periods")
      .select("id, label, annee_debut, annee_fin, image_url")
      .eq("model_id", model.id)
      .order("annee_debut", { ascending: true });
    setPeriods((data ?? []) as PeriodRow[]);
    setLoadingPeriods(false);
  }, [selModel?.id]);

  const pickPeriod = useCallback(async (period: PeriodRow) => {
    if (selPeriod?.id === period.id) return;
    setSelPeriod(period);
    setSelEngine(null);
    setEngines([]);
    setDetail(null);
    setMobileStep(2);

    setLoadingEngines(true);
    const sb = createClient();
    const { data } = await sb
      .from("engines")
      .select("id, nom, carburant, ch_stock, nm_stock, ecu, disponible")
      .eq("period_id", period.id)
      .order("nom");
    setEngines(
      ((data ?? []) as Record<string, unknown>[]).map((e) => ({
        id:         e.id         as string,
        nom:        e.nom        as string,
        carburant:  (e.carburant as string  | null) ?? null,
        ch_stock:   (e.ch_stock  as number  | null) ?? null,
        nm_stock:   (e.nm_stock  as number  | null) ?? null,
        ecu:        (e.ecu       as string  | null) ?? null,
        disponible: (e.disponible as boolean | null) ?? true,
      }))
    );
    setLoadingEngines(false);
  }, [selPeriod?.id]);

  const pickEngine = useCallback(async (engine: EngineRow) => {
    if (!engine.disponible) return;
    if (selEngine?.id === engine.id) {
      setSelEngine(null);
      setDetail(null);
      return;
    }
    setSelEngine(engine);
    setDetail(null);
    setMobileStep(3);

    setLoadingDetail(true);
    const sb = createClient();
    const [{ data: rawFiles }, { data: rawOptions }] = await Promise.all([
      sb
        .from("files")
        .select("id, ch_tune, nm_tune, tuning_type:tuning_types(id, nom_fr, cout_tokens)")
        .eq("engine_id", engine.id)
        .eq("actif", true)
        .order("tuning_type(ordre)"),
      sb.from("options").select("id, nom_fr, prix_dzd, cout_tokens").order("ordre"),
    ]);
    setDetail({
      files:   (rawFiles  ?? []) as unknown as FileRow[],
      options: (rawOptions ?? []) as OptionRow[],
    });
    setLoadingDetail(false);

    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }, [selEngine?.id]);

  const goBackTo = useCallback((step: 0 | 1 | 2) => {
    if (step === 0) { setSelModel(null); setPeriods([]); }
    if (step <= 1) { setSelPeriod(null); setEngines([]); }
    if (step <= 2) { setSelEngine(null); setDetail(null); }
    setMobileStep(step);
  }, []);

  const periodSub = (p: PeriodRow) =>
    p.annee_debut
      ? `${p.annee_debut}${p.annee_fin ? ` – ${p.annee_fin}` : "+"}`
      : undefined;

  const periodAccordionLabel = selPeriod
    ? `${selPeriod.label}${selPeriod.annee_debut ? ` · ${selPeriod.annee_debut}${selPeriod.annee_fin ? `–${selPeriod.annee_fin}` : "+"}` : ""}`
    : null;

  const brandIconNode = (
    <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center bg-[var(--soft)] border border-[var(--line)]">
      <BrandLogo slug={brand.slug} name={brand.nom} logoUrl={brand.logo_url} compact />
    </div>
  );

  const brandIconSmall = (
    <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center">
      <BrandLogo slug={brand.slug} name={brand.nom} logoUrl={brand.logo_url} compact />
    </div>
  );

  return (
    <div>
      {/* ── Desktop: 3 columns ──────────────────────────────────────────────── */}
      <div className="hidden md:flex divide-x divide-[var(--line)] border border-[var(--line)] rounded-[14px] overflow-hidden shadow-card bg-[var(--card)]">

        {/* Column 1: Models */}
        <div className="flex-1 min-w-0 flex flex-col">
          <ColHeader title="Modèle" sub={brand.nom}>
            {brandIconNode}
          </ColHeader>
          <div className="overflow-y-auto max-h-[420px]">
            <div className="divide-y divide-[var(--line)]">
              {models.map((model) => (
                <SelItem
                  key={model.id}
                  label={model.nom}
                  selected={selModel?.id === model.id}
                  onClick={() => pickModel(model)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Periods */}
        <div className="flex-1 min-w-0 flex flex-col">
          <ColHeader title="Génération" sub={selModel?.nom}>
            <Calendar size={16} />
          </ColHeader>
          <div className="overflow-y-auto max-h-[420px]">
            {!selModel ? (
              <EmptyCol
                icon={<Calendar size={28} />}
                text="Choisissez un modèle pour voir les générations"
              />
            ) : loadingPeriods ? (
              <LoadingCol />
            ) : periods.length === 0 ? (
              <EmptyCol icon={<Calendar size={28} />} text="Aucune génération disponible" />
            ) : (
              <FadeSlide key={selModel.id}>
                <div className="divide-y divide-[var(--line)]">
                  {periods.map((period) => (
                    <SelItem
                      key={period.id}
                      label={period.label}
                      sub={periodSub(period)}
                      selected={selPeriod?.id === period.id}
                      onClick={() => pickPeriod(period)}
                    />
                  ))}
                </div>
              </FadeSlide>
            )}
          </div>
        </div>

        {/* Column 3: Engines */}
        <div className="flex-1 min-w-0 flex flex-col">
          <ColHeader title="Motorisation" sub={selPeriod?.label}>
            <Gauge size={16} />
          </ColHeader>
          <div className="overflow-y-auto max-h-[420px]">
            {!selPeriod ? (
              <EmptyCol
                icon={<Gauge size={28} />}
                text="Choisissez une génération pour voir les motorisations"
              />
            ) : loadingEngines ? (
              <LoadingCol />
            ) : engines.length === 0 ? (
              <EmptyCol icon={<Gauge size={28} />} text="Aucune motorisation disponible" />
            ) : (
              <FadeSlide key={selPeriod.id}>
                <div className="divide-y divide-[var(--line)]">
                  {engines.map((engine) => (
                    <EngineItem
                      key={engine.id}
                      engine={engine}
                      selected={selEngine?.id === engine.id}
                      onClick={() => pickEngine(engine)}
                    />
                  ))}
                </div>
              </FadeSlide>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: accordion ───────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Step 0: Model */}
        <AccordionStep
          stepIndex={0}
          currentStep={mobileStep}
          title="Modèle"
          icon={brandIconSmall}
          selectedLabel={selModel?.nom ?? null}
          onReopen={() => goBackTo(0)}
        >
          <div className="divide-y divide-[var(--line)]">
            {models.map((model) => (
              <SelItem
                key={model.id}
                label={model.nom}
                selected={selModel?.id === model.id}
                onClick={() => pickModel(model)}
              />
            ))}
          </div>
        </AccordionStep>

        {/* Step 1: Period */}
        <AccordionStep
          stepIndex={1}
          currentStep={mobileStep}
          title="Génération"
          icon={<Calendar size={16} />}
          selectedLabel={periodAccordionLabel}
          onReopen={() => goBackTo(1)}
        >
          {loadingPeriods ? (
            <LoadingCol />
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {periods.map((period) => (
                <SelItem
                  key={period.id}
                  label={period.label}
                  sub={periodSub(period)}
                  selected={selPeriod?.id === period.id}
                  onClick={() => pickPeriod(period)}
                />
              ))}
            </div>
          )}
        </AccordionStep>

        {/* Step 2: Engine */}
        <AccordionStep
          stepIndex={2}
          currentStep={mobileStep}
          title="Motorisation"
          icon={<Gauge size={16} />}
          selectedLabel={selEngine?.nom ?? null}
          onReopen={() => goBackTo(2)}
        >
          {loadingEngines ? (
            <LoadingCol />
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {engines.map((engine) => (
                <EngineItem
                  key={engine.id}
                  engine={engine}
                  selected={selEngine?.id === engine.id}
                  onClick={() => pickEngine(engine)}
                />
              ))}
            </div>
          )}
        </AccordionStep>
      </div>

      {/* ── Engine detail panel (desktop + mobile) ──────────────────────────── */}
      {selEngine && selModel && selPeriod && (
        <div ref={panelRef} key={selPeriod.id}>
          <EnginePanel
            brand={brand}
            model={selModel}
            period={selPeriod}
            engine={selEngine}
            files={detail?.files ?? []}
            options={detail?.options ?? []}
            loading={loadingDetail && !detail}
          />
        </div>
      )}
    </div>
  );
}
