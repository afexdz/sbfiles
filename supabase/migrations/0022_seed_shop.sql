-- Re-seed boutique : insère ou met à jour le produit AutoTuner Tool.
-- Idempotent : ON CONFLICT (slug) DO UPDATE pour couvrir le cas où le
-- produit existait déjà avec des données incomplètes.

INSERT INTO shop_products (slug, nom, marque, description, actif, ordre)
VALUES (
  'autotuner-tool',
  'AutoTuner Tool',
  'AutoTuner',
  'Le programmateur professionnel pour la reprogrammation moteur. Compatible avec les principales marques et protocoles OBD, bench et boot. Livré avec mallette, câbles et accès aux mises à jour incluses à vie.',
  true,
  0
)
ON CONFLICT (slug) DO UPDATE SET
  nom         = EXCLUDED.nom,
  marque      = EXCLUDED.marque,
  description = EXCLUDED.description,
  actif       = EXCLUDED.actif,
  ordre       = EXCLUDED.ordre;

-- Variantes
INSERT INTO shop_variants (product_id, slug, nom, prix_eur, ordre)
SELECT p.id, 'master', 'Master', 4900.00, 0
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, slug) DO UPDATE SET prix_eur = EXCLUDED.prix_eur;

INSERT INTO shop_variants (product_id, slug, nom, prix_eur, ordre)
SELECT p.id, 'slave', 'Slave', 2900.00, 1
FROM shop_products p WHERE p.slug = 'autotuner-tool'
ON CONFLICT (product_id, slug) DO UPDATE SET prix_eur = EXCLUDED.prix_eur;

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

-- Caractéristiques
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
