#!/usr/bin/env node
/**
 * scripts/import-logos.mjs
 * Fetches logos from the simple-icons npm package for brands that don't yet
 * have a file in public/logos/. No HTTP requests — only the local package.
 *
 * Usage: node scripts/import-logos.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve }                                  from "path";
import { fileURLToPath }                            from "url";
import { createRequire }                            from "module";

const require  = createRequire(import.meta.url);
const si       = require("simple-icons");
const { createClient } = require("@supabase/supabase-js");

const __dir   = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(__dir, "..");
const logosDir = resolve(rootDir, "public/logos");

// ── Read .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(rootDir, ".env.local");
if (!existsSync(envPath)) { console.error(".env.local not found"); process.exit(1); }
const env = {};
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 0) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

// ── Build simple-icons slug index ────────────────────────────────────────────
const iconsBySlug = {};
for (const key of Object.keys(si)) {
  const icon = si[key];
  if (icon?.slug) iconsBySlug[icon.slug] = icon;
}

// ── DB slug → file stem (mirrors src/lib/logo-utils.ts FILE_SLUG) ───────────
const FILE_SLUG = {
  "land-rover":      "landrover",
  "mercedes-benz":   "mercedes",
  "mercedes-citaro": "mercedes",
};
function fileStem(dbSlug) { return FILE_SLUG[dbSlug] ?? dbSlug; }

// ── DB slug → simple-icons slug ─────────────────────────────────────────────
// Normalization: strip hyphens → lowercase alphanumeric
// Manual overrides for brands where simple-icons slug differs from the pattern
const SI_SLUG_OVERRIDE = {
  "yamaha":         "yamahamotorcorporation",  // yamaha-marine is separate, not in si
  "yamaha-marine":  null,                       // not in simple-icons — skip
};

function siSlug(dbSlug) {
  if (Object.prototype.hasOwnProperty.call(SI_SLUG_OVERRIDE, dbSlug)) {
    return SI_SLUG_OVERRIDE[dbSlug]; // null means "skip"
  }
  return dbSlug.replace(/-/g, "").toLowerCase();
}

function hasLogo(stem) {
  return [".svg", ".webp", ".png", ".jpg"].some(
    (ext) => existsSync(resolve(logosDir, stem + ext))
  );
}

// ── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: brands, error: brandsErr } = await supabase
  .from("brands")
  .select("id, nom, slug")
  .order("nom");
if (brandsErr) { console.error("DB error:", brandsErr.message); process.exit(1); }

const { data: modelRows } = await supabase.from("models").select("brand_id");
const modelCount = {};
for (const { brand_id } of modelRows ?? []) {
  modelCount[brand_id] = (modelCount[brand_id] ?? 0) + 1;
}

// ── Main loop ────────────────────────────────────────────────────────────────
let imported = 0;
const missing = [];

for (const brand of brands ?? []) {
  const stem = fileStem(brand.slug);
  if (hasLogo(stem)) continue;

  const slug = siSlug(brand.slug);
  if (slug === null) {
    // Explicitly skipped
    missing.push({ nom: brand.nom, slug: brand.slug, models: modelCount[brand.id] ?? 0 });
    continue;
  }

  const icon = iconsBySlug[slug];
  if (!icon) {
    missing.push({ nom: brand.nom, slug: brand.slug, models: modelCount[brand.id] ?? 0 });
    continue;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${icon.hex}"><path d="${icon.path}"/></svg>`;
  const outPath = resolve(logosDir, `${brand.slug}.svg`);
  writeFileSync(outPath, svg, "utf-8");
  console.log(`✅  ${brand.slug.padEnd(30)} → si:${icon.slug} #${icon.hex}`);
  imported++;
}

console.log(`\n${imported} logo(s) imported from simple-icons.`);
if (missing.length === 0) {
  console.log("All brands covered!");
} else {
  console.log(`${missing.length} brand(s) without logo (sorted by model count):\n`);
  missing
    .sort((a, b) => b.models - a.models)
    .forEach((m) => console.log(`  ${String(m.models).padStart(4)}  ${m.nom}  (${m.slug})`));
}
