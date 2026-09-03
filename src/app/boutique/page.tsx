import { createClient }  from "../../../lib/supabase/server";
import { Header }        from "@/components/layout/Header";
import { Footer }        from "@/components/layout/Footer";
import { ShopGrid }      from "@/components/shop/ShopGrid";
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

  /* Flatten: one card per variant, each carrying full product data for the modal */
  const cards = products.flatMap((product) => {
    const allImages   = [...(product.shop_images   ?? [])].sort((a, b) => a.ordre - b.ordre);
    const allVariants = [...(product.shop_variants ?? [])].sort((a, b) => a.ordre - b.ordre);
    const allFeatures = [...(product.shop_features ?? [])].sort((a, b) => a.ordre - b.ordre);
    const firstImage  = allImages[0] ?? null;
    const image       = firstImage ? { url: firstImage.url, alt: firstImage.alt } : null;

    return allVariants.map((v) => ({
      productSlug: product.slug,
      variantId:   v.id,
      variantSlug: v.slug,
      productName: product.nom,
      variantName: v.nom,
      brand:       product.marque,
      prixEur:     v.prix_eur,
      image,
      description: product.description,
      allVariants,
      allImages,
      allFeatures,
    }));
  });

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

            {cards.length === 0 ? (
              <p className="text-mute text-[15px]">Aucun produit disponible pour le moment.</p>
            ) : (
              <ShopGrid cards={cards} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
