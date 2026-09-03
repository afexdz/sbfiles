-- ---- Shop: tables ----

CREATE TABLE IF NOT EXISTS shop_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  nom         text NOT NULL,
  marque      text NOT NULL,
  description text,
  actif       boolean NOT NULL DEFAULT true,
  ordre       integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_shop_products_slug ON shop_products(slug);

CREATE TABLE IF NOT EXISTS shop_variants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  nom         text NOT NULL,
  prix_eur    numeric(10,2) NOT NULL,
  ordre       integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_shop_variants_product ON shop_variants(product_id);

CREATE TABLE IF NOT EXISTS shop_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  alt         text,
  ordre       integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, url)
);
CREATE INDEX IF NOT EXISTS idx_shop_images_product ON shop_images(product_id);

CREATE TABLE IF NOT EXISTS shop_features (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  label       text NOT NULL,
  ordre       integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, label)
);
CREATE INDEX IF NOT EXISTS idx_shop_features_product ON shop_features(product_id);

-- ---- RLS ----

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read shop_products" ON shop_products;
CREATE POLICY "public read shop_products"
  ON shop_products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public read shop_variants" ON shop_variants;
CREATE POLICY "public read shop_variants"
  ON shop_variants FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public read shop_images" ON shop_images;
CREATE POLICY "public read shop_images"
  ON shop_images FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public read shop_features" ON shop_features;
CREATE POLICY "public read shop_features"
  ON shop_features FOR SELECT TO anon, authenticated USING (true);

-- ---- Seed : AutoTuner Tool ----

INSERT INTO shop_products (slug, nom, marque, description, actif, ordre)
VALUES (
  'autotuner-tool',
  'AutoTuner Tool',
  'AutoTuner',
  'Le programmateur professionnel pour la reprogrammation moteur. Compatible avec les principales marques et protocoles OBD, bench et boot. Livré avec mallette, câbles et accès aux mises à jour incluses à vie.',
  true,
  0
)
ON CONFLICT (slug) DO NOTHING;

-- Variants
INSERT INTO shop_variants (product_id, slug, nom, prix_eur, ordre)
SELECT p.id, 'master', 'Master', 4900.00, 0
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, slug) DO NOTHING;

INSERT INTO shop_variants (product_id, slug, nom, prix_eur, ordre)
SELECT p.id, 'slave', 'Slave', 2900.00, 1
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, slug) DO NOTHING;

-- Images
INSERT INTO shop_images (product_id, url, alt, ordre)
SELECT p.id, '/shop/autotuner-tool-1.jpg', 'Connecteurs OBD et BOOT', 0
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, url) DO NOTHING;

INSERT INTO shop_images (product_id, url, alt, ordre)
SELECT p.id, '/shop/autotuner-tool-2.jpg', 'Face avant de l''AutoTuner Tool', 1
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, url) DO NOTHING;

INSERT INTO shop_images (product_id, url, alt, ordre)
SELECT p.id, '/shop/autotuner-tool-3.jpg', 'Mallette complète AutoTuner Tool', 2
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, url) DO NOTHING;

-- Features
INSERT INTO shop_features (product_id, label, ordre)
SELECT p.id, 'Lecture / écriture OBD', 0
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, label) DO NOTHING;

INSERT INTO shop_features (product_id, label, ordre)
SELECT p.id, 'Mode bench et boot', 1
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, label) DO NOTHING;

INSERT INTO shop_features (product_id, label, ordre)
SELECT p.id, 'Couverture multimarque', 2
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, label) DO NOTHING;

INSERT INTO shop_features (product_id, label, ordre)
SELECT p.id, 'Mises à jour incluses à vie', 3
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, label) DO NOTHING;
