#!/usr/bin/env node
/**
 * scripts/check-logos.mjs
 * Reports which brand logos are present / missing in public/logos/.
 * Usage: npm run check-logos
 */
import { readFileSync, readdirSync } from "fs";
import { resolve, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dir  = fileURLToPath(new URL(".", import.meta.url));
const root   = resolve(__dir, "..");

// ── 1. Extract brand slugs from the seed migration ─────────────────────────
const migrationPath = resolve(root, "supabase/migrations/0002_seed_vehicles.sql");
const sql = readFileSync(migrationPath, "utf-8");

// Isolate the brands INSERT block (up to its ON CONFLICT clause)
const brandsBlock = sql.match(/insert into brands[\s\S]+?on conflict/i)?.[0] ?? "";

// Each value row starts with ('slug',
const slugs = [...brandsBlock.matchAll(/^\s*\('([a-z0-9-]+)',/gm)].map((m) => m[1]);

// Brands intentionally excluded from the logo requirement
const EXCLUDED = new Set(["tesla", "mercedes-citaro"]);
const expected = slugs.filter((s) => !EXCLUDED.has(s));

// DB slug → actual filename stem (mirrors BrandLogo.tsx FILE_SLUG mapping)
const FILE_SLUG = {
  "land-rover":    "landrover",
  "mercedes-benz": "mercedes",
};
function toFileSlug(s) { return FILE_SLUG[s] ?? s; }

// ── 2. Scan public/logos/ for .png and .svg files ──────────────────────────
const logosDir = resolve(root, "public/logos");
const presentBases = new Set();
try {
  for (const file of readdirSync(logosDir)) {
    const ext = extname(file);
    if (ext === ".png" || ext === ".svg") {
      presentBases.add(basename(file, ext));
    }
  }
} catch {
  // Directory doesn't exist yet — all logos missing
}

// ── 3. Report ─────────────────────────────────────────────────────────────
const present = expected.filter((s) => presentBases.has(toFileSlug(s)));
const missing = expected.filter((s) => !presentBases.has(toFileSlug(s)));

console.log(`\n📊 ${present.length} / ${expected.length} logos présents\n`);

if (missing.length === 0) {
  console.log("✅  Tous les logos sont présents !");
} else {
  console.log(`❌  ${missing.length} logo(s) manquant(s) :\n`);
  for (const s of missing) {
    console.log(`    • ${s}`);
  }
}
console.log("");
