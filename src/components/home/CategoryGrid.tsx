import { CategoryCard } from "@/components/CategoryCard";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
}

export function CategoryGrid({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <p className="text-mute text-[14.5px] py-8 text-center">
        Aucune catégorie disponible pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {categories.map((cat) => (
        <CategoryCard
          key={cat.id}
          slug={cat.slug}
          name={cat.nom_fr}
          count=""
          color={cat.couleur ?? "#3B82F6"}
          icon={cat.icone ?? "car"}
        />
      ))}
    </div>
  );
}
