-- supabase/migrations/0002_seed_vehicles.sql
-- Seeds brands (57), models (28), periods (31), engines (82)
-- Data extracted from design/reference.html (BRANDS array + DB object).
-- Re-executable: unique constraints added for periods/engines, ON CONFLICT DO NOTHING everywhere.

/* ── 0. Idempotency constraints for tables without a natural unique key ───── */
alter table periods add constraint if not exists periods_model_label_key unique (model_id, label);
alter table engines add constraint if not exists engines_period_nom_key   unique (period_id, nom);

/* ── 1. Brands (57) ──────────────────────────────────────────────────────── */
insert into brands (slug, nom, logo_url, category_id, ordre) values
  -- voiture (1–33)
  ('land-rover',      'Land Rover',      'https://cdn.simpleicons.org/landrover',              (select id from categories where slug = 'voiture'),   1),
  ('volkswagen',      'Volkswagen',      'https://cdn.simpleicons.org/volkswagen',             (select id from categories where slug = 'voiture'),   2),
  ('bmw',             'BMW',             'https://cdn.simpleicons.org/bmw',                    (select id from categories where slug = 'voiture'),   3),
  ('mercedes-benz',   'Mercedes-Benz',   'https://cdn.simpleicons.org/mercedes',               (select id from categories where slug = 'voiture'),   4),
  ('audi',            'Audi',            'https://cdn.simpleicons.org/audi',                   (select id from categories where slug = 'voiture'),   5),
  ('renault',         'Renault',         'https://cdn.simpleicons.org/renault',                (select id from categories where slug = 'voiture'),   6),
  ('peugeot',         'Peugeot',         'https://cdn.simpleicons.org/peugeot',                (select id from categories where slug = 'voiture'),   7),
  ('citroen',         'Citroën',         'https://cdn.simpleicons.org/citroen',                (select id from categories where slug = 'voiture'),   8),
  ('ford',            'Ford',            'https://cdn.simpleicons.org/ford',                   (select id from categories where slug = 'voiture'),   9),
  ('opel',            'Opel',            'https://cdn.simpleicons.org/opel',                   (select id from categories where slug = 'voiture'),  10),
  ('toyota',          'Toyota',          'https://cdn.simpleicons.org/toyota',                 (select id from categories where slug = 'voiture'),  11),
  ('hyundai',         'Hyundai',         'https://cdn.simpleicons.org/hyundai',                (select id from categories where slug = 'voiture'),  12),
  ('kia',             'Kia',             'https://cdn.simpleicons.org/kia',                    (select id from categories where slug = 'voiture'),  13),
  ('skoda',           'Škoda',           'https://cdn.simpleicons.org/skoda',                  (select id from categories where slug = 'voiture'),  14),
  ('seat',            'Seat',            'https://cdn.simpleicons.org/seat',                   (select id from categories where slug = 'voiture'),  15),
  ('fiat',            'Fiat',            'https://cdn.simpleicons.org/fiat',                   (select id from categories where slug = 'voiture'),  16),
  ('nissan',          'Nissan',          'https://cdn.simpleicons.org/nissan',                 (select id from categories where slug = 'voiture'),  17),
  ('dacia',           'Dacia',           'https://cdn.simpleicons.org/dacia',                  (select id from categories where slug = 'voiture'),  18),
  ('volvo',           'Volvo',           'https://cdn.simpleicons.org/volvo',                  (select id from categories where slug = 'voiture'),  19),
  ('porsche',         'Porsche',         'https://cdn.simpleicons.org/porsche',                (select id from categories where slug = 'voiture'),  20),
  ('alfa-romeo',      'Alfa Romeo',      'https://cdn.simpleicons.org/alfaromeo',              (select id from categories where slug = 'voiture'),  21),
  ('mazda',           'Mazda',           'https://cdn.simpleicons.org/mazda',                  (select id from categories where slug = 'voiture'),  22),
  ('honda',           'Honda',           'https://cdn.simpleicons.org/honda',                  (select id from categories where slug = 'voiture'),  23),
  ('mini',            'Mini',            'https://cdn.simpleicons.org/mini',                   (select id from categories where slug = 'voiture'),  24),
  ('chevrolet',       'Chevrolet',       'https://cdn.simpleicons.org/chevrolet',              (select id from categories where slug = 'voiture'),  25),
  ('suzuki',          'Suzuki',          'https://cdn.simpleicons.org/suzuki',                 (select id from categories where slug = 'voiture'),  26),
  ('mitsubishi',      'Mitsubishi',      'https://cdn.simpleicons.org/mitsubishi',             (select id from categories where slug = 'voiture'),  27),
  ('jeep',            'Jeep',            'https://cdn.simpleicons.org/jeep',                   (select id from categories where slug = 'voiture'),  28),
  ('jaguar',          'Jaguar',          'https://cdn.simpleicons.org/jaguar',                 (select id from categories where slug = 'voiture'),  29),
  ('lexus',           'Lexus',           'https://cdn.simpleicons.org/lexus',                  (select id from categories where slug = 'voiture'),  30),
  ('subaru',          'Subaru',          'https://cdn.simpleicons.org/subaru',                 (select id from categories where slug = 'voiture'),  31),
  ('tesla',           'Tesla',           'https://cdn.simpleicons.org/tesla',                  (select id from categories where slug = 'voiture'),  32),
  ('cupra',           'Cupra',           'https://cdn.simpleicons.org/cupra',                  (select id from categories where slug = 'voiture'),  33),
  -- camion (1–5)
  ('iveco',           'Iveco',           'https://cdn.simpleicons.org/iveco',                  (select id from categories where slug = 'camion'),    1),
  ('scania',          'Scania',          'https://cdn.simpleicons.org/scania',                 (select id from categories where slug = 'camion'),    2),
  ('man',             'MAN',             'https://cdn.simpleicons.org/man',                    (select id from categories where slug = 'camion'),    3),
  ('daf',             'DAF',             'https://cdn.simpleicons.org/daf',                    (select id from categories where slug = 'camion'),    4),
  ('renault-trucks',  'Renault Trucks',  'https://cdn.simpleicons.org/renault',                (select id from categories where slug = 'camion'),    5),
  -- agricole (1–5)
  ('john-deere',      'John Deere',      'https://cdn.simpleicons.org/johndeere',              (select id from categories where slug = 'agricole'),  1),
  ('new-holland',     'New Holland',     'https://cdn.simpleicons.org/newholland',             (select id from categories where slug = 'agricole'),  2),
  ('massey-ferguson', 'Massey Ferguson', 'https://cdn.simpleicons.org/masseyferguson',         (select id from categories where slug = 'agricole'),  3),
  ('case-ih',         'Case IH',         'https://cdn.simpleicons.org/caseih',                 (select id from categories where slug = 'agricole'),  4),
  ('claas',           'Claas',           'https://cdn.simpleicons.org/claas',                  (select id from categories where slug = 'agricole'),  5),
  -- moto (1–5)
  ('ducati',          'Ducati',          'https://cdn.simpleicons.org/ducati',                 (select id from categories where slug = 'moto'),      1),
  ('yamaha',          'Yamaha',          'https://cdn.simpleicons.org/yamahamotorcorporation',  (select id from categories where slug = 'moto'),      2),
  ('kawasaki',        'Kawasaki',        'https://cdn.simpleicons.org/kawasaki',               (select id from categories where slug = 'moto'),      3),
  ('ktm',             'KTM',             'https://cdn.simpleicons.org/ktm',                    (select id from categories where slug = 'moto'),      4),
  ('harley-davidson', 'Harley-Davidson', 'https://cdn.simpleicons.org/harleydavidson',         (select id from categories where slug = 'moto'),      5),
  -- tp (1–3)
  ('caterpillar',     'Caterpillar',     'https://cdn.simpleicons.org/caterpillar',            (select id from categories where slug = 'tp'),        1),
  ('komatsu',         'Komatsu',         'https://cdn.simpleicons.org/komatsu',                (select id from categories where slug = 'tp'),        2),
  ('jcb',             'JCB',             'https://cdn.simpleicons.org/jcb',                    (select id from categories where slug = 'tp'),        3),
  -- marine (1–2)
  ('sea-doo',         'Sea-Doo',         'https://cdn.simpleicons.org/seadoo',                 (select id from categories where slug = 'marine'),    1),
  ('yamaha-marine',   'Yamaha Marine',   'https://cdn.simpleicons.org/yamahamotorcorporation',  (select id from categories where slug = 'marine'),    2),
  -- quad (1–2)
  ('polaris',         'Polaris',         'https://cdn.simpleicons.org/polaris',                (select id from categories where slug = 'quad'),      1),
  ('can-am',          'Can-Am',          'https://cdn.simpleicons.org/canam',                  (select id from categories where slug = 'quad'),      2),
  -- bus (1–2)
  ('mercedes-citaro', 'Mercedes Citaro', 'https://cdn.simpleicons.org/mercedes',               (select id from categories where slug = 'bus'),       1),
  ('setra',           'Setra',           null,                                                  (select id from categories where slug = 'bus'),       2)
