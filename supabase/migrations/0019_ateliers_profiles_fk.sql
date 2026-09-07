-- Ajoute un lien FK entre ateliers.user_id et profiles.id
-- afin que PostgREST puisse résoudre la jointure implicite ateliers → profiles.
-- ateliers.user_id et profiles.id partagent les mêmes UUIDs (auth.users.id).
alter table public.ateliers
  add constraint ateliers_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- Force PostgREST à recharger son cache de schéma immédiatement.
notify pgrst, 'reload schema';
