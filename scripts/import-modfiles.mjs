#!/usr/bin/env node
/**
 * scripts/import-modfiles.mjs
 * Importe les données chiptuning de mod-files.com vers Supabase.
 *
 * Prérequis : migration 0025_modfiles_import.sql appliquée dans Supabase.
 *
 * Options :
 *   --brand=volkswagen   n'importe qu'une seule marque (par ID mod-files)
 *
 * Variables requises dans .env.local :
 *   MODFILES_API_KEY, MODFILES_API_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent : relancer ne crée aucun doublon.
 * Reprend là où il s'était arrêté grâce aux modfiles_id stockés en base.
 *
 * Cascade API :
 *   /types/cars/marks
 *   ↳ /types/cars/marks/{mark}/models
 *     ↳ /types/cars/marks/{mark}/models/{model}/engines
 *       ↳ /types/cars/marks/{mark}/models/{model}/engines/{engine}/horsepowers
 *
 * Mapping DB :
 *   mark      → brands   (upsert par slug ; complète modfiles_id si absent)
 *   model     → models   (upsert par brand_id+slug)
 *   hp groupe → periods  (label "2013 › 2017" ou "depuis 2020")
 *   hp item   → engines  (insert si modfiles_id absent)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ── Chargement .env.local ─────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, "..");

try {
  const raw = readFileSync(resolve(root, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch { /* .env.local absent — variables déjà dans l'environnement */ }

// ── Validation env ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MF_KEY       = process.env.MODFILES_API_KEY;
const MF_SECRET    = process.env.MODFILES_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
  process.exit(1);
}
if (!MF_KEY || !MF_SECRET) {
  console.error("❌  MODFILES_API_KEY / MODFILES_API_SECRET manquants");
  process.exit(1);
}

// ── CLI args ──────────────────────────────────────────────────────────────────
const brandFilter = (process.argv.find((a) => a.startsWith("--brand=")) ?? "")
  .slice("--brand=".length) || null;

// ── Supabase admin client ─────────────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── mod-files mini-client ─────────────────────────────────────────────────────
const MF_BASE = "https://mod-files.com/api/chip/v1";
const PAUSE_MS = 350;