on conflict (slug) do nothing;

/* ── 2. Models (28 — brands present in the DB object) ───────────────────────── */
insert into models (slug, nom, brand_id, ordre) values
  -- Land Rover (6)
  ('evoque',            'Evoque',              (select id from brands where slug = 'land-rover'),    1),
  ('discovery-sport',   'Discovery Sport',     (select id from brands where slug = 'land-rover'),    2),
  ('defender',          'Defender',            (select id from brands where slug = 'land-rover'),    3),
  ('range-rover-sport', 'Range Rover / Sport', (select id from brands where slug = 'land-rover'),    4),
  ('freelander',        'Freelander',          (select id from brands where slug = 'land-rover'),    5),
  ('velar',             'Velar',               (select id from brands where slug = 'land-rover'),    6),
  -- Volkswagen (4)
  ('golf-7',            'Golf 7',              (select id from brands where slug = 'volkswagen'),    1),
  ('passat-b8',         'Passat B8',           (select id from brands where slug = 'volkswagen'),    2),
  ('polo',              'Polo',                (select id from brands where slug = 'volkswagen'),    3),
  ('tiguan',            'Tiguan',              (select id from brands where slug = 'volkswagen'),    4),
  -- BMW (3)
  ('serie-3-f30',       'Série 3 F30',         (select id from brands where slug = 'bmw'),           1),
  ('serie-5-f10',       'Série 5 F10',         (select id from brands where slug = 'bmw'),           2),
  ('x5-e70',            'X5 E70',              (select id from brands where slug = 'bmw'),           3),
  -- Mercedes-Benz (2)
  ('classe-c-w205',     'Classe C W205',       (select id from brands where slug = 'mercedes-benz'), 1),
  ('sprinter-w906',     'Sprinter W906',       (select id from brands where slug = 'mercedes-benz'), 2),
  -- Renault (3)
  ('clio-iv',           'Clio IV',             (select id from brands where slug = 'renault'),       1),
  ('megane-iii',        'Mégane III',          (select id from brands where slug = 'renault'),       2),
  ('kangoo-ii',         'Kangoo II',           (select id from brands where slug = 'renault'),       3),
  -- Peugeot (2)
  ('308-ii',            '308 II',              (select id from brands where slug = 'peugeot'),       1),
  ('partner',           'Partner',             (select id from brands where slug = 'peugeot'),       2),
  -- Audi (2)
  ('a3-8v',             'A3 8V',               (select id from brands where slug = 'audi'),          1),
  ('a4-b8',             'A4 B8',               (select id from brands where slug = 'audi'),          2),
  -- Škoda (1)
  ('octavia-iii',       'Octavia III',         (select id from brands where slug = 'skoda'),         1),
  -- Toyota (1)
  ('hilux',             'Hilux',               (select id from brands where slug = 'toyota'),        1),
  -- Hyundai (1)
  ('tucson',            'Tucson',              (select id from brands where slug = 'hyundai'),       1),
  -- Fiat (1)
  ('doblo',             'Doblò',               (select id from brands where slug = 'fiat'),          1),
  -- John Deere (1)
  ('serie-6r',          'Série 6R',            (select id from brands where slug = 'john-deere'),    1)
