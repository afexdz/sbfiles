#!/usr/bin/env node
/**
 * scripts/explore-modfiles.mjs
 * Parcourt la cascade Chiptuning mod-files.com pour Volkswagen uniquement.
 * Affiche la structure JSON de chaque niveau avec 2–3 exemples.
 *
 * Usage :
 *   node scripts/explore-modfiles.mjs
 *
 * Variables requises dans .env.local :
 *   MODFILES_API_KEY
 *   MODFILES_API_SECRET
 *
 * Réponse API — particularités :
 *   • status est toujours une string ("0" = succès)
 *   • items wrappés : {"mark":{...}}, {"model":{...}}, {"engine":{...}}
 *   • horsepowers : {horsepower:{id,name}, production_year:{start,end}, hp:{...}, torque:{...}}
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Chargement minimal de .env.local (sans dépendance externe)
// ---------------------------------------------------------------------------
const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

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
} catch {
  // .env.local absent — les variables doivent déjà être dans l'environnement
}

// ---------------------------------------------------------------------------
// Mini-client (miroir de src/lib/modfiles.ts, sans TypeScript)
// ---------------------------------------------------------------------------
const BASE_URL = "https://mod-files.com/api/chip/v1";
const PAUSE_MS = 350;

function pause(ms = PAUSE_MS) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callApi(path, extraParams = {}) {
  const key = process.env.MODFILES_API_KEY;
  const secret = process.env.MODFILES_API_SECRET;
  if (!key || !secret) {
    throw new Error("MODFILES_API_KEY / MODFILES_API_SECRET manquants.");
  }

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("api_secret", secret);
  for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url.pathname}`);

  const json = await res.json();
  const status = String(json.status);

  if (status === "103") return [];
  if (status === "2")   throw new Error("Clés API invalides (code 2).");
  if (status === "3")   throw new Error("Pas d'abonnement (code 3).");
  if (status !== "0")   throw new Error(`Erreur API code ${status}: ${json.error_text ?? ""}`);

  return json.data ?? [];
}

// ---------------------------------------------------------------------------
// Helpers d'affichage
// ---------------------------------------------------------------------------
const SAMPLE = 3;

function section(title) {
  console.log("\n" + "═".repeat(70));
  console.log(`  ${title}`);
  console.log("═".repeat(70));
}

function show(label, items, count = SAMPLE) {
  const sample = items.slice(0, count);
  console.log(`\n▸ ${label}  (total : ${items.length})`);
  console.log(JSON.stringify(sample, null, 2));
}

// ---------------------------------------------------------------------------
// Exploration principale
// ---------------------------------------------------------------------------
async function main() {
  console.log("🔍  Exploration mod-files.com — Volkswagen\n");

  // ── Niveau 1 : Marques ──────────────────────────────────────────────────
  section("Niveau 1 — Marques (/types/cars/marks)");
  const rawMarks = await callApi("/types/cars/marks");
  show("Exemples bruts (items wrappés)", rawMarks);

  // Dépliage : chaque item est {"mark": {id, name}}
  const marks = rawMarks.map((m) => m.mark);
  show("Marques aplaties", marks);

  const vwEntry = marks.find(
    (m) => (m.name ?? "").toLowerCase() === "volkswagen",
  );
  if (!vwEntry) {
    console.error('\n⚠  "volkswagen" introuvable dans la liste des marques.');
    console.log("Marques disponibles :", marks.map((m) => m.name).join(", "));
    process.exit(1);
  }
  const markId = vwEntry.id;
  console.log(`\n✅  Volkswagen trouvée → id : "${markId}"`);

  // ── Niveau 2 : Modèles ──────────────────────────────────────────────────
  section(`Niveau 2 — Modèles (/types/cars/marks/${markId}/models)`);
  await pause();
  const rawModels = await callApi(`/types/cars/marks/${encodeURIComponent(markId)}/models`);
  show("Exemples bruts (items wrappés)", rawModels);

  const models = rawModels.map((m) => m.model);
  show("Modèles aplatis", models);

  if (!models.length) {
    console.log("Aucun modèle disponible.");
    process.exit(0);
  }

  // ── Niveau 3 : Moteurs (3 premiers modèles) ─────────────────────────────
  section("Niveau 3 — Moteurs (sur les 3 premiers modèles)");

  const sampleModels = models.slice(0, SAMPLE);
  const modelEngineMap = [];

  for (const model of sampleModels) {
    await pause();
    const rawEngines = await callApi(
      `/types/cars/marks/${encodeURIComponent(markId)}/models/${encodeURIComponent(model.id)}/engines`,
    );
    const engines = rawEngines.map((e) => e.engine);
    show(`Moteurs → ${model.name} (${model.id})  brut`, rawEngines);
    show(`Moteurs → ${model.name} (${model.id})  aplatis`, engines);
    modelEngineMap.push({ model, engines });
  }

  // ── Niveau 4 : Puissances (1er modèle, 3 premiers moteurs) ──────────────
  section("Niveau 4 — Puissances/horsepowers (1er modèle, jusqu'à 3 moteurs)");

  const firstEntry = modelEngineMap[0];
  if (!firstEntry || !firstEntry.engines.length) {
    console.log("Aucun moteur disponible pour le premier modèle.");
    process.exit(0);
  }

  const { model: firstModel, engines: firstEngines } = firstEntry;
  const sampleEngines = firstEngines.slice(0, SAMPLE);

  for (const engine of sampleEngines) {
    await pause();
    const rawHps = await callApi(
      `/types/cars/marks/${encodeURIComponent(markId)}/models/${encodeURIComponent(firstModel.id)}/engines/${encodeURIComponent(engine.id)}/horsepowers`,
      { fields: "hp,torque,production_start_year,production_end_year,options" },
    );
    show(
      `Puissances → ${firstModel.name} / ${engine.name}`,
      rawHps,
    );
  }

  console.log("\n✅  Exploration terminée.");
}

main().catch((err) => {
  console.error("\n❌  Erreur :", err.message);
  process.exit(1);
});
