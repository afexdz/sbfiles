import { redirect }              from "next/navigation";
import { revalidatePath }        from "next/cache";
import { createClient }          from "../../../lib/supabase/server";
import { Header }                from "@/components/layout/Header";
import { Footer }                from "@/components/layout/Footer";
import { CodeRedemptionForm }    from "@/components/dashboard/CodeRedemptionForm";
import { DemandeCountdown }      from "@/components/dashboard/DemandeCountdown";
import { DownloadButton }        from "@/components/dashboard/DownloadButton";
import Link                      from "next/link";
import type { Atelier, TokenLedgerEntry, TokenMotif } from "@/lib/types";

type DemandeStatut = "recue" | "en_cours" | "livree" | "refusee" | "annulee";

type DemandeRich = {
  id:               string;
  reference:        string;
  statut:           DemandeStatut;
  cout_tokens:      number;
  option_ids:       string[];
  note_admin:       string | null;
  fichier_tune:     string | null;
  fichier_tune_nom: string | null;
  created_at:       string;
  telecharge_le:    string | null;
  delai_heures:     number | null;
  engine: {
    nom:       string;
    carburant: string | null;
    period: {
      label: string;
      model: {
        nom:   string;
        brand: { nom: string };
      };
    };
  } | null;
  tuning_type: { nom_fr: string } | null;
};

const WRAP = "max-w-[1200px] mx-auto px-[clamp(18px,4.5vw,56px)]";

const DEMANDE_BADGE: Record<DemandeStatut, string> = {
  recue:    "bg-[#EFF6FF] text-[#1D4ED8]",
  en_cours: "bg-ember-soft text-ember-ink",
  livree:   "bg-[#ECFDF5] text-[#047857]",
  refusee:  "bg-[#FEF2F2] text-[#B91C1C]",
  annulee:  "bg-soft text-mute",
};

const DEMANDE_LABEL: Record<DemandeStatut, string> = {
  recue:    "Reçue",
  en_cours: "En cours",
  livree:   "Livrée",
  refusee:  "Refusée",
  annulee:  "Annulée",
};

const MOTIF_LABEL: Record<TokenMotif, string> = {
  recharge:         "Recharge",
  demande_tuning:   "Demande tuning",
  remboursement:    "Remboursement",
  ajustement_admin: "Ajustement admin",
};

type RedeemResult = { ok: boolean; message: string; tokens_credites?: number; nouveau_solde?: number } | null;

