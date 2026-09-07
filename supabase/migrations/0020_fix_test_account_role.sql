-- Correction ponctuelle : le compte afexdigitaldz@gmail.com a été promu
-- super_admin manuellement lors de la mise en place initiale de la plateforme,
-- alors qu'il devait servir de compte atelier de test.
-- Ce compte doit avoir le rôle 'user' (atelier) pour tester le parcours complet.
update public.profiles
  set role = 'user'
  where email = 'afexdigitaldz@gmail.com'
    and role  = 'super_admin';
