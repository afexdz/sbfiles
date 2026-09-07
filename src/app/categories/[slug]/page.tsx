import { notFound }      from "next/navigation";
import type { Metadata }  from "next";
import Link               from "next/link";
import { createClient }   from "../../../../lib/supabase/server";
import { Header }         from "@/components/layout/Header";
import { Footer }         from "@/components/layout/Footer";
import { BrandCard }      from "@/components/BrandCard";
import type { Brand }     from "@/lib/types";

export const dynamicParams = true;

const HIDDEN_SLUGS = new Set(["tesla"]);

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function getSupabase() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

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

// ─── Data fetching ────────────────────────────────────────────────────────────

interface CategoryRow {
  id: string;
  slug: string;
  nom_fr: string;
  icone: string | null;
  couleur: string | null;
}

async function getCategory(slug: string): Promise<CategoryRow | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, nom_fr, icone, couleur")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return data as CategoryRow;
  } catch {
    return null;
  }
}

async function getBrandsForCategory(categoryId: string): Promise<Brand[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  return safeSelect<Brand>(
    supabase
      .from("brands")
      .select("*")
      .eq("category_id", categoryId)
      .order("ordre")
  );
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const supabase = await getSupabase();
  if (!supabase) return [];
  return safeSelect<{ slug: string }>(
    supabase.from("categories").select("slug")
  ).then((rows) => rows.map((c) => ({ slug: c.slug })));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Catégorie — SBFiles" };
  return { title: `${category.nom_fr} — SBFiles` };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const WRAP = "max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,64px)]";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await getCategory(slug);
  if (!category) notFound();

  const brands  = await getBrandsForCategory(category.id);
  const visible = brands.filter((b) => !HIDDEN_SLUGS.has(b.slug));

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-8 sm:py-12 lg:py-16`}>

          {/* Fil d'Ariane */}
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[13px] text-mute mb-6">
            <Link href="/" className="hover:text-ember-ink transition-colors duration-[150ms]">
              Accueil
            </Link>
            <span aria-hidden>/</span>
            <Link href="/marques" className="hover:text-ember-ink transition-colors duration-[150ms]">
              Marques
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink">{category.nom_fr}</span>
          </nav>

          {/* Titre */}
          <div className="mb-8">
            <h1 className="font-display text-[clamp(28px,4vw,44px)]">
              {category.nom_fr}
            </h1>
            <p className="text-ink2 text-[14.5px] mt-1.5">
              {visible.length} marque{visible.length !== 1 ? "s" : ""} au catalogue
            </p>
          </div>

          {/* Grille marques ou état vide */}
          {visible.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 gap-5 max-w-sm mx-auto">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: category.couleur ? `${category.couleur}22` : undefined }}
                aria-hidden
              >
                🔧
              </div>
              <div>
                <h2 className="font-display text-[20px] mb-2">
                  Aucune marque pour l&apos;instant
                </h2>
                <p className="text-ink2 text-[14.5px] leading-relaxed">
                  Nous travaillons à enrichir la catégorie <strong>{category.nom_fr}</strong>.
                  Tu peux faire une demande sur mesure si tu as un besoin urgent.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/marques"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded border border-line bg-card text-[14px] text-ink hover:border-line2 transition-[border-color] duration-[150ms]"
                >
                  ← Toutes les marques
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-ember text-white text-[14px] hover:bg-ember-ink transition-[background-color] duration-[150ms]"
                >
                  Demande sur mesure →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
              {visible.map((brand) => (
                <BrandCard
                  key={brand.id}
                  name={brand.nom}
                  slug={brand.slug}
                  logoUrl={brand.logo_url}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