export default async function DashboardPage() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [atelierRes, settingsRes] = await Promise.all([
    supabase.from("ateliers").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("app_settings").select("valeur").eq("cle", "token_dzd").single(),
  ]);

  const atelier  = atelierRes.data as Atelier | null;
  const tokenDzd = parseInt(settingsRes.data?.valeur ?? "1000");

  async function redeemCode(_prev: RedeemResult, fd: FormData): Promise<RedeemResult> {
    "use server";
    const code = (fd.get("code") as string | null)?.trim().toUpperCase() ?? "";
    if (!code) return { ok: false, message: "Code manquant." };
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data, error } = await sb.rpc("utiliser_code_token", { p_code: code });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard");
    return data as RedeemResult;
  }

  // ── Non approuvé states ───────────────────────────────────────────────────

  if (!atelier) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className={`${WRAP} py-12 sm:py-16`}>
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="text-4xl">🏭</div>
              <h1 className="font-display text-3xl">Espace atelier</h1>
              <p className="text-ink2 text-sm">
                Vous n&apos;avez pas encore de compte atelier. Créez-en un pour
                soumettre vos demandes de tuning et gérer vos tokens.
              </p>
              <Link href="/inscription" className="inline-block bg-ember text-white font-semibold text-sm px-6 py-3 rounded hover:bg-ember-ink transition-colors duration-150">
                Créer mon compte atelier
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (atelier.statut === "en_attente") {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className={`${WRAP} py-12 sm:py-16`}>
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="text-4xl">⏳</div>
              <h1 className="font-display text-3xl">Dossier en cours de validation</h1>
              <p className="text-ink2 text-sm">Votre demande d&apos;adhésion est en attente de validation par notre équipe.</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (atelier.statut === "refuse") {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className={`${WRAP} py-12 sm:py-16`}>
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="text-4xl">✗</div>
              <h1 className="font-display text-3xl">Demande refusée</h1>
              <p className="text-ink2 text-sm">{atelier.note_admin ?? "Votre demande d'adhésion n'a pas été acceptée."}</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Atelier approuvé : données complètes ──────────────────────────────────

  const [soldeRes, demandesRes, ledgerRes, optionsRes] = await Promise.all([
    supabase.rpc("solde_tokens", { p_atelier: atelier.id }),
    supabase
      .from("tuning_demandes")
      .select(`
        id, reference, statut, cout_tokens, option_ids, note_admin,
        fichier_tune, fichier_tune_nom,
        created_at, telecharge_le, delai_heures,
        engine:engines(
          nom, carburant,
          period:periods(
            label,
            model:models(
              nom,
              brand:brands(nom)
            )
          )
        ),
        tuning_type:tuning_types(nom_fr)
      `)
      .eq("atelier_id", atelier.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("token_ledger")
      .select("id, delta, motif, note, created_at")
      .eq("atelier_id", atelier.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("options").select("id, nom_fr"),
  ]);

  const solde    = (soldeRes.data as number) ?? 0;
  const demandes = (demandesRes.data as unknown as DemandeRich[]) ?? [];
  const ledger   = (ledgerRes.data as TokenLedgerEntry[]) ?? [];
  const optionsMap = new Map<string, string>(
    (optionsRes.data ?? []).map((o: { id: string; nom_fr: string }) => [o.id, o.nom_fr]),
  );

  async function getSignedUrl(path: string): Promise<string | null> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return null;
    const { data } = await sb.storage.from("bin-tune").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-8 sm:py-12`}>

          {/* Page title */}
          <div className="mb-8">
            <h1 className="font-display text-[clamp(26px,3.2vw,36px)]">
              Tableau de bord — {atelier.nom}
            </h1>
            <p className="text-ink2 text-[14.5px] mt-1">Atelier approuvé</p>
          </div>

          {/* ── Solde + saisie de code ── */}
          <div className="bg-card border border-line rounded-[14px] p-6 shadow-card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">

              {/* Solde */}
              <div className="sm:border-r sm:border-line sm:pr-8 shrink-0">
                <p className="text-mute text-xs uppercase tracking-wider mb-1">Solde tokens</p>
                <p className="font-display text-5xl font-bold text-ink leading-none">{solde}</p>
                <p className="text-ink2 text-sm mt-1.5">
                  ≈ {(solde * tokenDzd).toLocaleString("fr-FR")} DZD
                </p>
                <Link
                  href="/dashboard/recharge"
                  className="inline-block mt-4 bg-ember text-white font-semibold text-xs px-4 py-2 rounded hover:bg-ember-ink transition-colors duration-150"
                >
                  Demander une recharge
                </Link>
              </div>

              {/* Code */}
              <div className="flex-1 min-w-0">
                <p className="text-mute text-xs uppercase tracking-wider mb-1">Débloquer des tokens</p>
                <p className="text-ink2 text-sm mb-3">
                  Entrez le code à 12 caractères reçu lors de votre recharge.
                </p>
                <CodeRedemptionForm action={redeemCode} />
              </div>
            </div>
          </div>

          {/* ── Demandes de tuning — cartes ── */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Mes demandes</h2>
              <Link href="/demande" className="text-xs text-ember hover:underline font-medium">
                Nouvelle demande →
              </Link>
            </div>

            {demandes.length === 0 ? (
              <div className="border border-line rounded-[10px] px-6 py-10 text-center">
                <p className="text-mute text-sm">Aucune demande pour l&apos;instant.</p>
                <Link href="/demande" className="inline-block mt-3 text-xs font-medium text-ember hover:underline">
                  Soumettre ma première demande
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {demandes.map((d) => {
                  const eng          = d.engine;
                  const brand        = eng?.period?.model?.brand?.nom ?? "";
                  const model        = eng?.period?.model?.nom ?? "";
                  const period       = eng?.period?.label ?? "";
                  const engineNom    = eng?.nom ?? "";
                  const vehicleLabel = [brand, model].filter(Boolean).join(" ");
                  const optionNames  = d.option_ids
                    .map((oid) => optionsMap.get(oid))
                    .filter(Boolean) as string[];

                  return (
                    <div key={d.id} className="bg-card border border-line rounded-[12px] p-5 shadow-card">
                      {/* Row 1 : véhicule + statut */}
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-[15px] leading-tight">
                            {vehicleLabel || "Véhicule inconnu"}
                          </p>
                          <p className="text-ink2 text-[13px] mt-0.5">
                            {[period, engineNom].filter(Boolean).join(" · ")}
                            {eng?.carburant && (
                              <span className="ml-2 text-[11px] text-mute font-medium uppercase tracking-wide">
                                {eng.carburant}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${DEMANDE_BADGE[d.statut]}`}>
                          {DEMANDE_LABEL[d.statut]}
                        </span>
                      </div>

                      {/* Row 2 : type + options + référence + tokens */}
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {d.tuning_type && (
                            <span className="inline-block px-2 py-0.5 bg-soft border border-line rounded text-xs font-medium text-ink2">
                              {d.tuning_type.nom_fr}
                            </span>
                          )}
                          {optionNames.map((name) => (
                            <span key={name} className="inline-block px-2 py-0.5 bg-soft border border-line rounded text-xs text-mute">
                              {name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-mute shrink-0">
                          <span className="font-mono">{d.reference}</span>
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-ember-soft text-ember-ink font-semibold text-xs">
                            {d.cout_tokens} token{d.cout_tokens !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Row 3 : compte à rebours / téléchargement / note refus / date */}
                      <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-line">
                        <div>
                          {d.statut === "en_cours" && d.telecharge_le ? (
                            <DemandeCountdown
                              telechargeLeIso={d.telecharge_le}
                              delaiHeures={d.delai_heures ?? 72}
                            />
                          ) : d.statut === "livree" && d.fichier_tune ? (
                            <DownloadButton
                              path={d.fichier_tune}
                              nom={d.fichier_tune_nom}
                              getUrl={getSignedUrl}
                            />
                          ) : d.statut === "refusee" && d.note_admin ? (
                            <p className="text-[#B91C1C] text-xs italic max-w-sm">
                              {d.note_admin}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-mute text-xs shrink-0">
                          {new Date(d.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Historique des tokens ── */}
          <section>
            <h2 className="font-display text-xl mb-4">Historique des tokens</h2>
            {ledger.length === 0 ? (
              <p className="text-mute text-sm py-6 text-center border border-line rounded-[10px]">
                Aucun mouvement.
              </p>
            ) : (
              <div className="border border-line rounded-[10px] overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-soft border-b border-line text-ink2 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Motif</th>
                      <th className="text-left px-4 py-3">Note</th>
                      <th className="text-right px-4 py-3">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((e) => (
                      <tr key={e.id} className="border-b border-line last:border-0 hover:bg-soft/50">
                        <td className="px-4 py-3 text-mute text-xs whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-ink2">{MOTIF_LABEL[e.motif]}</td>
                        <td className="px-4 py-3 text-mute text-xs max-w-[200px] truncate">
                          {e.note ?? "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${e.delta > 0 ? "text-ok" : "text-ember"}`}>
                          {e.delta > 0 ? `+${e.delta}` : e.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
