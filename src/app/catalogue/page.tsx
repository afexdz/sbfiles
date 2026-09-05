import { createClient } from "../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import Link             from "next/link";
import type { Metadata } from "next";
import type { TuningType, Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Catalogue — SBFiles",
  description:
    "Catalogue complet de fichiers de reprogrammation moteur : Stage 1, Stage 2, EGR Off, DPF Off et plus. Tous calculateurs, toutes marques.",
};

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

const WRAP  = "max-w-[1100px] mx-auto px-[clamp(18px,4.5vw,56px)]";

const TYPE_ICON: Record<string, string> = {
  "stage-1":  "⚡",
  "stage-2":  "🔥",
  "stage-3":  "🏁",
  "egr-off":  "🔧",
  "dpf-off":  "🌬️",
  "adblue-off": "💧",
  "pop-bang": "💥",
  "launch-control": "🚀",
};

const CAT_ICON: Record<string, string> = {
  voiture: "🚗",
  moto:    "🏍️",
  camion:  "🚛",
  agricole:"🚜",
  engin:   "⚙️",
  loisir:  "🛥️",
};

export default async function CataloguePage() {
  const supabase = await createClient().catch(() => null);

  const [tuningTypes, categories] = await Promise.all([
    supabase
      ? safeSelect<TuningType>(supabase.from("tuning_types").select("*").order("ordre"))
      : Promise.resolve<TuningType[]>([]),
    supabase
      ? safeSelect<Category>(supabase.from("categories").select("*").order("ordre"))
      : Promise.resolve<Category[]>([]),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="border-b border-line bg-card">
          <div className={`${WRAP} py-12 sm:py-16`}>
            <p className="text-ember text-xs font-semibold uppercase tracking-widest mb-3">
              Catalogue
            </p>
            <h1 className="font-display text-[clamp(30px,4.5vw,52px)] max-w-[20ch] leading-[1.05]">
              Fichiers de reprogrammation moteur
            </h1>
            <p className="text-ink2 text-[15px] mt-4 max-w-[56ch]">
              Tous nos fichiers sont préparés sur calculateur précis — jamais un patch
              générique. ECU identifiée, map originale lue, modification ciblée, test banc.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/marques"
                className="inline-flex items-center gap-2 bg-ember text-white font-semibold text-sm px-5 py-2.5 rounded-[8px] hover:bg-ember-ink transition-colors duration-150"
              >
                Parcourir par marque →
              </Link>
              <Link
                href="/inscription"
                className="inline-flex items-center gap-2 border border-line bg-card text-ink font-medium text-sm px-5 py-2.5 rounded-[8px] hover:border-ink2 transition-colors duration-150"
              >
                Créer un compte atelier
              </Link>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-10 sm:py-14">
          <div className={WRAP}>
            <h2 className="font-display text-[clamp(22px,3vw,32px)] mb-8">
              Comment ça marche
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  n: "01",
                  title: "Trouvez votre moteur",
                  body: "Naviguez par marque, modèle, millésime et code moteur. Chaque fiche détaille la puissance stock et les gains attendus.",
                },
                {
                  n: "02",
                  title: "Soumettez une demande",
                  body: "Uploadez votre fichier ORI. Notre équipe le traite sous 24 h et vous envoie le fichier tune prêt à flasher.",
                },
                {
                  n: "03",
                  title: "Flashez & profitez",
                  body: "Téléchargez votre fichier depuis le tableau de bord, flashez avec votre interface et constatez le gain.",
                },
              ].map((step) => (
                <div key={step.n} className="bg-card border border-line rounded-[14px] p-6 shadow-card">
                  <p className="font-display text-[40px] leading-none text-ember/20 mb-3">{step.n}</p>
                  <h3 className="font-display text-[18px] mb-2">{step.title}</h3>
                  <p className="text-ink2 text-sm">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Types de tuning */}
        <section className="py-10 sm:py-14 bg-card border-y border-line">
          <div className={WRAP}>
            <h2 className="font-display text-[clamp(22px,3vw,32px)] mb-2">
              Types de prestations
            </h2>
            <p className="text-ink2 text-sm mb-8 max-w-[50ch]">
              Chaque prestation a un coût en tokens. Consultez la{" "}
              <Link href="/tarifs" className="text-ember hover:underline">
                grille tarifaire
              </Link>{" "}
              pour les détails.
            </p>

            {tuningTypes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tuningTypes.map((t) => (
                  <div
                    key={t.id}
                    className="bg-bg border border-line rounded-[12px] p-5 hover:border-ember/40 hover:shadow-card transition-[border-color,box-shadow] duration-200"
                  >
                    <div className="text-2xl mb-3">
                      {TYPE_ICON[t.slug] ?? "📄"}
                    </div>
                    <h3 className="font-display text-[18px] mb-1">{t.nom_fr}</h3>
                    <p className="text-ink2 text-[13.5px] mb-3">{t.description}</p>
                    <p className="text-xs font-semibold text-ember">
                      {t.cout_tokens} token{t.cout_tokens !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-mute text-sm">Chargement du catalogue…</p>
            )}
          </div>
        </section>

        {/* Catégories de véhicules */}
        {categories.length > 0 && (
          <section className="py-10 sm:py-14">
            <div className={WRAP}>
              <h2 className="font-display text-[clamp(22px,3vw,32px)] mb-8">
                Tous types de véhicules
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/marques?cat=${c.slug}`}
                    className="bg-card border border-line rounded-[12px] p-5 text-center hover:border-ember/40 hover:shadow-card transition-[border-color,box-shadow] duration-200 group"
                  >
                    <div className="text-3xl mb-2">
                      {CAT_ICON[c.slug] ?? c.icone ?? "🔩"}
                    </div>
                    <p className="text-sm font-medium text-ink group-hover:text-ember transition-colors duration-150">
                      {c.nom_fr}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-10 sm:py-14">
          <div className={WRAP}>
            <div
              className="rounded-[14px] px-[clamp(24px,4.5vw,48px)] py-[clamp(28px,4vw,48px)] flex flex-wrap gap-6 items-center justify-between shadow-card-lg"
              style={{ background: "linear-gradient(120deg, #12202B, #1B3040)", color: "#fff" }}
            >
              <div>
                <h2 className="font-display text-[clamp(22px,3vw,36px)] max-w-[20ch]">
                  Votre moteur n&apos;est pas au catalogue ?
                </h2>
                <p className="mt-2 text-[14.5px] max-w-[40ch]" style={{ color: "#A9BCCA" }}>
                  Envoyez le code moteur et le calculateur, on vous répond sous 24 h.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-ember text-white font-semibold text-sm px-6 py-3 rounded-[8px] hover:bg-ember-ink transition-colors duration-150 whitespace-nowrap"
              >
                Nous contacter →
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
