import { createClient }  from "../../../lib/supabase/server";
import { Header }        from "@/components/layout/Header";
import { Footer }        from "@/components/layout/Footer";
import { TiltCard }      from "@/components/ui/TiltCard";
import { formatEUR }     from "@/lib/format";
import Image             from "next/image";
import Link              from "next/link";
import type { Metadata } from "next";
import type { ShopProductWithRelations } from "@/lib/types";

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "Matériel professionnel de reprogrammation moteur — interfaces AutoTuner, câbles OBD et kits bench.",
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

const WRAP = "max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)]";

export default async function BoutiquePage() {
  const supabase = await createClient().catch(() => null);

  const products = supabase
    ? await safeSelect<ShopProductWithRelations>(
        supabase
          .from("shop_products")
          .select("*, shop_variants(*), shop_images(*), shop_features(*)")
          .eq("actif", true)
          .order("ordre")
      )
    : [];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="py-[clamp(40px,5vw,74px)]">
          <div className={WRAP}>
            <div className="mb-8 sm:mb-10">
              <h1 className="font-display text-[clamp(28px,4vw,44px)]">Boutique matériel</h1>
              <p className="text-ink2 text-[15px] mt-2 max-w-[44ch]">
                Outils professionnels de reprogrammation moteur — interfaces, câbles et kits complets.
              </p>
            </div>

            {products.length === 0 ? (
              <p className="text-mute text-[15px]">Aucun produit disponible pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProductCard({ product }: { product: ShopProductWithRelations }) {
  const images  = [...(product.shop_images  ?? [])].sort((a, b) => a.ordre - b.ordre);
  const variants = [...(product.shop_variants ?? [])].sort((a, b) => a.prix_eur - b.prix_eur);
  const firstImage     = images[0];
  const cheapestVariant = variants[0];

  return (
    <TiltCard
      className="w-full"
      innerClassName="rounded-xl overflow-hidden bg-card border border-line shadow-card hover:shadow-card-lg transition-shadow duration-[300ms]"
    >
      <Link href={`/boutique/${product.slug}`} className="block">
        <div className="aspect-[4/3] relative overflow-hidden bg-soft">
          {firstImage ? (
            <Image
              src={firstImage.url}
              alt={firstImage.alt ?? product.nom}
              fill
              className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-mute text-[13px]">
              Aucune image
            </div>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-[11px] text-mute uppercase tracking-widest mb-1.5">{product.marque}</p>
          <h2 className="font-display text-[18px] sm:text-[20px] leading-tight mb-3">{product.nom}</h2>
          {cheapestVariant && (
            <p className="text-[13.5px] text-ink2">
              à partir de{" "}
              <span className="text-ember font-semibold">{formatEUR(cheapestVariant.prix_eur)}</span>
            </p>
          )}
        </div>
      </Link>
    </TiltCard>
  );
}
