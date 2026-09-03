#!/usr/bin/env node
/**
 * scripts/get-logos.mjs
 * Copies SVG logos from the simple-icons npm package into public/logos/.
 * For brands absent from simple-icons, tries the SimpleIcons CDN (one-time download).
 * Run once during setup: node scripts/get-logos.mjs
 */
import { copyFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dir  = fileURLToPath(new URL(".", import.meta.url));
const root   = resolve(__dir, "..");
const npmDir = resolve(root, "node_modules/simple-icons/icons");
const dest   = resolve(root, "public/logos");

// target-file-slug → simple-icons icon slug
const MAP = {
  "landrover":       "landrover",
  "volkswagen":      "volkswagen",
  "bmw":             "bmw",
  "mercedes":        "mercedes",
  "audi":            "audi",
  "renault":         "renault",
  "peugeot":         "peugeot",
  "citroen":         "citroen",
  "ford":            "ford",
  "opel":            "opel",
  "toyota":          "toyota",
  "hyundai":         "hyundai",
  "kia":             "kia",
  "skoda":           "skoda",
  "seat":            "seat",
  "fiat":            "fiat",
  "nissan":          "nissan",
  "dacia":           "dacia",
  "volvo":           "volvo",
  "porsche":         "porsche",
  "alfa-romeo":      "alfaromeo",
  "mazda":           "mazda",
  "honda":           "honda",
  "mini":            "mini",
  "chevrolet":       "chevrolet",
  "suzuki":          "suzuki",
  "mitsubishi":      "mitsubishi",
  "jeep":            "jeep",
  "jaguar":          "jaguar",
  "lexus":           "lexus",
  "subaru":          "subaru",
  "cupra":           "cupra",
  "iveco":           "iveco",
  "scania":          "scania",
  "man":             "man",
  "daf":             "daf",
  "renault-trucks":  "renault",             // shares Renault SVG
  "john-deere":      "johndeere",
  "new-holland":     "newholland",
  "massey-ferguson": "masseyferguson",
  "case-ih":         "caseih",
  "claas":           "claas",
  "ducati":          "ducati",
  "yamaha":          "yamahamotorcorporation",
  "kawasaki":        "kawasaki",
  "ktm":             "ktm",
  "harley-davidson": "harleydavidson",
  "caterpillar":     "caterpillar",
  "komatsu":         "komatsu",
  "jcb":             "jcb",
  "sea-doo":         "seadoo",
  "yamaha-marine":   "yamahamotorcorporation", // shares Yamaha SVG
  "polaris":         "polaris",
  "can-am":          "canam",
  // "setra": not in simple-icons — will show initials
};

const fromNpm  = [];
const fromCdn  = [];
const skipped  = [];

for (const [target, siSlug] of Object.entries(MAP)) {
  const outPath  = resolve(dest, `${target}.svg`);
  const npmPath  = resolve(npmDir, `${siSlug}.svg`);

  if (existsSync(npmPath)) {
    copyFileSync(npmPath, outPath);
    fromNpm.push(target);
  } else {
    // Try SimpleIcons CDN (one-time fetch)
    const url = `https://cdn.simpleicons.org/${siSlug}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const svg = await res.text();
        // Sanity check — must look like an SVG
        if (svg.trimStart().startsWith("<svg")) {
          writeFileSync(outPath, svg);
          fromCdn.push(target);
        } else {
          skipped.push(`${target} (bad response)`);
        }
      } else {
        skipped.push(`${target} (HTTP ${res.status})`);
      }
    } catch (err) {
      skipped.push(`${target} (${err.message})`);
    }
  }
}

console.log(`\n📦 ${fromNpm.length} copied from npm package:`);
fromNpm.forEach((t) => console.log(`   ✅ ${t}.svg`));

if (fromCdn.length) {
  console.log(`\n🌐 ${fromCdn.length} fetched from CDN:`);
  fromCdn.forEach((t) => console.log(`   ✅ ${t}.svg`));
}

if (skipped.length) {
  console.log(`\n⚠️  ${skipped.length} skipped (will show initials):`);
  skipped.forEach((t) => console.log(`   • ${t}`));
}

console.log(`\nTotal: ${fromNpm.length + fromCdn.length} / ${Object.keys(MAP).length} logos saved.\n`);
