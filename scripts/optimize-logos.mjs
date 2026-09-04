#!/usr/bin/env node
/**
 * scripts/optimize-logos.mjs
 * - Optimizes every SVG in public/logos/ with svgo
 * - Converts every PNG > 30 KB in public/logos/ to WebP (max-width 200px) with sharp
 * Usage: node scripts/optimize-logos.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from "fs";
import { resolve, extname, basename } from "path";
import { fileURLToPath } from "url";
import { optimize } from "svgo";

const __dir    = fileURLToPath(new URL(".", import.meta.url));
const logosDir = resolve(__dir, "..", "public/logos");

const MIN_SVG_BYTES = 100; // below this → treat as broken/empty

// ── SVG optimization ────────────────────────────────────────────────────────
const svgs = readdirSync(logosDir).filter((f) => extname(f) === ".svg");
let svgOk = 0, svgSkipped = 0, svgRemoved = 0;

for (const file of svgs) {
  const path    = resolve(logosDir, file);
  const content = readFileSync(path, "utf-8");

  if (content.length < MIN_SVG_BYTES) {
    unlinkSync(path);
    console.log(`🗑️  removed ${file} (${content.length}B — too small)`);
    svgRemoved++;
    continue;
  }

  try {
    const result = optimize(content, {
      path,
      plugins: [
        {
          name: "preset-default",
          params: { overrides: {
            // Don't strip fills we injected into simple-icons paths
            convertColors: false,
          }},
        },
        // Keep viewBox so logos resize correctly with CSS
        { name: "addAttributesToSVGElement" },
      ],
    });

    if (result.data.length < content.length) {
      writeFileSync(path, result.data);
      const saved = content.length - result.data.length;
      console.log(`✅ ${file}  ${content.length}B → ${result.data.length}B  (-${saved}B)`);
      svgOk++;
    } else {
      svgSkipped++;
    }
  } catch (err) {
    console.warn(`⚠️  ${file}: svgo error — ${err.message}`);
    svgSkipped++;
  }
}

console.log(`\nSVG: ${svgOk} optimized, ${svgSkipped} unchanged, ${svgRemoved} removed\n`);

// ── PNG → WebP conversion ────────────────────────────────────────────────────
const pngs = readdirSync(logosDir).filter((f) => extname(f) === ".png");
const THRESHOLD_BYTES = 30 * 1024; // 30 KB

if (pngs.length === 0) {
  console.log("No PNG files found — nothing to convert.");
} else {
  // sharp is bundled with Next.js — resolve from the project root
  const sharpPath = resolve(__dir, "..", "node_modules/sharp");
  const { default: sharp } = await import(sharpPath);

  let pngOk = 0, pngSkipped = 0;
  for (const file of pngs) {
    const path = resolve(logosDir, file);
    const size = statSync(path).size;

    if (size <= THRESHOLD_BYTES) {
      pngSkipped++;
      continue;
    }

    const stem    = basename(file, ".png");
    const outPath = resolve(logosDir, `${stem}.webp`);
    try {
      await sharp(path)
        .resize({ width: 200, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outPath);
      const outSize = statSync(outPath).size;
      console.log(`🖼️  ${file}  ${Math.round(size / 1024)}KB → ${stem}.webp  ${Math.round(outSize / 1024)}KB`);
      pngOk++;
    } catch (err) {
      console.warn(`⚠️  ${file}: sharp error — ${err.message}`);
      pngSkipped++;
    }
  }
  console.log(`\nPNG→WebP: ${pngOk} converted, ${pngSkipped} skipped (≤30 KB or error)\n`);
}
