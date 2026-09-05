import { createClient } from "../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import Link             from "next/link";
import type { Metadata } from "next";
import type { TuningType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tarifs — SBFiles",
  description:
    "Grille tarifaire SBFiles : système de tokens, coût par type de prestation, options de recharge. Transparent, sans abonnement.",
};

const WRAP = "max-w-[900px] mx-auto px-[clamp(18px,4.5vw,48px)]";

async function safeSelect<T>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  try {
    const { data } = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function TarifsPage() {
  const supabase = await createClient().catch(() => null);

  const [tuningTypes, settingRows] = await Promise.all([
    supabase
      ? safeSelect<TuningType>(supabase.from("tuning_types").select("*").order("ordre"))
      : Promise.resolve<TuningType[]>([]),
    supabase
      ? safeSelect<{ cle: string; valeur: string }>(
          supabase.from("app_settings").select("cle, valeur").eq("cle", "token_dzd")
        )
      : Promise.resolve<{ cle: string; valeur: string }[]>([]),
  ]);

  const tokenDzd = parseInt(settingRows[0]?.valeur ?? "1000", 10);

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="border-b border-line bg-card">
          <div className={`${WRAP} py-12 sm:py-16`}>
            <p className="text-ember text-xs font-semibold uppercase tracking-widest mb-3">
              Tarifs
            </p>
            <h1 className="font-display text-[clamp(30px,4.5vw,52px)] leading-[1.05]">
              Système de tokens — simple et transparent
            </h1>
            <p className="text-ink2 text-[15px] mt-4 max-w-[52ch]">
              Pas d&apos;abonnement, pas de frais cachés. Vous achetez des tokens,
              vous les dépensez uniquement quand vous soumettez une demande.
            </p>
          </div>
        </section>

        {/* Token value card */}
        <section className="py-10 sm:py-14">
          <div className={WRAP}>
            <h2 className="font-display text-[clamp(20px,2.5vw,28px)] mb-6">
              Valeur d&apos;un token
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <div className="bg-card border border-line rounded-[14px] p-6 shadow-card">
                <p className="text-mute text-xs uppercase tracking-wider mb-2">1 token =</p>
                <p className="font-display text-[48px] leading-none text-ember">
                  {tokenDzd.toLocaleString("fr-DZ")}
                  <span className="text-[24px] ml-1 text-ink2">DZD</span>
                </p>
                <p className="text-ink2 text-sm mt-2">Taux en vigueur</p>
              </div>
              <div className="bg-ember/5 border border-ember/20 rounded-[14px] p-6">
                <h3 className="font-display text-[18px] mb-3 text-ember-ink">
                  Comment recharger ?
                </h3>
                <ol className="space-y-2 text-sm text-ink2">
                  <li className="flex gap-2">
                    <span className="text-ember font-bold">1.</span>
                    Faites une demande de recharge depuis votre tableau de bord.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-ember font-bold">2.</span>
                    Effectuez le virement ou le paiement mobile correspondant.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-ember font-bold">3.</span>
                    Recevez un code à 12 caractères et saisissez-le pour créditer vos tokens.
                  </li>
                </ol>
                <div className="mt-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember hover:underline"
                  >
                    Créer un compte atelier →
                  </Link>
                </div>
              </div>
            </div>

            {/* Tuning types pricing table */}
            <h2 className="font-display text-[clamp(20px,2.5vw,28px)] mb-6">
              Coût par prestation
            </h2>

            {tuningTypes.length > 0 ? (
              <div className="border border-line rounded-[14px] overflow-hidden bg-card shadow-card">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-soft border-b border-line text-xs text-ink2 uppercase tracking-wider">
                      <th className="text-left px-5 py-3">Prestation</th>
                      <th className="text-left px-5 py-3">Description</th>
                      <th className="text-right px-5 py-3">Tokens</th>
                      <th className="text-right px-5 py-3">Équivalent DZD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tuningTypes.map((t, i) => (
                      <tr
                        key={t.id}
                        className={`border-b border-line last:border-0 ${i % 2 === 1 ? "bg-soft/40" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <span className="font-display text-[16px]">{t.nom_fr}</span>
                        </td>
                        <td className="px-5 py-4 text-ink2 text-[13px] max-w-[240px]">
                          {t.description ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-ember text-[15px]">
                          {t.cout_tokens}
                        </td>
                        <td className="px-5 py-4 text-right text-ink2 text-[13px] font-mono">
                          {(t.cout_tokens * tokenDzd).toLocaleString("fr-DZ")} DZD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-line rounded-[14px] p-8 bg-card text-center text-mute text-sm">
                Grille tarifaire disponible après connexion.
              </div>
            )}

            <p className="text-mute text-xs mt-4">
              Les tarifs s&apos;entendent hors options. Le coût des options est détaillé lors de la soumission de la demande.
            </p>
          </div>
        </section>

        {/* FAQ prix */}
        <section className="py-10 sm:py-14 border-t border-line">
          <div className={WRAP}>
            <h2 className="font-display text-[clamp(20px,2.5vw,28px)] mb-8">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Les tokens expirent-ils ?",
                  a: "Non. Vos tokens restent disponibles indéfiniment sur votre compte tant que celui-ci est actif.",
                },
                {
                  q: "Peut-on obtenir un remboursement si la demande est refusée ?",
                  a: "Oui. Si votre demande est refusée par notre équipe, les tokens sont automatiquement recrédités sur votre solde.",
                },
                {
                  q: "Y a-t-il un montant minimum de recharge ?",
                  a: "Le montant minimum correspond à 1 token. En pratique, nous conseillons de recharger par tranche de 5 ou 10 tokens pour couvrir plusieurs demandes.",
                },
                {
                  q: "Les prix peuvent-ils changer ?",
                  a: "La valeur du token en DZD peut être révisée. Vous serez informé de tout changement. Les tokens déjà achetés conservent leur valeur nominale en tokens.",
                },
              ].map((item) => (
                <div key={item.q} className="bg-card border border-line rounded-[12px] p-5">
                  <p className="font-semibold text-[14.5px] text-ink mb-2">{item.q}</p>
                  <p className="text-ink2 text-sm">{item.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/aide"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ember hover:underline"
              >
                Centre d&apos;aide complet →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink2 hover:text-ink"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
