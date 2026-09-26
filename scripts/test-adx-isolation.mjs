/**
 * Test Playwright — Cloisonnement dashboard admin /adx
 * Lance avec : node scripts/test-adx-isolation.mjs
 */
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Env ──────────────────────────────────────────────────────────────────────
const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
for (const line of raw.split("\n")) {
  const eq = line.indexOf("=");
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
  if (k && !(k in process.env)) process.env[k] = v;
}

const { createClient } = await import("@supabase/supabase-js");
const { chromium } = await import("playwright");

const SITE_URL       = "https://sbfiles.com";
const SCREENSHOT_DIR = join(ROOT, "test-screenshots", "adx");

const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_SRV  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(SB_URL, SB_SRV, { auth: { autoRefreshToken: false, persistSession: false } });

// ── Test accounts ─────────────────────────────────────────────────────────────
const ADMIN_A_EMAIL   = "test-admin-a@sbfiles.test";
const ADMIN_B_EMAIL   = "test-admin-b@sbfiles.test";
const ATELIER_EMAIL   = "test-atelier-owner@sbfiles.test";
const rand            = Date.now().toString(36).toUpperCase();
const PASSWORD_A      = `TstA-${rand}`;
const PASSWORD_B      = `TstB-${rand}`;
const PASSWORD_OWN    = `TstO-${rand}`;

const TUNING_TYPE_ID  = "d65cbc89-d279-4593-9db5-624ee2cd2e31";
const ENGINE_ID       = "d6ef6219-d716-4f14-82f3-bb8cc52d192f";

// ── State (for cleanup) ──────────────────────────────────────────────────────
let createdUserIds    = [];
let createdAtelierId  = null;
let createdDemandeId  = null;
let uploadedFilePath  = null;

// ── Result collector ─────────────────────────────────────────────────────────
const results = [];
function log(step, ok, detail) {
  const status = ok ? "✅ RÉUSSI" : "❌ ÉCHOUÉ";
  results.push({ step, ok, detail });
  console.log(`\n${status} — ${step}`);
  console.log(`   ${detail}`);
}

mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ════════════════════════════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════════════════════════════
async function setup() {
  console.log("\n══════ SETUP ══════");

  // Admin A
  const { data: dA, error: eA } = await sb.auth.admin.createUser({
    email: ADMIN_A_EMAIL, password: PASSWORD_A, email_confirm: true,
  });
  if (eA) throw new Error("Create admin A: " + eA.message);
  createdUserIds.push(dA.user.id);
  await sb.from("profiles").update({ role: "admin" }).eq("id", dA.user.id);
  console.log("Admin A créé:", dA.user.id);

  // Admin B
  const { data: dB, error: eB } = await sb.auth.admin.createUser({
    email: ADMIN_B_EMAIL, password: PASSWORD_B, email_confirm: true,
  });
  if (eB) throw new Error("Create admin B: " + eB.message);
  createdUserIds.push(dB.user.id);
  await sb.from("profiles").update({ role: "admin" }).eq("id", dB.user.id);
  console.log("Admin B créé:", dB.user.id);

  // Atelier owner
  const { data: dO, error: eO } = await sb.auth.admin.createUser({
    email: ATELIER_EMAIL, password: PASSWORD_OWN, email_confirm: true,
  });
  if (eO) throw new Error("Create atelier owner: " + eO.message);
  createdUserIds.push(dO.user.id);
  console.log("Propriétaire atelier créé:", dO.user.id);

  // Atelier
  const { data: atelier, error: eAt } = await sb.from("ateliers").insert({
    user_id:   dO.user.id,
    nom:       "Atelier Test ADX",
    statut:    "approuve",
    ville:     "Alger",
    adresse:   "1 rue du test",
    telephone: "0600000000",
  }).select().single();
  if (eAt) throw new Error("Create atelier: " + eAt.message);
  createdAtelierId = atelier.id;
  console.log("Atelier créé:", createdAtelierId);

  // 10 tokens
  await sb.from("token_ledger").insert({
    atelier_id: createdAtelierId, delta: 10,
    motif: "ajustement_admin", note: "Setup test ADX",
  });

  // Fake .bin file upload
  const fakeFile = Buffer.from("FAKE_ECU_DATA_TEST_ADX\x00\x01\x02\x03\x04\x05\xFF\xFE");
  uploadedFilePath = `test/${createdAtelierId}/test-ecu.bin`;
  const { error: eUp } = await sb.storage
    .from("bin-original")
    .upload(uploadedFilePath, fakeFile, { contentType: "application/octet-stream", upsert: true });
  if (eUp) throw new Error("Upload .bin: " + eUp.message);
  console.log("Fichier .bin uploadé:", uploadedFilePath);

  // Reference — generate manually since we insert directly
  const testRef = `TST-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // Tuning demande
  const { data: demande, error: eDem } = await sb.from("tuning_demandes").insert({
    atelier_id:              createdAtelierId,
    engine_id:               ENGINE_ID,
    tuning_type_id:          TUNING_TYPE_ID,
    option_ids:              [],
    cout_tokens:             5,
    fichier_original:        uploadedFilePath,
    fichier_original_nom:    "test-ecu.bin",
    fichier_original_taille: fakeFile.length,
    reference:               testRef,
    statut:                  "recue",
    note_atelier:            "Demande test cloisonnement ADX",
    delai_heures:            24,
  }).select().single();
  if (eDem) throw new Error("Create demande: " + eDem.message);
  createdDemandeId = demande.id;
  console.log("Demande créée:", createdDemandeId, "ref:", demande.reference);

  return { demande, adminAId: dA.user.id };
}

// ════════════════════════════════════════════════════════════════════════════
// BROWSER TESTS
// ════════════════════════════════════════════════════════════════════════════
async function runBrowserTests(demande, adminAId) {
  console.log("\n══════ TESTS NAVIGATEUR ══════");

  const browser = await chromium.launch({ headless: false, slowMo: 150 });

  try {
    // ── Step 1 : Admin A se connecte, voit la demande dans "À prendre" ──────
    console.log("\n─ Étape 1 : Admin A — connexion + onglet À prendre");
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();

    await pageA.goto(`${SITE_URL}/adx/connexion`);
    await pageA.fill('input[type="email"]', ADMIN_A_EMAIL);
    await pageA.fill('input[type="password"]', PASSWORD_A);
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL("**/adx/demandes", { timeout: 20000 });
    // Wait for server component to fully hydrate
    await pageA.waitForLoadState("networkidle");
    await pageA.waitForTimeout(1500);

    // Screenshot immédiate pour debug
    await pageA.screenshot({ path: join(SCREENSHOT_DIR, "01a-debug-apres-login.png"), fullPage: true });

    // L'onglet "À prendre" est actif par défaut, mais on clique pour être sûr
    const btnAPrendre = pageA.locator("button").filter({ hasText: /À prendre/ });
    await btnAPrendre.first().click();
    await pageA.waitForTimeout(800);

    await pageA.screenshot({ path: join(SCREENSHOT_DIR, "01b-debug-a-prendre-tab.png"), fullPage: true });

    // Log the page text for debugging
    const pageText = await pageA.locator("main").textContent().catch(() => "");
    const refVisible = pageText.includes(demande.reference);

    await pageA.screenshot({ path: join(SCREENSHOT_DIR, "01-admin-a-a-prendre.png"), fullPage: true });
    log("Étape 1 — Admin A voit la demande dans À prendre", refVisible,
      refVisible
        ? `Demande ${demande.reference} visible dans l'onglet "À prendre".`
        : `Demande ${demande.reference} introuvable dans "À prendre". Page contient: ${pageText.slice(0, 200)}`
    );

    // ── Step 2 : Admin A prend en charge ──────────────────────────────────
    console.log("\n─ Étape 2 : Admin A — Prendre en charge");

    // Click the "Prendre en charge" button on the card
    const prendreBtn = pageA.locator("button", { hasText: "Prendre en charge" }).first();
    await prendreBtn.click();

    // Wait for Next.js Server Action revalidation
    await pageA.waitForTimeout(3000);

    // Navigate to "Mes demandes en cours" tab
    const btnEnCours = pageA.locator("button", { hasText: /Mes demandes en cours/ });
    await btnEnCours.first().click();
    await pageA.waitForTimeout(600);

    const inEnCours = await pageA.locator(`text=${demande.reference}`).first().isVisible().catch(() => false);

    // Also verify "À prendre" is now empty for this demande
    const btnAPrendreAgain = pageA.locator("button", { hasText: /À prendre/ });
    await btnAPrendreAgain.first().click();
    await pageA.waitForTimeout(400);
    const stillInAPrendre = await pageA.locator(`text=${demande.reference}`).first().isVisible().catch(() => false);

    await pageA.screenshot({ path: join(SCREENSHOT_DIR, "02-admin-a-en-cours.png"), fullPage: true });
    log("Étape 2 — Prise en charge par Admin A", inEnCours && !stillInAPrendre,
      inEnCours && !stillInAPrendre
        ? `Demande ${demande.reference} : retirée de "À prendre", présente dans "Mes demandes en cours".`
        : `inEnCours=${inEnCours}, stillInAPrendre=${stillInAPrendre}`
    );

    // ── Step 3 : Admin B se connecte, ne voit rien ───────────────────────
    console.log("\n─ Étape 3 : Admin B — vérification isolation");
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();

    await pageB.goto(`${SITE_URL}/adx/connexion`);
    await pageB.fill('input[type="email"]', ADMIN_B_EMAIL);
    await pageB.fill('input[type="password"]', PASSWORD_B);
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL("**/adx/demandes", { timeout: 20000 });
    await pageB.waitForTimeout(2000);

    const tabLabels = ["À prendre", "Mes demandes en cours", "Mes livrées"];
    let demandeFoundInTab = "";
    for (const label of tabLabels) {
      const tab = pageB.locator("button", { hasText: new RegExp(label) });
      await tab.first().click();
      await pageB.waitForTimeout(400);
      const found = await pageB.locator(`text=${demande.reference}`).first().isVisible().catch(() => false);
      if (found) demandeFoundInTab = label;
    }

    await pageB.screenshot({ path: join(SCREENSHOT_DIR, "03-admin-b-isolation.png"), fullPage: true });
    log("Étape 3 — Admin B ne voit pas la demande d'Admin A", !demandeFoundInTab,
      demandeFoundInTab
        ? `FAILLE : Admin B voit la demande dans l'onglet "${demandeFoundInTab}".`
        : `Admin B ne trouve ${demande.reference} dans aucun onglet (isolation correcte).`
    );

    // ── Step 4 : Admin B tente l'accès direct via RLS (client Supabase) ──
    console.log("\n─ Étape 4 : Admin B — accès direct RLS");

    // Authenticate as B with anon key and query by ID
    const sbB = createClient(SB_URL, SB_ANON, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error: signInErr } = await sbB.auth.signInWithPassword({ email: ADMIN_B_EMAIL, password: PASSWORD_B });
    if (signInErr) throw new Error("Admin B sign-in for RLS test: " + signInErr.message);

    const { data: directData } = await sbB
      .from("tuning_demandes")
      .select("id, reference, assigned_admin_id")
      .eq("id", createdDemandeId);

    await pageB.screenshot({ path: join(SCREENSHOT_DIR, "04-admin-b-direct-rls.png"), fullPage: true });
    const rlsBlocked = !directData || directData.length === 0;
    log("Étape 4 — RLS bloque la requête directe d'Admin B", rlsBlocked,
      rlsBlocked
        ? `requête .eq('id', demandeId) retourne 0 résultats pour Admin B (RLS correct).`
        : `FAILLE RLS : Admin B obtient ${JSON.stringify(directData)}.`
    );

    // ── Step 5 : Vérification admin_actions en base ───────────────────────
    console.log("\n─ Étape 5 : Vérification admin_actions");
    const { data: actions } = await sb
      .from("admin_actions")
      .select("id, action, acteur_id, created_at")
      .eq("cible_type", "tuning_demande")
      .eq("cible_id", createdDemandeId);

    const prisEnCharge = (actions ?? []).find((a) => a.action === "prise_en_charge");
    const correctActeur = prisEnCharge?.acteur_id === adminAId;

    await pageB.screenshot({ path: join(SCREENSHOT_DIR, "05-admin-actions-verification.png"), fullPage: true });
    log("Étape 5 — admin_actions contient la prise en charge par Admin A", !!prisEnCharge && correctActeur,
      prisEnCharge
        ? `action "prise_en_charge" trouvée, acteur_id=${prisEnCharge.acteur_id}, correct=${correctActeur}, à ${new Date(prisEnCharge.created_at).toLocaleString("fr-FR")}.`
        : `Aucune action "prise_en_charge" trouvée. Actions disponibles : ${JSON.stringify(actions)}`
    );

    await ctxA.close();
    await ctxB.close();

  } finally {
    await browser.close();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CLEANUP
// ════════════════════════════════════════════════════════════════════════════
async function cleanup() {
  console.log("\n══════ NETTOYAGE ══════");

  if (createdDemandeId) {
    await sb.from("admin_actions").delete().eq("cible_id", createdDemandeId);
    await sb.from("tuning_demandes").delete().eq("id", createdDemandeId);
    console.log("Demande + admin_actions supprimées");
  }
  if (createdAtelierId) {
    await sb.from("token_ledger").delete().eq("atelier_id", createdAtelierId);
    await sb.from("ateliers").delete().eq("id", createdAtelierId);
    console.log("Atelier + ledger supprimés");
  }
  if (uploadedFilePath) {
    await sb.storage.from("bin-original").remove([uploadedFilePath]);
    console.log("Fichier .bin supprimé du storage");
  }
  for (const uid of createdUserIds) {
    await sb.auth.admin.deleteUser(uid);
    console.log("Utilisateur supprimé:", uid);
  }
  console.log("Nettoyage terminé.");
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  let adminAId;
  let demande;

  try {
    const setup_result = await setup();
    demande  = setup_result.demande;
    adminAId = setup_result.adminAId;
    await runBrowserTests(demande, adminAId);
  } catch (err) {
    console.error("\nERREUR FATALE:", err.message);
    results.push({ step: "Erreur fatale", ok: false, detail: err.message });
  } finally {
    await cleanup();
  }

  // ── Final report ──────────────────────────────────────────────────────────
  console.log("\n══════ RAPPORT FINAL ══════");
  for (const r of results) {
    const icon = r.ok ? "✅" : "❌";
    console.log(`${icon} ${r.step}`);
    console.log(`   ${r.detail}`);
  }
  const allOk = results.length > 0 && results.every((r) => r.ok);
  console.log(`\n${allOk ? "✅ Tous les tests passent." : "❌ Certains tests ont échoué."}`);
  process.exit(allOk ? 0 : 1);
}

main();
