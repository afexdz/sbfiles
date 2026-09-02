-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nom_fr text not null,
  icone text,
  couleur text,
  ordre int not null default 0
);

create table brands (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nom text not null,
  logo_url text,
  category_id uuid not null references categories(id) on delete cascade,
  ordre int not null default 0
);

create table models (
  id uuid primary key default uuid_generate_v4(),
  slug text not null,
  nom text not null,
  brand_id uuid not null references brands(id) on delete cascade,
  ordre int not null default 0,
  unique(brand_id, slug)
);

create table periods (
  id uuid primary key default uuid_generate_v4(),
  model_id uuid not null references models(id) on delete cascade,
  label text not null,
  annee_debut int,
  annee_fin int,
  image_url text,
  ordre int not null default 0
);

create table engines (
  id uuid primary key default uuid_generate_v4(),
  period_id uuid not null references periods(id) on delete cascade,
  nom text not null,
  code_moteur text,
  carburant text check (carburant in ('essence', 'diesel', 'hybride')),
  ch_stock int,
  nm_stock int,
  ecu text
);

create table tuning_types (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nom_fr text not null,
  description text,
  ordre int not null default 0
);

create table files (
  id uuid primary key default uuid_generate_v4(),
  engine_id uuid not null references engines(id) on delete cascade,
  tuning_type_id uuid not null references tuning_types(id) on delete cascade,
  ch_tune int,
  nm_tune int,
  prix_dzd int,
  fichier_path text,
  actif bool not null default true,
  created_at timestamptz not null default now()
);

create table options (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nom_fr text not null,
  prix_dzd int not null default 0,
  ordre int not null default 0
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete set null,
  statut text not null check (statut in ('en_attente', 'paye', 'annule')) default 'en_attente',
  montant_dzd int,
  ref_chargily text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  file_id uuid not null references files(id) on delete restrict,
  option_ids uuid[] not null default '{}',
  prix_dzd int not null
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_brands_category_id on brands(category_id);
create index idx_brands_slug on brands(slug);
create index idx_models_brand_id on models(brand_id);
create index idx_models_slug on models(slug);
create index idx_periods_model_id on periods(model_id);
create index idx_engines_period_id on engines(period_id);
create index idx_files_engine_id on files(engine_id);
create index idx_files_tuning_type_id on files(tuning_type_id);
create index idx_options_slug on options(slug);
create index idx_orders_user_id on orders(user_id);
create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_file_id on order_items(file_id);
create index idx_categories_slug on categories(slug);
create index idx_tuning_types_slug on tuning_types(slug);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table categories enable row level security;
alter table brands enable row level security;
alter table models enable row level security;
alter table periods enable row level security;
alter table engines enable row level security;
alter table tuning_types enable row level security;
alter table files enable row level security;
alter table options enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public read policies
create policy "public read categories" on categories for select to anon, authenticated using (true);
create policy "public read brands" on brands for select to anon, authenticated using (true);
create policy "public read models" on models for select to anon, authenticated using (true);
create policy "public read periods" on periods for select to anon, authenticated using (true);
create policy "public read engines" on engines for select to anon, authenticated using (true);
create policy "public read tuning_types" on tuning_types for select to anon, authenticated using (true);
create policy "public read files" on files for select to anon, authenticated using (actif = true);
create policy "public read options" on options for select to anon, authenticated using (true);

-- Orders: only owner
create policy "owner read orders" on orders for select to authenticated using (user_id = auth.uid());
create policy "owner insert orders" on orders for insert to authenticated with check (user_id = auth.uid());
create policy "owner update orders" on orders for update to authenticated using (user_id = auth.uid());

-- Order items: only owner via order
create policy "owner read order_items" on order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "owner insert order_items" on order_items for insert to authenticated
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- ============================================================
-- SEED DATA
-- ============================================================

-- 8 catégories
insert into categories (slug, nom_fr, icone, couleur, ordre) values
  ('voiture',   'Voiture',    'car',          '#3B82F6', 1),
  ('camion',    'Camion',     'truck',        '#F59E0B', 2),
  ('moto',      'Moto',       'bike',         '#EF4444', 3),
  ('quad',      'Quad',       'zap',          '#8B5CF6', 4),
  ('marine',    'Marine',     'anchor',       '#06B6D4', 5),
  ('agricole',  'Agricole',   'sprout',       '#22C55E', 6),
  ('tp',        'TP',         'construction', '#F97316', 7),
  ('bus',       'Bus',        'bus',          '#6366F1', 8);

-- 12 tuning_types
insert into tuning_types (slug, nom_fr, description, ordre) values
  ('stage-1',             'Stage 1',             'Reprogrammation moteur sans modification mécanique',                          1),
  ('stage-2',             'Stage 2',             'Reprogrammation avec modifications mécaniques (échappement, filtre)',          2),
  ('stage-3',             'Stage 3',             'Reprogrammation haute performance avec modifications majeures',                3),
  ('ethanol-e85',         'Éthanol E85',         'Conversion ou flex-fuel pour compatibilité éthanol E85',                     4),
  ('suppression-fap',     'Suppression FAP',     'Suppression logicielle du filtre à particules (FAP/DPF)',                    5),
  ('suppression-egr',     'Suppression EGR',     'Suppression logicielle de la vanne EGR',                                    6),
  ('suppression-adblue',  'Suppression AdBlue',  'Désactivation logicielle du système AdBlue/SCR',                            7),
  ('suppression-dtc',     'Suppression DTC',     'Effacement et désactivation de codes défaut spécifiques',                   8),
  ('pop-bang',            'Pop & Bang',          'Activation des pétarades à la décélération',                                9),
  ('launch-control',      'Launch Control',      'Activation du contrôle de départ',                                          10),
  ('suppression-vmax',    'Suppression Vmax',    'Suppression du bridage électronique de vitesse maximale',                   11),
  ('start-stop',          'Start & Stop',        'Désactivation définitive du système Start & Stop',                          12);

-- 18 options avec prix en DZD
insert into options (slug, nom_fr, prix_dzd, ordre) values
  ('readout',             'Lecture fichier stock',                  1500,  1),
  ('backup',              'Backup ECU',                             2000,  2),
  ('clone',               'Clone ECU',                             3500,  3),
  ('checksum',            'Correction checksum',                   1000,  4),
  ('slave-service',       'Service esclave 24h',                   2500,  5),
  ('express-4h',          'Traitement express 4h',                 3000,  6),
  ('express-2h',          'Traitement express 2h',                 5000,  7),
  ('revision',            'Révision fichier (1 retour)',           1500,  8),
  ('unlimited-revisions', 'Révisions illimitées',                  4000,  9),
  ('dyno-report',         'Rapport dyno virtuel',                  2000, 10),
  ('support-30d',         'Support technique 30 jours',            3500, 11),
  ('anti-theft',          'Anti-vol logiciel',                     2500, 12),
  ('speed-limiter',       'Bridage vitesse personnalisé',           1500, 13),
  ('rpm-limiter',         'Bridage régime personnalisé',           1500, 14),
  ('cold-start',          'Optimisation démarrage à froid',        1000, 15),
  ('idle-adjust',         'Réglage ralenti',                        800, 16),
  ('immo-off',            'Immo off (preuve propriété requise)',   4500, 17),
  ('file-verification',   'Vérification fichier par expert',       2000, 18);
