"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { fmt } from "@/lib/utils";

type Fuel = "essence" | "diesel" | "hybride";
type Stage = "stock" | "s1" | "s2" | "e85";

interface Props {
  hp: number;
  nm: number;
  fuel: Fuel;
  ecu: string;
  title?: string;
  defaultStage?: Stage;
}

const RPM = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000];

const SHAPE = {
  diesel: {
    p: [0.10, 0.22, 0.38, 0.55, 0.72, 0.88, 1, 0.97, 0.86, 0.71, 0.56],
    t: [0.36, 0.63, 0.89, 1, 1, 0.95, 0.86, 0.75, 0.63, 0.51, 0.41],
  },
  essence: {
    p: [0.09, 0.18, 0.30, 0.44, 0.58, 0.72, 0.86, 0.96, 1, 0.98, 0.90],
    t: [0.44, 0.62, 0.80, 0.93, 1, 1, 0.98, 0.93, 0.86, 0.77, 0.67],
  },
};

const GAINS: Record<Stage, { hp: number; nm: number; price: number }> = {
  stock: { hp: 1,    nm: 1,    price: 0 },
  s1:    { hp: 1.27, nm: 1.21, price: 7500 },
  s2:    { hp: 1.42, nm: 1.36, price: 11000 },
  e85:   { hp: 1.33, nm: 1.30, price: 12500 },
};

const STAGES: { key: Stage; label: string }[] = [
  { key: "stock", label: "Origine" },
  { key: "s1",   label: "Stage 1" },
  { key: "s2",   label: "Stage 2" },
  { key: "e85",  label: "Éthanol E85" },
];

/* SVG viewport constants */
const W = 660, H = 320, ML = 44, MR = 16, MT = 16, MB = 32;

function pxF(i: number) {
  return ML + (W - ML - MR) * i / (RPM.length - 1);
}
function pyF(v: number, max: number) {
  return H - MB - (H - MT - MB) * (v / max);
}

function spline(pts: [number, number][]): string {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6}` +
         ` ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6}` +
         ` ${p2[0]},${p2[1]}`;
  }
  return d;
}

function series(peak: number, shape: number[], max: number, boost = 0): [number, number][] {
  return shape.map((f, i) => [
    pxF(i),
    pyF(Math.min(peak * f * (1 + boost * Math.sin(Math.PI * i / (shape.length - 1))), max), max),
  ]);
}

/* Static SVG grid — built once, injected via dangerouslySetInnerHTML */
const GRID_HTML = (() => {
  let s = "";
  for (let k = 0; k <= 4; k++) {
    const y = MT + (H - MT - MB) * k / 4;
    s += `<line x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}" stroke="#E7ECF1" stroke-width="1"/>`;
  }
  for (let i = 0; i < RPM.length; i += 2) {
    const x = pxF(i);
    s += `<line x1="${x}" y1="${MT}" x2="${x}" y2="${H - MB}" stroke="#F0F3F6" stroke-width="1"/>`;
  }
  return s;
})();

const LABELS_HTML =
  RPM.filter((_, i) => i % 2 === 0)
    .map((r, j) =>
      `<text x="${pxF(j * 2)}" y="${H - 11}" fill="#7A8A97" font-size="11" text-anchor="middle" font-family="IBM Plex Sans">${r / 1000}k</text>`
    )
    .join("") +
  `<text x="${ML - 8}" y="${MT + 7}" fill="#7A8A97" font-size="11" text-anchor="end" font-family="IBM Plex Sans">ch</text>`;

