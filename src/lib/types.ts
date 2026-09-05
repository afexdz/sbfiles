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
  cout_tokens: number;
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
  cout_tokens: number;
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

/* ---- Token system types ---- */

export type TokenRequestStatut = 'en_attente' | 'code_genere' | 'expediee' | 'livree' | 'utilisee' | 'annulee';
export type TokenMotif         = 'recharge' | 'demande_tuning' | 'remboursement' | 'ajustement_admin';
export type DemandeStatut      = 'recue' | 'en_cours' | 'livree' | 'refusee' | 'annulee';
export type AtelierStatut      = 'en_attente' | 'approuve' | 'refuse';

export interface Profile {
  id: string;
  role: 'user' | 'admin' | 'super_admin';
  nom: string | null;
  email: string | null;
  created_at: string;
}

export interface Atelier {
  id: string;
  user_id: string;
  nom: string;
  telephone: string | null;
  ville: string | null;
  adresse: string | null;
  registre_commerce: string | null;
  statut: AtelierStatut;
  note_admin: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenLedgerEntry {
  id: string;
  atelier_id: string;
  delta: number;
  motif: TokenMotif;
  ref_id: string | null;
  note: string | null;
  created_at: string;
  created_by: string | null;
}

export interface TokenRequest {
  id: string;
  atelier_id: string;
  tokens_demandes: number;
  adresse_livraison: string;
  telephone: string;
  statut: TokenRequestStatut;
  note_atelier: string | null;
  note_admin: string | null;
  transporteur: string | null;
  numero_suivi: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenCode {
  id: string;
  request_id: string | null;
  code_hash: string;
  code_indice: string;
  tokens: number;
  expire_le: string;
  utilise_le: string | null;
  utilise_par: string | null;
  created_at: string;
  created_by: string | null;
}

export interface TuningDemande {
  id: string;
  reference: string;
  atelier_id: string;
  engine_id: string;
  tuning_type_id: string;
  option_ids: string[];
  cout_tokens: number;
  fichier_original: string;
  fichier_original_nom: string;
  fichier_original_taille: number;
  fichier_tune: string | null;
  fichier_tune_nom: string | null;
  statut: DemandeStatut;
  note_atelier: string | null;
  note_admin: string | null;
  traite_par: string | null;
  livree_le: string | null;
  assigned_admin_id: string | null;
  telecharge_le: string | null;
  delai_heures: number;
  created_at: string;
  updated_at: string;
}

/* ---- Joined types ---- */
export interface TokenRequestWithCode extends TokenRequest {
  token_codes: Pick<TokenCode, 'code_indice' | 'tokens' | 'expire_le'> | null;
}

export interface TuningDemandeWithRelations extends TuningDemande {
  engine: Engine & { period: Period & { model: Model & { brand: Brand } } };
  tuning_type: TuningType;
  atelier?: Pick<Atelier, 'nom' | 'telephone'>;
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