on conflict (brand_id, slug) do nothing;

/* ── 3. Periods (31) ─────────────────────────────────────────────────────────── */
insert into periods (model_id, label, annee_debut, annee_fin, ordre)
select m.id, p.label, p.debut::int, p.fin, p.ord::int
from (values
  -- Land Rover · Evoque
  ('land-rover', 'evoque',            '2011 › 2015',                 2011, 2015::int, 1),
  ('land-rover', 'evoque',            '2015 › 2019',                 2015, 2019::int, 2),
  ('land-rover', 'evoque',            '2019 › 2023',                 2019, 2023::int, 3),
  ('land-rover', 'evoque',            'L551 Facelift · depuis 2023', 2023, null::int,  4),
  -- Land Rover · Discovery Sport
  ('land-rover', 'discovery-sport',   '2015 › 2019',                 2015, 2019::int, 1),
  ('land-rover', 'discovery-sport',   '2019 › 2023',                 2019, 2023::int, 2),
  -- Land Rover · Defender
  ('land-rover', 'defender',          'depuis 2020',                 2020, null::int,  1),
  -- Land Rover · Range Rover / Sport
  ('land-rover', 'range-rover-sport', '2013 › 2022',                 2013, 2022::int, 1),
  -- Land Rover · Freelander
  ('land-rover', 'freelander',        '2006 › 2014',                 2006, 2014::int, 1),
  -- Land Rover · Velar
  ('land-rover', 'velar',             '2017 › 2023',                 2017, 2023::int, 1),
  -- Volkswagen · Golf 7
  ('volkswagen', 'golf-7',            '2012 › 2017',                 2012, 2017::int, 1),
  ('volkswagen', 'golf-7',            '2017 › 2020',                 2017, 2020::int, 2),
  -- Volkswagen · Passat B8
  ('volkswagen', 'passat-b8',         '2014 › 2019',                 2014, 2019::int, 1),
  -- Volkswagen · Polo
  ('volkswagen', 'polo',              '2009 › 2017',                 2009, 2017::int, 1),
  -- Volkswagen · Tiguan
  ('volkswagen', 'tiguan',            '2016 › 2023',                 2016, 2023::int, 1),
  -- BMW · Série 3 F30
  ('bmw',        'serie-3-f30',       '2012 › 2019',                 2012, 2019::int, 1),
  -- BMW · Série 5 F10
  ('bmw',        'serie-5-f10',       '2010 › 2017',                 2010, 2017::int, 1),
  -- BMW · X5 E70
  ('bmw',        'x5-e70',            '2007 › 2013',                 2007, 2013::int, 1),
  -- Mercedes-Benz · Classe C W205
  ('mercedes-benz', 'classe-c-w205',  '2014 › 2021',                 2014, 2021::int, 1),
  -- Mercedes-Benz · Sprinter W906
  ('mercedes-benz', 'sprinter-w906',  '2006 › 2018',                 2006, 2018::int, 1),
  -- Renault · Clio IV
  ('renault',    'clio-iv',           '2012 › 2019',                 2012, 2019::int, 1),
  -- Renault · Mégane III
  ('renault',    'megane-iii',        '2008 › 2016',                 2008, 2016::int, 1),
  -- Renault · Kangoo II
  ('renault',    'kangoo-ii',         '2008 › 2021',                 2008, 2021::int, 1),
  -- Peugeot · 308 II
  ('peugeot',    '308-ii',            '2013 › 2021',                 2013, 2021::int, 1),
  -- Peugeot · Partner
  ('peugeot',    'partner',           '2008 › 2018',                 2008, 2018::int, 1),
  -- Audi · A3 8V
  ('audi',       'a3-8v',             '2012 › 2020',                 2012, 2020::int, 1),
  -- Audi · A4 B8
  ('audi',       'a4-b8',             '2007 › 2015',                 2007, 2015::int, 1),
  -- Škoda · Octavia III
  ('skoda',      'octavia-iii',       '2013 › 2020',                 2013, 2020::int, 1),
  -- Toyota · Hilux
  ('toyota',     'hilux',             '2015 › 2023',                 2015, 2023::int, 1),
  -- Hyundai · Tucson
  ('hyundai',    'tucson',            '2015 › 2020',                 2015, 2020::int, 1),
  -- Fiat · Doblò
  ('fiat',       'doblo',             '2010 › 2022',                 2010, 2022::int, 1),
  -- John Deere · Série 6R
  ('john-deere', 'serie-6r',          '2015 › 2023',                 2015, 2023::int, 1)
) as p(brand_slug, model_slug, label, debut, fin, ord)
join brands b on b.slug = p.brand_slug
join models m on m.brand_id = b.id and m.slug = p.model_slug
on conflict on constraint periods_model_label_key do nothing;

