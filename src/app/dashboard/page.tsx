import { redirect }           from "next/navigation";
import { revalidatePath }      from "next/cache";
import { createClient }        from "../../../lib/supabase/server";
import { Header }              from "@/components/layout/Header";
import { Footer }              from "@/components/layout/Footer";
import { CodeRedemptionForm }  from "@/components/dashboard/CodeRedemptionForm";
import Link                    from "next/link";
import type {
  Atelier, TokenLedgerEntry, TuningDemande, DemandeStatut, TokenMotif,
} from "@/lib/types";

const WRAP = "max-w-[1200px] mx-auto px-[clamp(18px,4.5vw,56px)]";

const DEMANDE_BADGE: Record<DemandeStatut, string> = {
  recue:    "bg-[#EFF6FF] text-[#1D4ED8]",
  en_cours: "bg-ember-soft text-ember-ink",
  livree:   "bg-[#ECFDF5] text-[#047857]",
  refusee:  "bg-[#FEF2F2] text-[#B91C1C]",
  annulee:  "bg-soft text-mute",
};

const MOTIF_LABEL: Record<TokenMotif, string> = {
  recharge:          "Recharge",
  demande_tuning:    "Demande tuning",
  remboursement:     "Remboursement",
  ajustement_admin:  "Ajustement admin",
};

type RedeemResult = { ok: boolean; message: string; tokens_credites?: number; nouveau_solde?: number } | null;

export default async function DashboardPage() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Fetch atelier and settings in parallel
  const [atelierRes, settingsRes] = await Promise.all([
    supabase.from("ateliers").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("app_settings").select("valeur").eq("cle", "token_dzd").single(),
  ]);

  const atelier = atelierRes.data as Atelier | null;
  const tokenDzd = parseInt(settingsRes.data?.valeur ?? "1000");

  // Server Action : utiliser un code
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

  // ── Non approuvé ──────────────────────────────────────────────────────────
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
              <Link
                href="/inscription"
                className="inline-block bg-ember text-white font-semibold text-sm px-6 py-3 rounded hover:bg-ember-ink transition-colors duration-150"
              >
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
              <p className="text-ink2 text-sm">
                Votre demande d&apos;adhésion est en attente de validation par notre équipe.
                Vous recevrez une notification dès qu&apos;elle sera traitée.
              </p>
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
              <p className="text-ink2 text-sm">
                {atelier.note_admin ?? "Votre demande d'adhésion n'a pas été acceptée. Contactez-nous pour plus d'informations."}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Atelier approuvé ───────────────────────────────────────────────────────
  const [soldeRes, demandesRes, ledgerRes] = await Promise.all([
    supabase.rpc("solde_tokens", { p_atelier: atelier.id }),
    supabase
      .from("tuning_demandes")
      .select("id, reference, statut, cout_tokens, fichier_tune, fichier_tune_nom, created_at, engine_id, tuning_type_id")
      .eq("atelier_id", atelier.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("token_ledger")
      .select("id, delta, motif, note, created_at")
      .eq("atelier_id", atelier.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const solde = (soldeRes.data as number) ?? 0;
  const demandes = (demandesRes.data as TuningDemande[]) ?? [];
  const ledger = (ledgerRes.data as TokenLedgerEntry[]) ?? [];

  async function getSignedUrl(path: string): Promise<string | null> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return null;
    const { data } = await sb.storage
      .from("bin-tune")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-8 sm:py-12`}>
          <div className="mb-8">
            <h1 className="font-display text-[clamp(26px,3.2vw,36px)]">
              Tableau de bord — {atelier.nom}
            </h1>
            <p className="text-ink2 text-[14.5px] mt-1">Atelier approuvé</p>
          </div>

          {/* ── Rangée 1 : Solde + Saisie de code ── */}
          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {/* Solde */}
            <div className="bg-card border border-line rounded-[14px] p-6 shadow-card">
              <p className="text-mute text-xs uppercase tracking-wider mb-2">Solde tokens</p>
              <p className="font-display text-5xl font-bold text-ink mb-1">{solde}</p>
              <p className="text-ink2 text-sm">
                ≈ {(solde * tokenDzd).toLocaleString("fr-FR")} DZD
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/dashboard/recharge"
                  className="inline-block bg-ember text-white font-semibold text-xs px-4 py-2 rounded hover:bg-ember-ink transition-colors duration-150"
                >
                  Recharger
                </Link>
              </div>
            </div>

            {/* Saisie de code */}
            <div className="bg-card border border-line rounded-[14px] p-6 shadow-card">
              <p className="text-mute text-xs uppercase tracking-wider mb-3">Utiliser un code</p>
              <p className="text-ink2 text-sm mb-4">
                Entrez le code à 12 caractères fourni lors de votre recharge.
              </p>
              <CodeRedemptionForm action={redeemCode} />
            </div>
          </div>

          {/* ── Demandes de tuning ── */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Mes demandes</h2>
            </div>

            {demandes.length === 0 ? (
              <p className="text-mute text-sm py-6 text-center border border-line rounded-[10px]">
                Aucune demande pour l&apos;instant.
              </p>
            ) : (
              <div className="border border-line rounded-[10px] overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-soft border-b border-line text-ink2 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Référence</th>
                      <th className="text-left px-4 py-3">Statut</th>
                      <th className="text-left px-4 py-3">Tokens</th>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Fichier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandes.map((d) => (
                      <tr key={d.id} className="border-b border-line last:border-0 hover:bg-soft/50">
                        <td className="px-4 py-3 font-mono font-medium text-xs">{d.reference}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${DEMANDE_BADGE[d.statut]}`}>
                            {d.statut.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink2">{d.cout_tokens}</td>
                        <td className="px-4 py-3 text-mute text-xs">
                          {new Date(d.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          {d.statut === "livree" && d.fichier_tune ? (
                            <DownloadButton path={d.fichier_tune} nom={d.fichier_tune_nom} getUrl={getSignedUrl} />
                          ) : (
                            <span className="text-mute text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Historique des mouvements ── */}
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
                        <td className="px-4 py-3 text-ink2">
                          {MOTIF_LABEL[e.motif]}
                        </td>
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

// Bouton de téléchargement avec URL signée (server action)
async function DownloadButton({
  path,
  nom,
  getUrl,
}: {
  path: string;
  nom: string | null;
  getUrl: (path: string) => Promise<string | null>;
}) {
  const url = await getUrl(path);
  if (!url) return <span className="text-mute text-xs">Indisponible</span>;
  return (
    <a
      href={url}
      download={nom ?? "fichier-tune.bin"}
      className="inline-flex items-center gap-1 text-xs font-medium"
      style={{ color: "var(--ember)", textDecoration: "underline" }}
    >
      ↓ Télécharger
    </a>
  );
}
