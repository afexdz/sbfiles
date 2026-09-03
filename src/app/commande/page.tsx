import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { CartSummary }  from "@/components/cart/CartSummary";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commande",
  robots: { index: false, follow: false },
};

const WRAP = "max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)]";

export default function CommandePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-[clamp(40px,5vw,74px)]`}>
          <div className="max-w-[640px]">
            <h1 className="font-display text-[clamp(26px,3.6vw,40px)] mb-2">
              Récapitulatif de commande
            </h1>
            <p className="text-ink2 text-[15px] mb-8">
              Vérifiez votre sélection avant de finaliser.
            </p>

            <CartSummary />

            {/* Coming soon notice */}
            <div className="mt-8 rounded-lg border border-line bg-soft px-5 py-4 flex gap-3 items-start">
              <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden className="flex-none mt-[1px] text-ember">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.2" />
                <path d="M10 6v4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="10" cy="13.5" r="0.9" fill="currentColor" />
              </svg>
              <div>
                <p className="text-[14px] font-semibold text-ink mb-0.5">Paiement en ligne bientôt disponible</p>
                <p className="text-[13.5px] text-ink2">
                  Le module de paiement sécurisé Chargily est en cours d&apos;intégration.
                  Pour commander maintenant, contactez-nous sur WhatsApp ou par e-mail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