export function DynoChart({ hp, nm, fuel, ecu, title, defaultStage = "stock" }: Props) {
  const [stage, setStage] = useState<Stage>(defaultStage);
  const [dispHp, setDispHp] = useState(hp);
  const [dispNm, setDispNm] = useState(nm);
  const [deltaHp, setDeltaHp] = useState("");
  const [deltaNm, setDeltaNm] = useState("");
  const [price, setPrice]   = useState(0);

  const reducedRef  = useRef(false);
  const dispHpRef   = useRef(hp);
  const dispNmRef   = useRef(nm);
  const pwrSRef     = useRef<SVGPathElement>(null);
  const pwrTRef     = useRef<SVGPathElement>(null);
  const trqSRef     = useRef<SVGPathElement>(null);
  const trqTRef     = useRef<SVGPathElement>(null);
  const areaTRef    = useRef<SVGPathElement>(null);
  const gradId      = useRef(`dyno-fill-${Math.random().toString(36).slice(2)}`);

  const fuelKey = fuel === "hybride" ? "essence" : fuel;

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const animPath = useCallback((el: SVGPathElement | null, d: string, dur: number) => {
    if (!el) return;
    el.setAttribute("d", d);
    if (reducedRef.current) return;
    const L = el.getTotalLength();
    el.style.transition = "none";
    el.style.strokeDasharray = `${L}`;
    el.style.strokeDashoffset = `${L}`;
    void el.getBoundingClientRect();
    el.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.25,.8,.3,1)`;
    el.style.strokeDashoffset = "0";
  }, []);

  const animCounter = useCallback((from: number, to: number, dur: number, setter: (v: number) => void, ref: React.MutableRefObject<number>) => {
    if (reducedRef.current) { setter(to); ref.current = to; return; }
    const t0 = performance.now();
    function step(t: number) {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(from + (to - from) * e);
      setter(v);
      ref.current = v;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, []);

  const draw = useCallback((mode: Stage) => {
    const sh = SHAPE[fuelKey];
    const g  = GAINS[mode];
    const tHp = Math.round(hp * g.hp);
    const tNm = Math.round(nm * g.nm);
    const maxP = Math.max(hp, tHp) * 1.12;
    const maxT = Math.max(nm, tNm) * 1.1;

    const sPwr = spline(series(hp,  sh.p, maxP, 0));
    const tPwr = spline(series(tHp, sh.p, maxP, 0.03));
    const sTrq = spline(series(nm,  sh.t, maxT, 0));
    const tTrq = spline(series(tNm, sh.t, maxT, 0.03));
    const area = tPwr + ` L${pxF(RPM.length - 1)},${H - MB} L${ML},${H - MB} Z`;

    animPath(pwrSRef.current, sPwr, 900);
    animPath(pwrTRef.current, tPwr, 1100);
    trqSRef.current?.setAttribute("d", sTrq);
    trqTRef.current?.setAttribute("d", tTrq);
    areaTRef.current?.setAttribute("d", area);

    if (areaTRef.current) {
      areaTRef.current.style.transition = "opacity 0.8s ease 0.2s";
      areaTRef.current.style.opacity = mode === "stock" ? "0" : "1";
    }
    if (trqTRef.current) {
      trqTRef.current.style.opacity = mode === "stock" ? "0" : "0.65";
    }

    animCounter(dispHpRef.current, tHp, 850, setDispHp, dispHpRef);
    animCounter(dispNmRef.current, tNm, 850, setDispNm, dispNmRef);
    setDeltaHp(mode === "stock" ? "" : `+${tHp - hp} ch`);
    setDeltaNm(mode === "stock" ? "" : `+${tNm - nm} Nm`);
    setPrice(g.price);
  }, [hp, nm, fuelKey, animPath, animCounter]);

  /* Draw on mount and when base props change */
  useEffect(() => {
    draw(stage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hp, nm, fuel]);

  function handleStage(key: Stage) {
    setStage(key);
    draw(key);
  }

  return (
    <div className="bg-card border border-line rounded-lg shadow-card-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4">
        <h3 className="font-display text-[20px]">{title ?? "Comparatif origine / SBFiles"}</h3>
        <span className="ml-auto text-[12px] text-ink2 bg-soft border border-line px-[9px] py-[3px] rounded-full whitespace-nowrap">
          {ecu}
        </span>
      </div>

      {/* Stage buttons */}
      <div className="flex gap-[7px] px-5 py-[14px] flex-wrap">
        {STAGES.map(({ key, label }) => (
          <Button
            key={key}
            variant="stage"
            pressed={stage === key}
            onClick={() => handleStage(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-[10px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full h-auto"
          role="img"
          aria-label="Courbe de puissance"
        >
          <defs>
            <linearGradient id={gradId.current} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--ember)" stopOpacity={0.20} />
              <stop offset="100%" stopColor="var(--ember)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid */}
          <g dangerouslySetInnerHTML={{ __html: GRID_HTML }} />

          {/* Area fill under tuned power curve */}
          <path ref={areaTRef} fill={`url(#${gradId.current})`} opacity="0" />

          {/* Stock torque (dashed) */}
          <path
            ref={trqSRef}
            fill="none"
            stroke="var(--stock)"
            strokeWidth="1.3"
            strokeDasharray="5 4"
            opacity="0.7"
          />

          {/* Tuned torque (dashed) */}
          <path
            ref={trqTRef}
            fill="none"
            stroke="var(--ember)"
            strokeWidth="1.3"
            strokeDasharray="5 4"
            opacity="0"
            style={{ transition: "opacity 0.4s" }}
          />

          {/* Stock power */}
          <path
            ref={pwrSRef}
            fill="none"
            stroke="var(--stock)"
            strokeWidth="2.2"
          />

          {/* Tuned power */}
          <path
            ref={pwrTRef}
            fill="none"
            stroke="var(--ember)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* X-axis labels */}
          <g dangerouslySetInnerHTML={{ __html: LABELS_HTML }} />
        </svg>
      </div>

      {/* Readout */}
      <div className="grid grid-cols-3 border-t border-line bg-soft">
        <ReadoutCell label="Puissance" value={dispHp} unit="ch" delta={deltaHp} />
        <ReadoutCell label="Couple"    value={dispNm} unit="Nm" delta={deltaNm} className="border-r border-line" />
        <ReadoutCell
          label="Prix du fichier"
          value={price || undefined}
          unit="DZD"
          delta={price ? "Téléchargement immédiat" : ""}
          raw={price ? fmt(price) : "—"}
        />
      </div>
    </div>
  );
}

interface ReadoutCellProps {
  label: string;
  value?: number;
  unit: string;
  delta?: string;
  raw?: string;
  className?: string;
}

function ReadoutCell({ label, value, unit, delta, raw, className }: ReadoutCellProps) {
  return (
    <div className={`px-5 py-[15px] border-r border-line last:border-r-0 ${className ?? ""}`}>
      <div className="text-[12px] text-mute mb-[3px]">{label}</div>
      <div className="font-display text-[clamp(26px,3.2vw,34px)] font-semibold leading-none tabular-nums">
        {raw ?? (value !== undefined ? fmt(value) : "—")}
        <small className="text-[.45em] text-mute font-medium ml-[3px]">{unit}</small>
      </div>
      {delta !== undefined && (
        <div className="text-[13px] text-ember-ink font-medium mt-[3px] min-h-[19px]">
          {delta}
        </div>
      )}
    </div>
  );
}
