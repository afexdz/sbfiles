"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "../../../lib/supabase/client";
import { DynoChart } from "@/components/DynoChart";
import { Button } from "@/components/ui/Button";
import type { Brand, Model, Period, Engine } from "@/lib/types";

interface Props {
  brands: Brand[];
}

type Fuel = "essence" | "diesel" | "hybride";

const DEFAULT_CHART = { hp: 150, nm: 380, fuel: "diesel" as Fuel, ecu: "—" };

export function Hero({ brands }: Props) {
  /* Lazy Supabase client — only initialised on first user interaction */
  const sbRef = useRef<ReturnType<typeof createClient> | null | "failed">(null);
  function sb() {
    if (sbRef.current === "failed") return null;
    if (!sbRef.current) {
      try { sbRef.current = createClient(); } catch { sbRef.current = "failed"; return null; }
    }
    return sbRef.current as ReturnType<typeof createClient>;
  }

  const [models,   setModels]   = useState<Model[]>([]);
  const [periods,  setPeriods]  = useState<Period[]>([]);
  const [engines,  setEngines]  = useState<Engine[]>([]);

  const [selBrand,  setSelBrand]  = useState("");
  const [selModel,  setSelModel]  = useState("");
  const [selPeriod, setSelPeriod] = useState("");
  const [selEngine, setSelEngine] = useState("");

  const [chart, setChart] = useState(DEFAULT_CHART);
  const [ecuTag, setEcuTag] = useState("ECU —");

  /* ---- cascading fetch handlers ---- */

  const onBrand = useCallback(async (brandId: string) => {
    setSelBrand(brandId);
    setSelModel(""); setSelPeriod(""); setSelEngine("");
    setModels([]); setPeriods([]); setEngines([]);
    const client = sb();
    if (!brandId || !client) return;
    const { data } = await client
      .from("models")
      .select("*")
      .eq("brand_id", brandId)
      .order("ordre");
    setModels(data ?? []);
  }, []);

  const onModel = useCallback(async (modelId: string) => {
    setSelModel(modelId);
    setSelPeriod(""); setSelEngine("");
    setPeriods([]); setEngines([]);
    const client = sb();
    if (!modelId || !client) return;
    const { data } = await client
      .from("periods")
      .select("*")
      .eq("model_id", modelId)
      .order("ordre");
    setPeriods(data ?? []);
  }, []);

  const onPeriod = useCallback(async (periodId: string) => {
    setSelPeriod(periodId);
    setSelEngine("");
    setEngines([]);
    const client = sb();
    if (!periodId || !client) return;
    const { data } = await client
      .from("engines")
      .select("*")
      .eq("period_id", periodId);
    setEngines(data ?? []);
  }, []);

  const onEngine = useCallback((engineId: string) => {
    setSelEngine(engineId);
    const eng = engines.find((e) => e.id === engineId);
    if (!eng) return;
    setChart({
      hp:   eng.ch_stock ?? DEFAULT_CHART.hp,
      nm:   eng.nm_stock ?? DEFAULT_CHART.nm,
      fuel: (eng.carburant === "hybride" ? "essence" : eng.carburant ?? "diesel") as Fuel,
      ecu:  eng.ecu ?? "—",
    });
    setEcuTag(eng.ecu ? `ECU ${eng.ecu}` : "ECU —");
  }, [engines]);

  const canSubmit = Boolean(selEngine);

  /* ---- select style shared ---- */
  const selectCls =
    "w-full bg-card border border-line2 rounded-[5px] px-[13px] py-3 text-[15px] cursor-pointer appearance-none " +
    "hover:border-ink2 focus:outline-none focus:border-ember focus:shadow-[0_0_0_4px_var(--ember-soft)] " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-soft transition-[border-color,box-shadow] duration-[180ms] " +
    "[background-image:linear-gradient(45deg,transparent_50%,var(--ink2)_50%),linear-gradient(135deg,var(--ink2)_50%,transparent_50%)] " +
    "[background-position:calc(100%_-_19px)_52%,calc(100%_-_13px)_52%] [background-size:6px_6px] [background-repeat:no-repeat]";

  return (
    <section className="relative py-5 sm:py-[clamp(34px,5vw,66px)] sm:pb-[clamp(30px,4vw,50px)] overflow-hidden">
      {/* Background radial glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: "-30% -20% auto 40%",
          height: "560px",
          background:
            "radial-gradient(52% 58% at 60% 45%, rgba(255,77,18,.10), transparent 70%)",
        }}
      />

      <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)] relative">
        <div className="grid [grid-template-columns:minmax(0,.88fr)_minmax(0,1.12fr)] gap-[clamp(24px,3.5vw,48px)] items-start [max-width:1000px]:![grid-template-columns:1fr] [max-width:1000px]:gap-[30px]">

          {/* ---- Left column ---- */}
          <div className="stagger">
            {/* Kicker */}
            <div className="inline-flex items-center gap-2 text-xs text-ink2 bg-card border border-line px-3 py-[6px] rounded-full mb-[18px] shadow-card whitespace-nowrap">
              <span className="w-[7px] h-[7px] rounded-full bg-ok shadow-[0_0_0_3px_rgba(18,161,80,.16)]" />
              4 218 fichiers en ligne · téléchargement immédiat
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display mb-4">
              Le fichier exact
              <span className="block text-mute">pour ton moteur.</span>
            </h1>

            <p className="text-ink2 max-w-[46ch] text-[16.5px] mb-[26px]">
              Marque, modèle, année, motorisation. Tu vois les gains avant
              d&apos;acheter et tu télécharges dans la seconde.
            </p>

            {/* Console */}
            <div className="bg-card border border-line rounded-lg shadow-card-lg overflow-hidden">
              <div className="flex justify-between items-center px-[18px] py-3 border-b border-line text-[12.5px] text-mute bg-soft">
                <span>Trouve ton fichier</span>
                <span>{ecuTag}</span>
              </div>
              <div className="p-[18px] flex flex-col gap-3">
                {/* Marque */}
                <label className="flex flex-col gap-[5px] text-[12.5px] text-mute">
                  Marque
                  <select
                    className={selectCls}
                    value={selBrand}
                    onChange={(e) => onBrand(e.target.value)}
                  >
                    <option value="">Sélectionne une marque</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.nom}</option>
                    ))}
                  </select>
                </label>

                {/* Modèle */}
                <label className="flex flex-col gap-[5px] text-[12.5px] text-mute">
                  Modèle
                  <select
                    className={selectCls}
                    value={selModel}
                    disabled={models.length === 0}
                    onChange={(e) => onModel(e.target.value)}
                  >
                    <option value="">
                      {models.length === 0 ? "—" : "Sélectionne un modèle"}
                    </option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </label>

                {/* Année */}
                <label className="flex flex-col gap-[5px] text-[12.5px] text-mute">
                  Année
                  <select
                    className={selectCls}
                    value={selPeriod}
                    disabled={periods.length === 0}
                    onChange={(e) => onPeriod(e.target.value)}
                  >
                    <option value="">
                      {periods.length === 0 ? "—" : "Sélectionne une année"}
                    </option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </label>

                {/* Motorisation */}
                <label className="flex flex-col gap-[5px] text-[12.5px] text-mute">
                  Motorisation
                  <select
                    className={selectCls}
                    value={selEngine}
                    disabled={engines.length === 0}
                    onChange={(e) => onEngine(e.target.value)}
                  >
                    <option value="">
                      {engines.length === 0 ? "—" : "Sélectionne une motorisation"}
                    </option>
                    {engines.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom}{e.ch_stock ? ` · ${e.ch_stock} ch` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  variant="solid"
                  disabled={!canSubmit}
                  className="w-full py-[14px] mt-[6px] text-[15px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Voir les fichiers disponibles
                </Button>
              </div>
            </div>
          </div>

          {/* ---- Right column — DynoChart ---- */}
          <DynoChart
            hp={chart.hp}
            nm={chart.nm}
            fuel={chart.fuel}
            ecu={chart.ecu}
            title="Land Rover Evoque · D150"
            defaultStage="stock"
          />
        </div>
      </div>
    </section>
  );
}
