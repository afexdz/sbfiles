"use client";

import { useState } from "react";
import { Header }   from "@/components/layout/Header";
import { Footer }   from "@/components/layout/Footer";
import Link         from "next/link";

const WRAP = "max-w-[860px] mx-auto px-[clamp(18px,4.5vw,48px)]";

const STEPS = [
  {
    n: "01",
    title: "Créez votre compte atelier",
    body: "Renseignez vos informations professionnelles (nom de l'atelier, wilaya, registre de commerce). Votre dossier est examiné par notre équipe sous 24–48 h.",
  },
  {
    n: "02",
    title: "Rechargez votre solde en tokens",
    body: "Depuis votre tableau de bord, faites une demande de recharge, effectuez le virement et saisissez le code reçu. Les tokens sont immédiatement crédités.",
  },
  {
    n: "03",
    title: "Soumettez une demande de tuning",
    body: "Trouvez le moteur dans le catalogue, choisissez le type de prestation, uploadez votre fichier ORI. La demande débite votre solde automatiquement.",
  },
  {
    n: "04",
    title: "Téléchargez votre fichier tune",
    body: "Dès que votre fichier est prêt (délai affiché en temps réel), un lien de téléchargement apparaît dans votre tableau de bord. Valable 60 minutes.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Mon atelier vient d'être approuvé — que faire en premier ?",
    a: "Commencez par recharger votre solde : allez dans Tableau de bord → Recharger, suivez la procédure de virement, puis saisissez le code reçu. Vous pourrez ensuite soumettre votre première demande.",
  },
  {
    q: "Quels calculateurs sont couverts ?",
    a: "Bosch (EDC15, EDC16, EDC17, MED, MEV…), Delphi, Siemens/Continental, Denso, Mitsubishi, Magneti Marelli et bien d'autres. La liste s'étend régulièrement. Si votre ECU n'est pas listée, contactez-nous.",
  },
  {
    q: "Quel format de fichier ORI dois-je uploader ?",
    a: "Nous acceptons les formats binaires standard : .bin, .hex, .ori. Le fichier doit être une lecture complète et non corrompue du calculateur d'origine.",
  },
  {
    q: "Quel est le délai de traitement d'une demande ?",
    a: "Le délai standard est de 24 h ouvrées à partir de la réception du fichier ORI. Un chronomètre en temps réel est affiché sur chaque demande en cours dans votre tableau de bord.",
  },
  {
    q: "Que se passe-t-il si la demande est refusée ?",
    a: "Si notre équipe ne peut pas traiter votre demande (fichier illisible, ECU non supportée, données insuffisantes), les tokens sont automatiquement recrédités sur votre compte.",
  },
  {
    q: "Puis-je demander un Stage 2 sans passer par le Stage 1 ?",
    a: "Oui, chaque demande est indépendante. Cependant, pour un Stage 2 ou 3, nous recommandons que le véhicule dispose déjà des modifications mécaniques requises (intercooler, downpipe, etc.).",
  },
  {
    q: "Comment utiliser un code de recharge ?",
    a: "Dans votre tableau de bord, la section « Utiliser un code » vous permet de saisir le code à 12 caractères reçu lors de votre recharge. Les tokens sont crédités instantanément.",
  },
  {
    q: "Le fichier tune est-il garanti ?",
    a: "Tous nos fichiers sont testés et validés par notre équipe. Si vous constatez un problème directement lié au fichier (non pas à l'installation), contactez-nous dans les 7 jours — nous le corrigeons sans frais supplémentaires.",
  },
  {
    q: "Mon compte atelier peut-il être suspendu ?",
    a: "Oui, en cas de violation des conditions d'utilisation (revente de fichiers, fausses informations, etc.). En cas de suspension, votre solde est conservé et peut faire l'objet d'un remboursement sur demande.",
  },
  {
    q: "Comment contacter le support ?",
    a: "Via le formulaire sur la page Contact, ou directement sur WhatsApp pour les urgences. Notre équipe est disponible du samedi au jeudi, de 9 h à 18 h.",
  },
];

export default function AidePage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="border-b border-line bg-card">
          <div className={`${WRAP} py-12 sm:py-16`}>
            <p className="text-ember text-xs font-semibold uppercase tracking-widest mb-3">
              Aide
            </p>
            <h1 className="font-display text-[clamp(30px,4.5vw,52px)] leading-[1.05]">
              Centre d&apos;aide SBFiles
            </h1>
            <p className="text-ink2 text-[15px] mt-4 max-w-[52ch]">
              Tout ce qu&apos;il faut savoir pour créer votre compte, recharger vos tokens
              et soumettre vos premières demandes de tuning.
            </p>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-10 sm:py-14">
          <div className={WRAP}>
            <h2 className="font-display text-[clamp(20px,2.8vw,30px)] mb-8">
              Comment ça marche
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {STEPS.map((s) => (
                <div key={s.n} className="bg-card border border-line rounded-[14px] p-6 shadow-card">
                  <p className="font-display text-[38px] leading-none text-ember/20 mb-3">{s.n}</p>
                  <h3 className="font-display text-[17px] mb-2">{s.title}</h3>
                  <p className="text-ink2 text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 sm:py-14 border-t border-line">
          <div className={WRAP}>
            <h2 className="font-display text-[clamp(20px,2.8vw,30px)] mb-8">
              Questions fréquentes
            </h2>
            <div className="space-y-2">
              {FAQ.map((item, i) => {
                const isOpen = open === i;
                return (
                  <div
                    key={i}
                    className={`border rounded-[12px] overflow-hidden transition-colors duration-150 ${
                      isOpen ? "border-ember/30 bg-ember/[0.03]" : "border-line bg-card"
                    }`}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full text-left flex items-center justify-between px-5 py-4 cursor-pointer"
                    >
                      <span className="font-semibold text-[14.5px] text-ink pr-4">{item.q}</span>
                      <span
                        className={`text-mute text-lg font-light shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-45 text-ember" : ""
                        }`}
                        aria-hidden
                      >
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-ink2 text-sm leading-relaxed border-t border-line/60 pt-4">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Still stuck? */}
            <div className="mt-10 bg-soft border border-line rounded-[14px] p-6 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <p className="font-semibold text-[14.5px] text-ink mb-1">
                  Vous n&apos;avez pas trouvé votre réponse ?
                </p>
                <p className="text-sm text-ink2">
                  Notre équipe est disponible du samedi au jeudi, 9 h – 18 h.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-ember text-white font-semibold text-sm px-5 py-2.5 rounded-[8px] hover:bg-ember-ink transition-colors duration-150 whitespace-nowrap"
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
