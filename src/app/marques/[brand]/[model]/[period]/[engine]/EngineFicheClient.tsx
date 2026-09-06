"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { DynoChart } from "@/components/DynoChart";
import { DemandeCTA } from "@/components/engine/DemandeCTA";
import type { Engine, TuningFile, TuningType, Option, Fuel } from "@/lib/types";

interface FileWithType extends TuningFile {
  tuning_type: TuningType;
}

interface PeriodInfo {
  id: string;
  label: string;
  annee_debut: number | null;
  annee_fin: number | null;
  image_url: string | null;
}

interface PeriodStub {
  id: string;
  label: string;
  annee_debut: number | null;
  annee_fin: number | null;
}

export interface EngineFicheProps {
  initialEngineId: string;
  engines: Engine[];
  filesByEngine: Record<string, FileWithType[]>;
  options: Option[];
  period: PeriodInfo;
  allPeriods: PeriodStub[];
  brand: { nom: string; slug: string };
  model: { nom: string; slug: string };
}

const FUEL_LABEL: Record<string, string> = {
  essence: "Essence",
  diesel:  "Diesel",
  hybride: "Hybride",
};
const FUEL_BADGE: Record<string, string> = {
  essence: "bg-[#FFF7ED] text-[#C2410C]",
  diesel:  "bg-[#EFF6FF] text-[#1D4ED8]",
  hybride: "bg-[#F0FDF4] text-[#15803D]",
};

