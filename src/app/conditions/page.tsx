import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales — SBFiles",
  description: "Conditions générales d'utilisation, politique de confidentialité et mentions légales de la plateforme SBFiles.",
};

const WRAP = "max-w-[800px] mx-auto px-[clamp(18px,4.5vw,48px)]";

export default function ConditionsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-12 sm:py-16`}>

          <p className="text-ember text-xs font-semibold uppercase tracking-widest mb-3">
            Légal
          </p>
          <h1 className="font-display text-[clamp(28px,4vw,44px)] mb-2">
            Conditions générales d&apos;utilisation
          </h1>
          <p className="text-mute text-sm mb-10">
            Dernière mise à jour : septembre 2026
          </p>

          <div className="prose-custom space-y-10 text-[15px]">

            <Section title="1. Définitions">
              <p>
                <strong>«&nbsp;Plateforme&nbsp;»</strong> désigne le site SBFiles accessible à l&apos;adresse en ligne de la société ainsi que l&apos;ensemble des services associés.
              </p>
              <p>
                <strong>«&nbsp;Atelier&nbsp;»</strong> désigne toute entité professionnelle (personne physique ou morale) ayant créé un compte atelier et dont le dossier a été approuvé par SBFiles.
              </p>
              <p>
                <strong>«&nbsp;Token&nbsp;»</strong> désigne l&apos;unité de compte virtuelle interne à la plateforme, utilisée pour rémunérer les prestations de reprogrammation.
              </p>
              <p>
                <strong>«&nbsp;Fichier tune&nbsp;»</strong> désigne le fichier de reprogrammation moteur produit par SBFiles à la demande d&apos;un Atelier.
              </p>
            </Section>

            <Section title="2. Objet">
              <p>
                Les présentes Conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme SBFiles par tout utilisateur. En créant un compte ou en naviguant sur la plateforme, l&apos;utilisateur accepte sans réserve les présentes CGU.
              </p>
            </Section>

            <Section title="3. Accès et inscription">
              <p>
                L&apos;accès aux fonctionnalités de soumission de demandes est réservé aux Ateliers dont le dossier a été approuvé. Toute inscription est soumise à vérification. SBFiles se réserve le droit de refuser ou de suspendre tout compte sans obligation de motiver sa décision.
              </p>
              <p>
                L&apos;utilisateur s&apos;engage à fournir des informations exactes, à maintenir la confidentialité de ses identifiants et à notifier immédiatement SBFiles de toute utilisation non autorisée de son compte.
              </p>
            </Section>

            <Section title="4. Prestations et tokens">
              <p>
                Les prestations proposées sur la plateforme sont accessibles via un système de tokens. La valeur d&apos;un token en monnaie locale est fixée par SBFiles et peut évoluer ; les tokens déjà acquis conservent leur valeur nominale.
              </p>
              <p>
                SBFiles s&apos;engage à traiter chaque demande dans le délai annoncé. En cas d&apos;impossibilité technique ou de refus, les tokens engagés sont recrédités intégralement.
              </p>
              <p>
                Les tokens ne sont ni remboursables en espèces ni transférables entre comptes.
              </p>
            </Section>

            <Section title="5. Propriété intellectuelle">
              <p>
                Les fichiers tune produits par SBFiles sont destinés à l&apos;usage exclusif de l&apos;Atelier commanditaire sur le véhicule concerné. Toute redistribution, revente ou publication de ces fichiers est strictement interdite.
              </p>
              <p>
                SBFiles conserve la propriété intellectuelle de ses outils, méthodologies et fichiers de base. L&apos;Atelier conserve la propriété de son fichier ORI d&apos;origine.
              </p>
            </Section>

            <Section title="6. Responsabilité">
              <p>
                La reprogrammation moteur modifie des paramètres d&apos;origine du véhicule. L&apos;Atelier est seul responsable de la mise en œuvre technique du fichier tune et de ses conséquences sur le véhicule, l&apos;homologation et la couverture d&apos;assurance du client final.
              </p>
              <p>
                SBFiles ne saurait être tenu responsable de dommages directs ou indirects résultant d&apos;une mauvaise utilisation des fichiers fournis, d&apos;une compatibilité matérielle insuffisante, ou d&apos;une intervention réalisée sur un calculateur défectueux.
              </p>
            </Section>

            <Section title="7. Données personnelles">
              <p>
                SBFiles collecte et traite vos données personnelles (nom, email, informations de l&apos;atelier) dans le but de gérer votre compte et d&apos;exécuter les prestations commandées. Ces données ne sont ni vendues ni cédées à des tiers.
              </p>
              <p>
                Conformément à la réglementation applicable, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données en contactant SBFiles via la page{" "}
                <a href="/contact" style={{ color: "var(--ember)" }}>Contact</a>.
              </p>
            </Section>

            <Section title="8. Modifications des CGU">
              <p>
                SBFiles se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont informés des modifications substantielles par email ou notification sur la plateforme. La poursuite de l&apos;utilisation du service vaut acceptation des nouvelles conditions.
              </p>
            </Section>

            <Section title="9. Droit applicable">
              <p>
                Les présentes CGU sont soumises au droit algérien. Tout litige sera soumis à la juridiction compétente du lieu du siège de SBFiles, sous réserve d&apos;une résolution amiable préalable.
              </p>
            </Section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-8 last:border-0 last:pb-0">
      <h2 className="font-display text-[20px] text-ink mb-4">{title}</h2>
      <div className="space-y-3 text-ink2 leading-relaxed">{children}</div>
    </div>
  );
}
