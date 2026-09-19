import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "../../../../lib/supabase/server";

// ── Rate limiting (in-memory, 20 msg/hour per user or IP) ───────────────────
const RATE_LIMIT = 20;
const WINDOW_MS  = 60 * 60 * 1000; // 1 hour

interface RateEntry { count: number; resetAt: number }
const rateLimitMap = new Map<string, RateEntry>();

// Clean up entries older than the window to avoid memory growth
function pruneRateMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  pruneRateMap();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string }
interface RequestBody { question: string; history?: Message[] }

// ── Build system context from DB ─────────────────────────────────────────────
async function buildContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string | null) {
  const [
    { data: tuningTypes },
    { data: options },
    { data: settings },
    { data: marques },
  ] = await Promise.all([
    supabase.from("tuning_types").select("nom_fr, cout_tokens, description").order("ordre"),
    supabase.from("options").select("nom_fr, cout_tokens, prix_dzd").order("ordre"),
    supabase.from("app_settings").select("cle, valeur"),
    supabase.from("marques").select("nom").order("nom"),
  ]);

  const tokenDzd = settings?.find((s: { cle: string; valeur: string }) => s.cle === "token_dzd")?.valeur ?? "1000";

  let atelierContext = "";
  if (userId) {
    const { data: atelier } = await supabase
      .from("ateliers")
      .select("id, nom, statut")
      .eq("user_id", userId)
      .eq("statut", "approuve")
      .maybeSingle();

    if (atelier) {
      const [{ data: ledger }, { data: demandes }] = await Promise.all([
        supabase
          .from("token_ledger")
          .select("delta")
          .eq("atelier_id", atelier.id),
        supabase
          .from("tuning_demandes")
          .select("reference, statut, cout_tokens, created_at, livree_le")
          .eq("atelier_id", atelier.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      const solde = (ledger ?? []).reduce(
        (sum: number, r: { delta: number }) => sum + r.delta,
        0,
      );
      const demandesText = (demandes ?? [])
        .map(
          (d: { reference: string; statut: string; cout_tokens: number; created_at: string; livree_le: string | null }) =>
            `  - ${d.reference} | ${d.statut} | ${d.cout_tokens} tokens | ${d.created_at.slice(0, 10)}${d.livree_le ? " → livré " + d.livree_le.slice(0, 10) : ""}`,
        )
        .join("\n");
      atelierContext = `
## Atelier connecté : ${atelier.nom}
Solde de tokens : ${solde} tokens
Dernières demandes (max 10) :
${demandesText || "  Aucune demande"}
`;
    }
  }

  const typesText = (tuningTypes ?? [])
    .map(
      (t: { nom_fr: string; cout_tokens: number; description: string | null }) =>
        `  - ${t.nom_fr} : ${t.cout_tokens} tokens${t.description ? " — " + t.description : ""}`,
    )
    .join("\n");

  const optionsText = (options ?? [])
    .map(
      (o: { nom_fr: string; cout_tokens: number; prix_dzd: number }) =>
        `  - ${o.nom_fr} : ${o.cout_tokens} tokens (${o.prix_dzd} DZD)`,
    )
    .join("\n");

  const marquesText = (marques ?? [])
    .map((m: { nom: string }) => m.nom)
    .join(", ");

  return `# Contexte SBFiles

## À propos
SBFiles est la plateforme algérienne de fichiers de reprogrammation moteur. Les ateliers approuvés soumettent des demandes de tuning, qui sont traitées par l'équipe technique.

## Taux de change
1 token = ${tokenDzd} DZD

## Types de tuning disponibles
${typesText || "  (données non disponibles)"}

## Options disponibles
${optionsText || "  (données non disponibles)"}

## Marques couvertes dans le catalogue
${marquesText || "(catalogue non disponible)"}
${atelierContext}`;
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }
  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question vide." }, { status: 400 });
  }
  const history: Message[] = (body.history ?? []).slice(-20); // keep last 20 exchanges

  // 2. Get user identity for rate limiting
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ip  = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = user?.id ?? ip;

  // 3. Rate limit check
  const { allowed, remaining } = checkRateLimit(key);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de messages atteinte (20/heure). Réessayez plus tard." },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": "0" },
      },
    );
  }

  // 4. Build context from DB
  const context = await buildContext(supabase, user?.id ?? null);

  // 5. Call Anthropic
  const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

  const systemPrompt = `Tu es l'assistant IA de SBFiles, la plateforme algérienne de reprogrammation moteur. Tu réponds exclusivement en français. Tu aides les ateliers et les utilisateurs à comprendre le catalogue, les tarifs, les types de tuning, et l'état de leurs demandes.

Règles impératives :
- Ne révèle jamais d'informations sur d'autres ateliers.
- N'invente aucune donnée — utilise uniquement les informations fournies dans le contexte.
- Si une question sort du domaine de SBFiles ou de la reprogrammation moteur, redirige poliment vers le support humain.
- Reste concis et factuel. Pas de listes à puces excessives.
- Pour toute question sensible (technique complexe, litige, paiement), suggère de contacter le support.

${context}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: question },
      ],
    });

    const answer =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return NextResponse.json(
      { answer },
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch (err) {
    console.error("[assistant] Anthropic error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse. Veuillez réessayer." },
      { status: 502 },
    );
  }
}