function pause(ms = PAUSE_MS) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mfApi(path, extra = {}) {
  const url = new URL(`${MF_BASE}${path}`);
  url.searchParams.set("api_key",    MF_KEY);
  url.searchParams.set("api_secret", MF_SECRET);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url.pathname}`);

  const json = await res.json();
  const status = String(json.status);

  if (status === "103") return [];
  if (status === "2")   throw new Error("Clés API mod-files invalides (code 2).");
  if (status === "3")   throw new Error("Abonnement mod-files absent (code 3).");
  if (status !== "0")   throw new Error(`Erreur mod-files code ${status}: ${json.error_text ?? ""}`);

  return json.data ?? [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse "115hp" → 115, "168Nm" → 168, "0" → null */
function parseVal(s) {
  const n = parseInt(String(s ?? ""), 10);
  return isNaN(n) || n <= 0 ? null : n;
}

/** Parse year strings: "0" → null, "1997" → 1997 */
function parseYear(s) {
  const n = parseInt(String(s ?? ""), 10);
  return n > 1000 ? n : null;
}

/** "2013 › 2017" ou "depuis 2020" */
function periodLabel(start, end) {
  if (!start || start === "0") return "Non daté";
  const endYear = parseYear(end);
  return endYear ? `${start} › ${endYear}` : `depuis ${start}`;
}

/** TDI / dCi / HDi / CDI / CRDi / D seul → diesel, sinon essence */
function detectFuel(name) {
  if (/\b(TDI|dCi|HDi|CDI|CRDi)\b/i.test(name)) return "diesel";
  if (/\bD\b/.test(name)) return "diesel";
  return "essence";
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀  Import mod-files → Supabase\n");

  // Récupère l'id de la catégorie voiture
  const { data: cat, error: catErr } = await sb
    .from("categories")
    .select("id")
    .eq("slug", "voiture")
    .single();
  if (catErr || !cat) throw new Error(`Catégorie "voiture" introuvable : ${catErr?.message}`);
  const voitureCatId = cat.id;
  console.log(`✓  Catégorie "voiture" : ${voitureCatId}`);

  // Récupère toutes les marques de l'API
  const rawMarks = await mfApi("/types/cars/marks");
  const allMarks = rawMarks.map((m) => m.mark).filter(Boolean);
  console.log(`✓  ${allMarks.length} marques dans l'API\n`);

  // Filtre : exclut Tesla, applique --brand= si fourni
  let marks = allMarks.filter((m) => m.id.toLowerCase() !== "tesla");
  if (brandFilter) {
    const match = marks.find((m) => m.id.toLowerCase() === brandFilter.toLowerCase());
    if (!match) {
      console.error(`⚠  Marque "${brandFilter}" introuvable.`);
      console.error(`   Disponibles : ${marks.map((m) => m.id).join(", ")}`);
      process.exit(1);
    }
    marks = [match];
    console.log(`→  Filtre activé : ${match.name} (${match.id})\n`);
  }

  const stats = { brands: 0, models: 0, periods: 0, engines: 0, skipped: 0 };

  for (const mark of marks) {
    console.log(`\n━━  ${mark.name}  (${mark.id})`);

    // ── Brand : upsert par slug ─────────────────────────────────────────────
    let brandDbId;
    const { data: existingBrand } = await sb
      .from("brands")
      .select("id, modfiles_id")
      .eq("slug", mark.id)
      .maybeSingle();

    if (existingBrand) {
      brandDbId = existingBrand.id;
      if (!existingBrand.modfiles_id) {
        await sb.from("brands").update({ modfiles_id: mark.id }).eq("id", brandDbId);
        console.log("  ↻ brand existant — modfiles_id ajouté");
      } else {
        console.log("  ✓ brand existant");
      }
    } else {
      const { data: newBrand, error } = await sb
        .from("brands")
        .insert({
          slug:        mark.id,
          nom:         mark.name,
          modfiles_id: mark.id,
          source:      "modfiles",
          category_id: voitureCatId,
          ordre:       99,
        })
        .select("id")
        .single();
      if (error) { console.error(`  ✗ brand INSERT : ${error.message}`); continue; }
      brandDbId = newBrand.id;
      console.log("  + brand créé");
      stats.brands++;
    }

    // ── Charge les modfiles_id déjà importés pour cette marque ─────────────
    const { data: existingEngines } = await sb
      .from("engines")
      .select("modfiles_id")
      .like("modfiles_id", `${mark.id}/%`)
      .not("modfiles_id", "is", null);

    const importedIds = new Set((existingEngines ?? []).map((e) => e.modfiles_id));

    // Index des modèles déjà importés (première partie du chemin)
    const importedModels = new Set();
    for (const id of importedIds) {
      const slash2 = id.indexOf("/", id.indexOf("/") + 1);
      if (slash2 !== -1) importedModels.add(id.slice(0, slash2));
    }

    console.log(`  ℹ  ${importedIds.size} moteurs déjà importés, ${importedModels.size} modèles`);

    // ── Modèles ─────────────────────────────────────────────────────────────
    await pause();
    const rawModels = await mfApi(`/types/cars/marks/${encodeURIComponent(mark.id)}/models`);
    const models = rawModels.map((m) => m.model).filter(Boolean);
    console.log(`  → ${models.length} modèles dans l'API`);

    for (const model of models) {
      const modelModfilesId = `${mark.id}/${model.id}`;

      // Skip si déjà entièrement importé
      if (importedModels.has(modelModfilesId)) {
        stats.skipped++;
        continue;
      }

      // ── Model : upsert par (brand_id, slug) ───────────────────────────────
      let modelDbId;
      const { data: existingModel } = await sb
        .from("models")
        .select("id, modfiles_id")
        .eq("brand_id", brandDbId)
        .eq("slug", model.id)
        .maybeSingle();

      if (existingModel) {
        modelDbId = existingModel.id;
        if (!existingModel.modfiles_id) {
          await sb.from("models").update({ modfiles_id: modelModfilesId }).eq("id", modelDbId);
        }
      } else {
        const { data: newModel, error } = await sb
          .from("models")
          .insert({
            slug:        model.id,
            nom:         model.name,
            brand_id:    brandDbId,
            modfiles_id: modelModfilesId,
            source:      "modfiles",
            ordre:       0,
          })
          .select("id")
          .single();
        if (error) {
          console.warn(`    ✗ model INSERT (${model.id}) : ${error.message}`);
          continue;
        }
        modelDbId = newModel.id;
        stats.models++;
        console.log(`    + modèle : ${model.name}`);
      }

      // ── Moteurs (niveau engine dans l'API) ────────────────────────────────
      await pause();
      let rawEngines;
      try {
        rawEngines = await mfApi(
          `/types/cars/marks/${encodeURIComponent(mark.id)}/models/${encodeURIComponent(model.id)}/engines`,
        );
      } catch (e) {
        console.warn(`    ✗ /engines API (${model.id}) : ${e.message}`);
        continue;
      }
      const engines = rawEngines.map((e) => e.engine).filter(Boolean);
      if (!engines.length) continue;

      for (const engine of engines) {
        // ── Puissances ────────────────────────────────────────────────────
        await pause();
        let horsepowers;
        try {
          horsepowers = await mfApi(
            `/types/cars/marks/${encodeURIComponent(mark.id)}/models/${encodeURIComponent(model.id)}/engines/${encodeURIComponent(engine.id)}/horsepowers`,
            { fields: "hp,torque,production_start_year,production_end_year,options" },
          );
        } catch (e) {
          console.warn(`    ✗ /horsepowers API (${engine.id}) : ${e.message}`);
          continue;
        }
        if (!horsepowers.length) continue;

        // ── Groupes par années de production ─────────────────────────────
        const byPeriod = new Map();
        for (const hp of horsepowers) {
          const start = hp.production_year?.start;
          const end   = hp.production_year?.end;
          const key   = `${start ?? ""}|${end ?? ""}`;
          if (!byPeriod.has(key)) byPeriod.set(key, { start, end, hps: [] });
          byPeriod.get(key).hps.push(hp);
        }

        for (const [, period] of byPeriod) {
          const label     = periodLabel(period.start, period.end);
          const anneeDebut = parseYear(period.start);
          const anneeFin   = parseYear(period.end);

          // ── Period : upsert par (model_id, label) ────────────────────
          const { data: periodRow, error: periodErr } = await sb
            .from("periods")
            .upsert(
              {
                model_id:    modelDbId,
                label,
                annee_debut: anneeDebut,
                annee_fin:   anneeFin,
                ordre:       anneeDebut ?? 0,
              },
              { onConflict: "model_id,label" },
            )
            .select("id")
            .single();

          if (periodErr || !periodRow) {
            console.warn(`    ✗ period upsert (${label}) : ${periodErr?.message}`);
            continue;
          }
          stats.periods++;

          // ── Engines : insert si modfiles_id absent ────────────────────
          for (const hp of period.hps) {
            const hpId = hp.horsepower?.id;
            if (!hpId) continue;

            const engineModfilesId = `${mark.id}/${model.id}/${engine.id}/${hpId}`;
            if (importedIds.has(engineModfilesId)) {
              stats.skipped++;
              continue;
            }

            const engineName = `${engine.name} ${hp.horsepower?.name ?? ""}`.trim();
            const chStock  = parseVal(hp.hp?.standard);
            const nmStock  = parseVal(hp.torque?.standard);
            const chStage1 = parseVal(hp.hp?.system);
            const nmStage1 = parseVal(hp.torque?.system);

            const { error: engErr } = await sb.from("engines").insert({
              period_id:   periodRow.id,
              nom:         engineName,
              carburant:   detectFuel(engine.name),
              ch_stock:    chStock,
              nm_stock:    nmStock,
              ch_stage1:   chStage1,
              nm_stage1:   nmStage1,
              modfiles_id: engineModfilesId,
              source:      "modfiles",
              disponible:  true,
            });

            if (engErr) {
              console.warn(`    ✗ engine INSERT (${engineModfilesId}) : ${engErr.message}`);
            } else {
              importedIds.add(engineModfilesId);
              stats.engines++;
            }
          }
        }
      }
    }
  }

  console.log("\n" + "═".repeat(56));
  console.log("📊  Résultat de l'import");
  console.log("═".repeat(56));
  if (stats.brands > 0) console.log(`  Nouvelles marques     : ${stats.brands}`);
  console.log(  `  Modèles créés         : ${stats.models}`);
  console.log(  `  Périodes traitées     : ${stats.periods}`);
  console.log(  `  Moteurs importés      : ${stats.engines}`);
  if (stats.skipped > 0) console.log(`  Déjà présents (sautés): ${stats.skipped}`);
  console.log("═".repeat(56));
  console.log("✅  Terminé.\n");
}

main().catch((err) => {
  console.error("\n❌  Erreur fatale :", err.message);
  process.exit(1);
});
