/**
 * src/lib/modfiles.ts
 * Client serveur pour l'API Chiptuning de mod-files.com.
 * Usage EXCLUSIVEMENT côté serveur — ne jamais importer dans du code client.
 *
 * Cascade :
 *   getMarks()
 *   getModels(mark)
 *   getEngines(mark, model)
 *   getHorsepowers(mark, model, engine)
 *
 * Codes d'erreur API (status est renvoyé en tant que string) :
 *   "0"   → succès
 *   "2"   → clés API invalides
 *   "3"   → abonnement absent ou inactif
 *   "103" → aucun résultat (retourné comme tableau vide, pas une exception)
 */

const BASE_URL = "https://mod-files.com/api/chip/v1";

/** Délai minimum entre deux appels consécutifs (ms). */
const PAUSE_MS = 350;

// ---------------------------------------------------------------------------
// Types — structure brute renvoyée par l'API
// ---------------------------------------------------------------------------

/** Enveloppe générique de la réponse mod-files. status est toujours une string. */
export interface ModFilesResponse<T> {
  status: string;
  total: number;
  data: T[];
  error_text?: string;
}

// Items bruts (les données sont wrappées par la clé de la ressource)
export interface RawMarkItem   { mark:   { id: string; name: string } }
export interface RawModelItem  { model:  { id: string; name: string } }
export interface RawEngineItem { engine: { id: string; name: string } }

export interface RawHorsepowerItem {
  options: string[] | null;
  horsepower: { id: string; name: string };
  production_year: { start: string | null; end: string | null };
  hp: { standard: string; system: string; difference: string };
  torque: { standard: string; system: string; difference: string };
}

// Types aplatis exposés à l'extérieur du module
export interface CarMark   { id: string; name: string }
export interface CarModel  { id: string; name: string }
export interface Engine    { id: string; name: string }

export interface Horsepower {
  id: string;
  name: string;
  options: string[] | null;
  productionYearStart: string | null;
  productionYearEnd: string | null;
  hp: { standard: string; system: string; difference: string };
  torque: { standard: string; system: string; difference: string };
}

// ---------------------------------------------------------------------------
// Erreur personnalisée
// ---------------------------------------------------------------------------

export class ModFilesError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ModFilesError";
  }
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

function getCredentials(): { api_key: string; api_secret: string } {
  const api_key = process.env.MODFILES_API_KEY;
  const api_secret = process.env.MODFILES_API_SECRET;
  if (!api_key || !api_secret) {
    throw new ModFilesError(
      "0",
      "Les variables MODFILES_API_KEY et MODFILES_API_SECRET sont requises.",
    );
  }
  return { api_key, api_secret };
}

function pause(ms = PAUSE_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function call<T>(
  path: string,
  extraParams: Record<string, string> = {},
): Promise<T[]> {
  const { api_key, api_secret } = getCredentials();

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", api_key);
  url.searchParams.set("api_secret", api_secret);
  for (const [k, v] of Object.entries(extraParams)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new ModFilesError(
      String(res.status),
      `HTTP ${res.status} ${res.statusText} — ${url.pathname}`,
    );
  }

  const json = (await res.json()) as ModFilesResponse<T>;
  const status = String(json.status);

  switch (status) {
    case "0":
      return json.data ?? [];
    case "103":
      // Aucun résultat — pas fatal
      return [];
    case "2":
      throw new ModFilesError("2", "Clés API mod-files invalides.");
    case "3":
      throw new ModFilesError(
        "3",
        "Abonnement mod-files absent ou inactif pour cette ressource.",
      );
    default:
      throw new ModFilesError(
        status,
        json.error_text ?? `Erreur mod-files (code ${status}).`,
      );
  }
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/** Liste toutes les marques automobiles disponibles. */
export async function getMarks(): Promise<CarMark[]> {
  const items = await call<RawMarkItem>("/types/cars/marks");
  return items.map((i) => i.mark);
}

/** Liste les modèles d'une marque. */
export async function getModels(mark: string): Promise<CarModel[]> {
  await pause();
  const items = await call<RawModelItem>(
    `/types/cars/marks/${encodeURIComponent(mark)}/models`,
  );
  return items.map((i) => i.model);
}

/** Liste les moteurs d'un modèle. */
export async function getEngines(
  mark: string,
  model: string,
): Promise<Engine[]> {
  await pause();
  const items = await call<RawEngineItem>(
    `/types/cars/marks/${encodeURIComponent(mark)}/models/${encodeURIComponent(model)}/engines`,
  );
  return items.map((i) => i.engine);
}

/** Liste les variantes de puissance d'un moteur. */
export async function getHorsepowers(
  mark: string,
  model: string,
  engine: string,
): Promise<Horsepower[]> {
  await pause();
  const items = await call<RawHorsepowerItem>(
    `/types/cars/marks/${encodeURIComponent(mark)}/models/${encodeURIComponent(model)}/engines/${encodeURIComponent(engine)}/horsepowers`,
    { fields: "hp,torque,production_start_year,production_end_year,options" },
  );
  return items.map((i) => ({
    id: i.horsepower.id,
    name: i.horsepower.name,
    options: i.options,
    productionYearStart: i.production_year?.start ?? null,
    productionYearEnd: i.production_year?.end ?? null,
    hp: i.hp,
    torque: i.torque,
  }));
}
