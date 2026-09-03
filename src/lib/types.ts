export type Fuel = "essence" | "diesel" | "hybride";
export type OrderStatus = "en_attente" | "paye" | "annule";

export interface Category {
  id: string;
  slug: string;
  nom_fr: string;
  icone: string | null;
  couleur: string | null;
  ordre: number;
}

export interface Brand {
  id: string;
  slug: string;
  nom: string;
  logo_url: string | null;
  category_id: string;
  ordre: number;
}

export interface Model {
  id: string;
  slug: string;
  nom: string;
  brand_id: string;
  ordre: number;
}

export interface Period {
  id: string;
  model_id: string;
  label: string;
  annee_debut: number | null;
  annee_fin: number | null;
  image_url: string | null;
  ordre: number;
}

export interface Engine {
  id: string;
  period_id: string;
  nom: string;
  code_moteur: string | null;
  carburant: Fuel | null;
  ch_stock: number | null;
  nm_stock: number | null;
  ecu: string | null;
}

export interface TuningType {
  id: string;
  slug: string;
  nom_fr: string;
  description: string | null;
  ordre: number;
}

export interface TuningFile {
  id: string;
  engine_id: string;
  tuning_type_id: string;
  ch_tune: number | null;
  nm_tune: number | null;
  prix_dzd: number | null;
  fichier_path: string | null;
  actif: boolean;
  created_at: string;
}

export interface Option {
  id: string;
  slug: string;
  nom_fr: string;
  prix_dzd: number;
  ordre: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  statut: OrderStatus;
  montant_dzd: number | null;
  ref_chargily: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  file_id: string;
  option_ids: string[];
  prix_dzd: number;
}

/* ---- Joined / enriched types used in the UI ---- */

export interface EngineWithPeriod extends Engine {
  period: Period;
}

export interface FileWithRelations extends TuningFile {
  engine: EngineWithPeriod;
  tuning_type: TuningType;
}

export interface BrandWithCategory extends Brand {
  category: Category;
}

export interface ModelWithBrand extends Model {
  brand: Brand;
}

/* ---- Shop types ---- */

export interface ShopProduct {
  id: string;
  slug: string;
  nom: string;
  marque: string;
  description: string | null;
  actif: boolean;
  ordre: number;
}

export interface ShopVariant {
  id: string;
  product_id: string;
  slug: string;
  nom: string;
  prix_eur: number;
  ordre: number;
}

export interface ShopImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  ordre: number;
}

export interface ShopFeature {
  id: string;
  product_id: string;
  label: string;
  ordre: number;
}

export interface ShopProductWithRelations extends ShopProduct {
  shop_variants: ShopVariant[] | null;
  shop_images: ShopImage[] | null;
  shop_features: ShopFeature[] | null;
}
