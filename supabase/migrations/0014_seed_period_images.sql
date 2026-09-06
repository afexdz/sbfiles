-- ────────────────────────────────────────────────────────────────────────────
-- 0014_seed_period_images.sql
-- Ajoute des image_url de test sur quelques périodes représentatives.
-- Images Wikimedia Commons — licence Creative Commons, hotlinking autorisé.
-- ────────────────────────────────────────────────────────────────────────────

update public.periods
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/VW_Golf_VII_front_20131213.jpg/1280px-VW_Golf_VII_front_20131213.jpg'
where model_id = (select id from public.models where slug = 'golf-7')
  and label = '2012 › 2017';

update public.periods
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/2019_BMW_3_Series_%28G20%29_Sport_Line_sedan_%282019-10-04%29_01.jpg/1280px-2019_BMW_3_Series_%28G20%29_Sport_Line_sedan_%282019-10-04%29_01.jpg'
where model_id = (select id from public.models where slug = 'serie-3-f30')
  and label = '2012 › 2019';

update public.periods
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/2019_Mercedes-Benz_C_Class_%28W205%29_C200_1.5_Front.jpg/1280px-2019_Mercedes-Benz_C_Class_%28W205%29_C200_1.5_Front.jpg'
where model_id = (select id from public.models where slug = 'classe-c-w205')
  and label = '2014 › 2021';
