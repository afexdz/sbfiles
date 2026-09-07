-- Backfill des fiches ateliers manquantes.
-- Tous les utilisateurs ayant user_metadata.type = 'atelier'
-- et role = 'user' sans ligne dans ateliers reçoivent une fiche en_attente.
-- Idempotent : on conflict do nothing.

insert into public.ateliers (
  user_id,
  nom,
  ville,
  adresse,
  registre_commerce,
  statut
)
select
  p.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'nom_atelier'), ''),
    p.email,
    'Atelier sans nom'
  ),
  nullif(trim(u.raw_user_meta_data->>'ville'),             ''),
  nullif(trim(u.raw_user_meta_data->>'adresse'),           ''),
  nullif(trim(u.raw_user_meta_data->>'registre_commerce'), ''),
  'en_attente'
from public.profiles p
join auth.users u on u.id = p.id
where u.raw_user_meta_data->>'type' = 'atelier'
  and p.role = 'user'
  and not exists (
    select 1 from public.ateliers a where a.user_id = p.id
  )
on conflict (user_id) do nothing;