/* ── 4. Engines (82) ─────────────────────────────────────────────────────────── */
insert into engines (period_id, nom, carburant, ch_stock, nm_stock, ecu)
select per.id, e.nom, e.carburant, e.ch::int, e.nm::int, e.ecu
from (values
  -- Land Rover · Evoque · 2011 › 2015
  ('land-rover', 'evoque',            '2011 › 2015',                 'TD4 150',        'diesel',  150, 380, 'Bosch EDC17CP55'),
  ('land-rover', 'evoque',            '2011 › 2015',                 'SD4 190',        'diesel',  190, 420, 'Bosch EDC17CP55'),
  ('land-rover', 'evoque',            '2011 › 2015',                 'Si4 240',        'essence', 240, 340, 'Bosch MED17.9'),
  -- Land Rover · Evoque · 2015 › 2019
  ('land-rover', 'evoque',            '2015 › 2019',                 'eD4 150',        'diesel',  150, 380, 'Bosch EDC17CP55'),
  ('land-rover', 'evoque',            '2015 › 2019',                 'TD4 180',        'diesel',  180, 430, 'Bosch EDC17CP55'),
  ('land-rover', 'evoque',            '2015 › 2019',                 'Si4 240',        'essence', 240, 340, 'Bosch MED17.9'),
  -- Land Rover · Evoque · 2019 › 2023
  ('land-rover', 'evoque',            '2019 › 2023',                 'D150',           'diesel',  150, 380, 'Bosch MEDC17.9'),
  ('land-rover', 'evoque',            '2019 › 2023',                 'D165',           'diesel',  165, 380, 'Bosch MEDC17.9'),
  ('land-rover', 'evoque',            '2019 › 2023',                 'D180',           'diesel',  180, 430, 'Bosch MEDC17.9'),
  ('land-rover', 'evoque',            '2019 › 2023',                 'D200',           'diesel',  204, 430, 'Bosch MEDC17.9'),
  ('land-rover', 'evoque',            '2019 › 2023',                 'D240',           'diesel',  240, 500, 'Bosch MEDC17.9'),
  ('land-rover', 'evoque',            '2019 › 2023',                 'P200',           'essence', 200, 320, 'Bosch MED17.9'),
  ('land-rover', 'evoque',            '2019 › 2023',                 'P250',           'essence', 249, 365, 'Bosch MED17.9'),
  ('land-rover', 'evoque',            '2019 › 2023',                 'P300',           'essence', 300, 400, 'Bosch MED17.9'),
  -- Land Rover · Evoque · L551 Facelift · depuis 2023
  ('land-rover', 'evoque',            'L551 Facelift · depuis 2023', 'D165',           'diesel',  165, 380, 'Bosch MEDC17.9'),
  ('land-rover', 'evoque',            'L551 Facelift · depuis 2023', 'D200',           'diesel',  204, 430, 'Bosch MEDC17.9'),
  ('land-rover', 'evoque',            'L551 Facelift · depuis 2023', 'P200 MHEV',      'essence', 200, 320, 'Bosch MED17.9'),
  ('land-rover', 'evoque',            'L551 Facelift · depuis 2023', 'P300e',          'hybride', 309, 540, 'Bosch MED17.9'),
  -- Land Rover · Discovery Sport · 2015 › 2019
  ('land-rover', 'discovery-sport',   '2015 › 2019',                 'TD4 150',        'diesel',  150, 380, 'Bosch EDC17CP55'),
  ('land-rover', 'discovery-sport',   '2015 › 2019',                 'SD4 180',        'diesel',  180, 430, 'Bosch EDC17CP55'),
  -- Land Rover · Discovery Sport · 2019 › 2023
  ('land-rover', 'discovery-sport',   '2019 › 2023',                 'D165',           'diesel',  165, 380, 'Bosch MEDC17.9'),
  ('land-rover', 'discovery-sport',   '2019 › 2023',                 'D200',           'diesel',  204, 430, 'Bosch MEDC17.9'),
  ('land-rover', 'discovery-sport',   '2019 › 2023',                 'P250',           'essence', 249, 365, 'Bosch MED17.9'),
  -- Land Rover · Defender · depuis 2020
  ('land-rover', 'defender',          'depuis 2020',                 'D200',           'diesel',  200, 500, 'Bosch MEDC17.9'),
  ('land-rover', 'defender',          'depuis 2020',                 'D250',           'diesel',  249, 570, 'Bosch MEDC17.9'),
  ('land-rover', 'defender',          'depuis 2020',                 'P300',           'essence', 300, 400, 'Bosch MED17.9'),
  -- Land Rover · Range Rover / Sport · 2013 › 2022
  ('land-rover', 'range-rover-sport', '2013 › 2022',                 'SDV6 306',       'diesel',  306, 700, 'Bosch EDC17CP55'),
  ('land-rover', 'range-rover-sport', '2013 › 2022',                 'SDV8 340',       'diesel',  340, 740, 'Bosch EDC17CP55'),
  -- Land Rover · Freelander · 2006 › 2014
  ('land-rover', 'freelander',        '2006 › 2014',                 'TD4 150',        'diesel',  150, 400, 'Bosch EDC17CP42'),
  -- Land Rover · Velar · 2017 › 2023
  ('land-rover', 'velar',             '2017 › 2023',                 'D200',           'diesel',  204, 430, 'Bosch MEDC17.9'),
  ('land-rover', 'velar',             '2017 › 2023',                 'P250',           'essence', 249, 365, 'Bosch MED17.9'),
  -- Volkswagen · Golf 7 · 2012 › 2017
  ('volkswagen', 'golf-7',            '2012 › 2017',                 '1.6 TDI 110',    'diesel',  110, 250, 'Bosch EDC17C64'),
  ('volkswagen', 'golf-7',            '2012 › 2017',                 '2.0 TDI 150',    'diesel',  150, 320, 'Bosch EDC17C64'),
  ('volkswagen', 'golf-7',            '2012 › 2017',                 '2.0 TSI GTI 220','essence', 220, 350, 'Bosch MED17.5.5'),
  -- Volkswagen · Golf 7 · 2017 › 2020
  ('volkswagen', 'golf-7',            '2017 › 2020',                 '2.0 TDI 150',    'diesel',  150, 340, 'Bosch EDC17C64'),
  ('volkswagen', 'golf-7',            '2017 › 2020',                 '2.0 TSI GTI 245','essence', 245, 370, 'Bosch MG1CS111'),
  -- Volkswagen · Passat B8 · 2014 › 2019
  ('volkswagen', 'passat-b8',         '2014 › 2019',                 '2.0 TDI 150',    'diesel',  150, 340, 'Bosch EDC17C64'),
  ('volkswagen', 'passat-b8',         '2014 › 2019',                 '2.0 BiTDI 240',  'diesel',  240, 500, 'Bosch EDC17C74'),
  -- Volkswagen · Polo · 2009 › 2017
  ('volkswagen', 'polo',              '2009 › 2017',                 '1.6 TDI 90',     'diesel',   90, 230, 'Siemens PCR2.1'),
  ('volkswagen', 'polo',              '2009 › 2017',                 '1.2 TSI 105',    'essence', 105, 175, 'Bosch MED17.5.5'),
  -- Volkswagen · Tiguan · 2016 › 2023
  ('volkswagen', 'tiguan',            '2016 › 2023',                 '2.0 TDI 150',    'diesel',  150, 340, 'Bosch EDC17C64'),
  ('volkswagen', 'tiguan',            '2016 › 2023',                 '2.0 TDI 190',    'diesel',  190, 400, 'Bosch EDC17C64'),
  -- BMW · Série 3 F30 · 2012 › 2019
  ('bmw',        'serie-3-f30',       '2012 › 2019',                 '316d 116',       'diesel',  116, 260, 'Bosch EDC17C50'),
  ('bmw',        'serie-3-f30',       '2012 › 2019',                 '318d 150',       'diesel',  150, 320, 'Bosch EDC17C50'),
  ('bmw',        'serie-3-f30',       '2012 › 2019',                 '320d 184',       'diesel',  184, 380, 'Bosch EDC17C50'),
  ('bmw',        'serie-3-f30',       '2012 › 2019',                 '330d 258',       'diesel',  258, 560, 'Bosch EDC17CP45'),
  ('bmw',        'serie-3-f30',       '2012 › 2019',                 '320i 184',       'essence', 184, 270, 'Bosch MEVD17.2.4'),
  -- BMW · Série 5 F10 · 2010 › 2017
  ('bmw',        'serie-5-f10',       '2010 › 2017',                 '520d 190',       'diesel',  190, 400, 'Bosch EDC17C50'),
  ('bmw',        'serie-5-f10',       '2010 › 2017',                 '530d 258',       'diesel',  258, 560, 'Bosch EDC17CP45'),
  -- BMW · X5 E70 · 2007 › 2013
  ('bmw',        'x5-e70',            '2007 › 2013',                 '30d 245',        'diesel',  245, 540, 'Bosch EDC17CP02'),
  ('bmw',        'x5-e70',            '2007 › 2013',                 '40d 306',        'diesel',  306, 600, 'Bosch EDC17CP09'),
  -- Mercedes-Benz · Classe C W205 · 2014 › 2021
  ('mercedes-benz', 'classe-c-w205',  '2014 › 2021',                 'C200d 160',      'diesel',  160, 360, 'Delphi CRD3'),
  ('mercedes-benz', 'classe-c-w205',  '2014 › 2021',                 'C220d 170',      'diesel',  170, 400, 'Delphi CRD3'),
  ('mercedes-benz', 'classe-c-w205',  '2014 › 2021',                 'C250d 204',      'diesel',  204, 500, 'Delphi CRD3'),
  -- Mercedes-Benz · Sprinter W906 · 2006 › 2018
  ('mercedes-benz', 'sprinter-w906',  '2006 › 2018',                 '311 CDI 114',    'diesel',  114, 300, 'Bosch EDC17CP46'),
  ('mercedes-benz', 'sprinter-w906',  '2006 › 2018',                 '313 CDI 129',    'diesel',  129, 305, 'Bosch EDC17CP46'),
  ('mercedes-benz', 'sprinter-w906',  '2006 › 2018',                 '316 CDI 163',    'diesel',  163, 360, 'Bosch EDC17CP46'),
  -- Renault · Clio IV · 2012 › 2019
  ('renault',    'clio-iv',           '2012 › 2019',                 '1.5 dCi 90',     'diesel',   90, 220, 'Bosch EDC17C42'),
  ('renault',    'clio-iv',           '2012 › 2019',                 '1.2 TCe 120',    'essence', 120, 205, 'Continental EMS3125'),
  -- Renault · Mégane III · 2008 › 2016
  ('renault',    'megane-iii',        '2008 › 2016',                 '1.5 dCi 110',    'diesel',  110, 240, 'Delphi DCM3.4'),
  ('renault',    'megane-iii',        '2008 › 2016',                 '1.6 dCi 130',    'diesel',  130, 320, 'Bosch EDC17C84'),
  -- Renault · Kangoo II · 2008 › 2021
  ('renault',    'kangoo-ii',         '2008 › 2021',                 '1.5 dCi 90',     'diesel',   90, 200, 'Delphi DCM3.4'),
  -- Peugeot · 308 II · 2013 › 2021
  ('peugeot',    '308-ii',            '2013 › 2021',                 '1.6 BlueHDi 120','diesel',  120, 300, 'Bosch EDC17C60'),
  ('peugeot',    '308-ii',            '2013 › 2021',                 '2.0 BlueHDi 150','diesel',  150, 370, 'Bosch EDC17C60'),
  ('peugeot',    '308-ii',            '2013 › 2021',                 '1.2 PureTech 130','essence',130, 230, 'Valeo VD56.1'),
  -- Peugeot · Partner · 2008 › 2018
  ('peugeot',    'partner',           '2008 › 2018',                 '1.6 HDi 92',     'diesel',   92, 230, 'Bosch EDC17C10'),
  -- Audi · A3 8V · 2012 › 2020
  ('audi',       'a3-8v',             '2012 › 2020',                 '1.6 TDI 110',    'diesel',  110, 250, 'Bosch EDC17C64'),
  ('audi',       'a3-8v',             '2012 › 2020',                 '2.0 TDI 150',    'diesel',  150, 320, 'Bosch EDC17C64'),
  ('audi',       'a3-8v',             '2012 › 2020',                 '1.4 TFSI 125',   'essence', 125, 200, 'Bosch MED17.1.27'),
  -- Audi · A4 B8 · 2007 › 2015
  ('audi',       'a4-b8',             '2007 › 2015',                 '2.0 TDI 143',    'diesel',  143, 320, 'Bosch EDC17CP14'),
  ('audi',       'a4-b8',             '2007 › 2015',                 '2.0 TDI 177',    'diesel',  177, 380, 'Bosch EDC17CP14'),
  -- Škoda · Octavia III · 2013 › 2020
  ('skoda',      'octavia-iii',       '2013 › 2020',                 '1.6 TDI 110',    'diesel',  110, 250, 'Bosch EDC17C64'),
  ('skoda',      'octavia-iii',       '2013 › 2020',                 '2.0 TDI 150',    'diesel',  150, 320, 'Bosch EDC17C64'),
  -- Toyota · Hilux · 2015 › 2023
  ('toyota',     'hilux',             '2015 › 2023',                 '2.4 D-4D 150',   'diesel',  150, 400, 'Denso 89663'),
  ('toyota',     'hilux',             '2015 › 2023',                 '2.8 D-4D 177',   'diesel',  177, 450, 'Denso 89663'),
  -- Hyundai · Tucson · 2015 › 2020
  ('hyundai',    'tucson',            '2015 › 2020',                 '1.6 CRDi 136',   'diesel',  136, 320, 'Bosch EDC17C08'),
  ('hyundai',    'tucson',            '2015 › 2020',                 '2.0 CRDi 185',   'diesel',  185, 400, 'Bosch EDC17C08'),
  -- Fiat · Doblò · 2010 › 2022
  ('fiat',       'doblo',             '2010 › 2022',                 '1.6 MultiJet 105','diesel', 105, 290, 'Bosch EDC17C49'),
  ('fiat',       'doblo',             '2010 › 2022',                 '1.3 MultiJet 90', 'diesel',  90, 200, 'Marelli MJD8F3'),
  -- John Deere · Série 6R · 2015 › 2023
  ('john-deere', 'serie-6r',          '2015 › 2023',                 '6130R',          'diesel',  130, 560, 'Bosch EDC17CV41'),
  ('john-deere', 'serie-6r',          '2015 › 2023',                 '6155R',          'diesel',  155, 650, 'Bosch EDC17CV41')
) as e(brand_slug, model_slug, period_label, nom, carburant, ch, nm, ecu)
join brands  b   on b.slug       = e.brand_slug
join models  m   on m.brand_id   = b.id and m.slug = e.model_slug
join periods per on per.model_id = m.id and per.label = e.period_label
on conflict on constraint engines_period_nom_key do nothing;
