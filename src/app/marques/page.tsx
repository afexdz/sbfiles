import { createClient } from "../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { BrandsGrid }   from "@/components/marques/BrandsGrid";
import type { Metadata } from "next";
import type { Brand, Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Toutes les marques — SBFiles",
  description:
    "Catalogue complet des marques couvertes par SBFiles : voiture, moto, camion, agricole, engins de chantier et loisirs motorisés.",
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

const HIDDEN_SLUGS = new Set(["tesla"]);

export default async function MarquesPage() {
  const supabase = await createClient().catch(() => null);

  const [brands, categories] = await Promise.all([
    supabase
      ? safeSelect<Brand>(supabase.from("brands").select("*").order("ordre"))
      : Promise.resolve<Brand[]>([]),
    supabase
      ? safeSelect<Category>(supabase.from("categories").select("*").order("ordre"))
      : Promise.resolve<Category[]>([]),
  ]);

  const visible = brands.filter((b) => !HIDDEN_SLUGS.has(b.slug));

  return (
    <>
      <Header />

      <main className="flex-1">
        <div className="px-[5vw] py-8 sm:py-12 lg:py-16">
          <div className="mb-6">
            <h1 className="font-display text-[clamp(28px,4vw,44px)]">
              Toutes les marques
            </h1>
            <p className="text-ink2 text-[14.5px] mt-1.5">
              {visible.length} constructeur{visible.length !== 1 ? "s" : ""} au catalogue
            </p>
          </div>

          <BrandsGrid brands={visible} categories={categories} />
        </div>
      </main>

      <Footer />
    </>
  );
}
