import Link   from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ProductNotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center text-center gap-6 max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-soft border border-line flex items-center justify-center text-3xl" aria-hidden>
            🔍
          </div>
          <div>
            <h1 className="font-display text-[24px] sm:text-[28px] mb-2">
              Produit introuvable
            </h1>
            <p className="text-ink2 text-[14.5px] leading-relaxed">
              Ce produit n&apos;existe pas ou n&apos;est plus disponible.
            </p>
          </div>
          <Link
            href="/boutique"
            className="flex items-center gap-2 px-5 py-2.5 rounded border border-line bg-card text-[14px] text-ink hover:border-line2 transition-[border-color] duration-[150ms]"
          >
            ← Voir la boutique
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
