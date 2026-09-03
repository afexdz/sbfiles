import { createClient }       from "../../../../lib/supabase/server";
import { Header }             from "@/components/layout/Header";
import { Footer }             from "@/components/layout/Footer";
import { ProductGallery }     from "@/components/shop/ProductGallery";
import { ProductActions }     from "@/components/shop/ProductActions";
import { notFound }           from "next/navigation";
import Link                   from "next/link";
import type { Metadata }      from "next";
import type { ShopProductWithRelations } from "@/lib/types";

type Props = {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ variante?: string }>;
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

async function getProduct(slug: string): Promise<ShopProductWithRelations | null> {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return null;
  const rows = await safeSelect<ShopProductWithRelations>(
    supabase
      .from("shop_products")
      .select("*, shop_variants(*), shop_images(*), shop_features(*)")
      .eq("slug", slug)
      .eq("actif", true)
      .limit(1)
  );
  return rows[0] ?? null;
}

export async function generateStaticParams() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return [];
  const rows = await safeSelect<{ slug: string }>(
    supabase.from("shop_products").select("slug").eq("actif", true)
  );
  return rows.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produit introuvable" };
  const firstImage = [...(product.shop_images ?? [])].sort((a, b) => a.ordre - b.ordre)[0];
  return {
    title: product.nom,
    description: product.description ?? undefined,
    openGraph: firstImage ? { images: [firstImage.url] } : undefined,
  };
}

const WRAP = "max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)]";

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const product = await getProduct(slug);
  if (!product) notFound();

  const images   = [...(product.shop_images   ?? [])].sort((a, b) => a.ordre - b.ordre);
  const variants = [...(product.shop_variants ?? [])].sort((a, b) => a.ordre - b.ordre);
  const features = [...(product.shop_features ?? [])].sort((a, b) => a.ordre - b.ordre);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-[clamp(32px,4.5vw,64px)]`}>

          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[13px] text-mute mb-7">
            <Link href="/" className="hover:text-ember-ink transition-colors duration-[150ms]">
              Accueil
            </Link>
            <span aria-hidden>/</span>
            <Link href="/boutique" className="hover:text-ember-ink transition-colors duration-[150ms]">
              Boutique
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink truncate">{product.nom}</span>
          </nav>

          {/* Two-col: stacked on mobile, side-by-side on lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

            {/* Gallery */}
            <ProductGallery images={images} productName={product.nom} />

            {/* Info panel */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[11px] text-mute uppercase tracking-widest mb-2">
                  {product.marque}
                </p>
                <h1 className="font-display text-[clamp(26px,3.6vw,42px)] leading-none mb-4">
                  {product.nom}
                </h1>
                {product.description && (
                  <p className="text-ink2 text-[15px] leading-relaxed max-w-prose">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Features checklist */}
              {features.length > 0 && (
                <ul className="flex flex-col gap-2.5">
                  {features.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 text-[14.5px]">
                      <svg
                        viewBox="0 0 18 18"
                        width="18"
                        height="18"
                        fill="none"
                        aria-hidden
                        className="flex-none text-ok"
                      >
                        <circle cx="9" cy="9" r="8.5" stroke="currentColor" strokeWidth="1" />
                        <path
                          d="M5.5 9l2.5 2.5L12.5 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {f.label}
                    </li>
                  ))}
                </ul>
              )}

              {/* Variant selector + price + CTA — presélectionne ?variante= */}
              <ProductActions
                variants={variants}
                defaultVariant={sp.variante}
                productSlug={slug}
                productName={product.nom}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