export function EngineFicheClient({
  initialEngineId, engines, filesByEngine, options,
  period, allPeriods, brand, model,
}: EngineFicheProps) {
  const [selectedId, setSelectedId] = useState(initialEngineId);
  const [imgFailed, setImgFailed]   = useState(false);

  const engine = useMemo(
    () => engines.find((e) => e.id === selectedId) ?? engines[0] ?? null,
    [engines, selectedId],
  );

  const files: FileWithType[] = filesByEngine[selectedId] ?? [];

  function selectEngine(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    window.history.replaceState(
      null, "",
      `/marques/${brand.slug}/${model.slug}/${period.id}/${id}`,
    );
  }

  // Defensive: engines array was empty (data error) — nothing to render
  if (!engine) return null;

  const fuel: Fuel =
    engine.carburant === "hybride" ? "essence"
    : (engine.carburant as Fuel | null) ?? "diesel";
  const hp = engine.ch_stock ?? 150;
  const nm = engine.nm_stock ?? 380;
  const fmt = (n: number) => n.toLocaleString("fr-FR");

  const showImage       = !!period.image_url && !imgFailed;
  const multipleEngines = engines.length > 1;
  const multiplePeriods = allPeriods.length > 1;

  return (
    <>
      {/* Breadcrumb — last item follows the selected engine reactively */}
      <Breadcrumb items={[
        { label: "Accueil",     href: "/" },
        { label: "Marques",    href: "/marques" },
        { label: brand.nom,    href: `/marques/${brand.slug}` },
        { label: model.nom,    href: `/marques/${brand.slug}/${model.slug}` },
        { label: period.label, href: `/marques/${brand.slug}/${model.slug}/${period.id}` },
        { label: engine.nom },
      ]} />

      {/* ── Vehicle photo ───────────────────────────────────────── */}
      {showImage ? (
        <div
          className="relative w-full rounded-[12px] overflow-hidden mb-6 sm:mb-8 bg-soft"
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
          className="w-full rounded-[12px] bg-soft border border-line flex flex-col items-center justify-center gap-3 mb-6 sm:mb-8"
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
          <span className="text-mute text-sm">Photo à venir</span>
        </div>
      )}

      {/* ── Title + badges + desktop CTA ────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="font-display text-[clamp(24px,3.5vw,40px)] leading-tight">
            {brand.nom} {model.nom}
            <span className="text-mute"> · {engine.nom}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {engine.carburant && (
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${FUEL_BADGE[engine.carburant] ?? ""}`}>
                {FUEL_LABEL[engine.carburant] ?? engine.carburant}
              </span>
            )}
            {engine.ecu && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono bg-soft text-mute border border-line">
                {engine.ecu}
              </span>
            )}
            {period.annee_debut && (
              <span className="text-xs text-mute">
                {period.annee_debut}{period.annee_fin ? ` – ${period.annee_fin}` : "+"}
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <DemandeCTA engineId={engine.id} />
        </div>
      </div>

      {/* ── Quick engine selector ────────────────────────────────── */}
      {multipleEngines && (
        <div
          className="overflow-x-auto -mx-[clamp(18px,4.5vw,64px)] px-[clamp(18px,4.5vw,64px)] mb-5"
          role="group"
          aria-label="Sélectionner une motorisation"
        >
          <div className="flex gap-2 pb-2 min-w-max">
            {engines.map((eng) => {
              const active = eng.id === selectedId;
              return (
                <button
                  key={eng.id}
                  onClick={() => selectEngine(eng.id)}
                  aria-current={active ? "true" : undefined}
                  className={[
                    "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
                    "border transition-colors duration-150 cursor-pointer",
                    active
                      ? "bg-ember-soft text-ember-ink border-ember/30 font-semibold"
                      : "bg-soft text-mute border-line hover:border-line2 hover:text-ink",
                  ].join(" ")}
                >
                  {eng.nom}
                  {eng.ch_stock && (
                    <span className={`text-xs ${active ? "text-ember-ink/70" : "text-mute"}`}>
                      · {eng.ch_stock} ch
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Period navigation (cross-generation) ────────────────── */}
      {multiplePeriods && (
        <div
          className="overflow-x-auto -mx-[clamp(18px,4.5vw,64px)] px-[clamp(18px,4.5vw,64px)] mb-6"
          role="navigation"
          aria-label="Autres générations"
        >
          <div className="flex gap-2 pb-1 min-w-max items-center">
            <span className="text-xs text-mute shrink-0 pr-1">Génération :</span>
            {allPeriods.map((p) => {
              const active = p.id === period.id;
              return (
                <Link
                  key={p.id}
                  href={`/marques/${brand.slug}/${model.slug}/${p.id}`}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "shrink-0 px-2.5 py-1 rounded-md text-xs border transition-colors duration-150",
                    active
                      ? "bg-soft border-line2 text-ink font-medium"
                      : "text-mute border-line hover:border-line2 hover:text-ink",
                  ].join(" ")}
                >
                  {p.label}
                  {p.annee_debut && (
                    <span className="ml-1 opacity-60">
                      {p.annee_debut}{p.annee_fin ? `–${p.annee_fin}` : "+"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DynoChart + comparison table ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 sm:gap-8 mb-8">
        <DynoChart
          hp={hp}
          nm={nm}
          fuel={fuel}
          ecu={engine.ecu ?? "—"}
          title={`${brand.nom} ${model.nom} · ${engine.nom}`}
          defaultStage="stock"
        />

        <div className="bg-card border border-line rounded-lg shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line">
            <h2 className="font-display text-lg">Comparatif par stage</h2>
          </div>

          {files.length === 0 ? (
            <div className="px-5 py-8 text-mute text-sm text-center">
              Fichiers disponibles sur demande.
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-soft border-b border-line text-xs text-mute uppercase tracking-wider">
                  <th className="text-left px-5 py-2.5">Stage</th>
                  <th className="text-right px-4 py-2.5">ch</th>
                  <th className="text-right px-4 py-2.5">Nm</th>
                  <th className="text-right px-4 py-2.5">+ch</th>
                  <th className="text-right px-4 py-2.5">+Nm</th>
                  <th className="text-right px-4 py-2.5">Tokens</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line bg-soft/40">
                  <td className="px-5 py-2.5 font-medium text-mute">Origine</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{hp}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{nm}</td>
                  <td className="px-4 py-2.5 text-right text-mute">—</td>
                  <td className="px-4 py-2.5 text-right text-mute">—</td>
                  <td className="px-4 py-2.5 text-right text-mute">—</td>
                </tr>
                {files.map((file) => {
                  const gainHp = file.ch_tune != null && hp ? file.ch_tune - hp : null;
                  const gainNm = file.nm_tune != null && nm ? file.nm_tune - nm : null;
                  return (
                    <tr key={file.id} className="border-b border-line last:border-0 hover:bg-soft/30 transition-colors">
                      <td className="px-5 py-2.5 font-medium">{file.tuning_type.nom_fr}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{file.ch_tune ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{file.nm_tune ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ok font-medium">
                        {gainHp != null ? `+${gainHp}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ok font-medium">
                        {gainNm != null ? `+${gainNm}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs bg-ember-soft text-ember-ink font-semibold">
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

      {/* ── Options ─────────────────────────────────────────────── */}
      {options.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-[clamp(20px,2.5vw,28px)] mb-4">Options disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-card border border-line rounded-[10px]"
              >
                <span className="text-sm">{opt.nom_fr}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {opt.cout_tokens > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs bg-ember-soft text-ember-ink font-semibold whitespace-nowrap">
                      +{opt.cout_tokens} token{opt.cout_tokens !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs text-mute tabular-nums whitespace-nowrap">
                    {fmt(opt.prix_dzd)} DZD
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom CTA ──────────────────────────────────────────── */}
      <div className="bg-card border border-line rounded-[14px] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl mb-1">Prêt à reprogrammer ?</h2>
          <p className="text-ink2 text-[14.5px]">
            Transmettez votre fichier stock. Le fichier reprogrammé vous est renvoyé en quelques heures.
          </p>
        </div>
        <DemandeCTA engineId={engine.id} className="shrink-0 text-base px-6 py-3" />
      </div>
    </>
  );
}
