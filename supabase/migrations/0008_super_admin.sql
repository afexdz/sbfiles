-- ────────────────────────────────────────────────────────────────────────────
-- 0008_super_admin.sql
-- Niveau super-admin : rôle, journal d'actions, délai de livraison
-- Dépend de : 0006, 0007
-- Entièrement idempotente
-- ────────────────────────────────────────────────────────────────────────────

-- ─── 1. Élargir la contrainte de rôle sur profiles ───────────────────────────
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'super_admin'));

-- ─── 2. Table admin_actions ───────────────────────────────────────────────────
create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  acteur_id   uuid references public.profiles(id),
  action      text not null,
  cible_type  text,
  cible_id    uuid,
  details     jsonb,
  created_at  timestamptz default now()
);

create index if not exists idx_admin_actions_created_at
  on public.admin_actions(created_at desc);

-- ─── 3. Colonnes supplémentaires sur tuning_demandes ─────────────────────────
alter table public.tuning_demandes
  add column if not exists assigned_admin_id uuid references public.profiles(id),
  add column if not exists telecharge_le     timestamptz,
  add column if not exists delai_heures      int not null default 24;

-- ─── 4. Fonctions de rôle ─────────────────────────────────────────────────────

-- is_super_admin()
create or replace function public.is_super_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

-- is_admin() — redéfinie pour couvrir admin ET super_admin
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(
    (select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()),
    false
  )
$$;

-- ─── 5. Trigger : seul le super_admin peut changer un rôle ───────────────────
create or replace function public.check_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role <> new.role then
    -- Service-role / accès direct sans session JWT → autorisé (setup initial)
    if auth.uid() is null then
      return new;
    end if;
    if not public.is_super_admin() then
      raise exception 'forbidden: only super_admin can change roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_role_check on public.profiles;
create trigger trg_profiles_role_check
  before update on public.profiles
  for each row execute function public.check_role_change();

-- ─── 6. creer_admin ──────────────────────────────────────────────────────────
create or replace function public.creer_admin(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_profile_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'unauthorized: super_admin role required';
  end if;
  select id into v_profile_id from public.profiles where email = p_email;
  if v_profile_id is null then
    raise exception 'no_account: aucun compte trouvé pour %', p_email;
  end if;
  update public.profiles set role = 'admin' where id = v_profile_id;
  insert into public.admin_actions (acteur_id, action, cible_type, cible_id, details)
  values (auth.uid(), 'creer_admin', 'profile', v_profile_id,
          jsonb_build_object('email', p_email));
end;
$$;

-- ─── 7. revoquer_admin ───────────────────────────────────────────────────────
create or replace function public.revoquer_admin(p_profile uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  if not public.is_super_admin() then
    raise exception 'unauthorized: super_admin role required';
  end if;
  select role into v_role from public.profiles where id = p_profile;
  if v_role = 'super_admin' then
    raise exception 'forbidden: cannot revoke super_admin';
  end if;
  update public.profiles set role = 'user' where id = p_profile;
  insert into public.admin_actions (acteur_id, action, cible_type, cible_id, details)
  values (auth.uid(), 'revoquer_admin', 'profile', p_profile,
          jsonb_build_object('ancien_role', v_role));
end;
$$;

-- ─── 8. stats_plateforme ─────────────────────────────────────────────────────
create or replace function public.stats_plateforme()
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_taux              int;
  v_emis              int;
  v_consommes         int;
  v_en_circulation    int;
  v_ateliers_statut   jsonb;
  v_demandes_statut   jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'unauthorized: super_admin role required';
  end if;

  select coalesce(valeur::int, 1000) into v_taux
    from public.app_settings where cle = 'token_dzd';

  select coalesce(sum(delta) filter (where delta > 0), 0)::int into v_emis
    from public.token_ledger;
  select coalesce(abs(sum(delta)) filter (where delta < 0), 0)::int into v_consommes
    from public.token_ledger;

  select coalesce(sum(delta), 0)::int into v_en_circulation
    from public.token_ledger;

  select jsonb_object_agg(statut, cnt) into v_ateliers_statut
    from (select statut, count(*)::int as cnt from public.ateliers group by statut) t;

  select jsonb_object_agg(statut::text, cnt) into v_demandes_statut
    from (select statut, count(*)::int as cnt from public.tuning_demandes group by statut) t;

  return jsonb_build_object(
    'tokens_emis',          v_emis,
    'tokens_consommes',     v_consommes,
    'tokens_en_circulation', v_en_circulation,
    'equivalent_dzd',       v_en_circulation * coalesce(v_taux, 1000),
    'taux_token_dzd',       coalesce(v_taux, 1000),
    'ateliers_par_statut',  coalesce(v_ateliers_statut,  '{}'::jsonb),
    'demandes_par_statut',  coalesce(v_demandes_statut,  '{}'::jsonb)
  );
end;
$$;

-- ─── 9. RLS ──────────────────────────────────────────────────────────────────
alter table public.admin_actions enable row level security;

-- admin_actions : lecture super_admin, écriture admins
drop policy if exists "actions super admin read" on public.admin_actions;
drop policy if exists "actions admin insert"     on public.admin_actions;

create policy "actions super admin read" on public.admin_actions
  for select to authenticated using (public.is_super_admin());

create policy "actions admin insert" on public.admin_actions
  for insert to authenticated
  with check (public.is_admin() and acteur_id = auth.uid());

-- profiles : seul le super_admin peut changer le champ role
-- (garanti par le trigger check_role_change ; la politique existante
--  "profiles admin write" est redéfinie pour inclure super_admin)
drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write" on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- token_codes : super_admin uniquement (les admins génèrent via RPC)
drop policy if exists "codes admin read"      on public.token_codes;
drop policy if exists "codes super admin read" on public.token_codes;
create policy "codes super admin read" on public.token_codes
  for select to authenticated using (public.is_super_admin());

-- ─── 10. Procédure de création du premier super_admin ────────────────────────
-- Créer le compte via /inscription, puis exécuter en SQL :
--   update profiles set role = 'super_admin' where email = 'votre@email.com';
-- (Le trigger autorise les changements sans session JWT — accès direct Supabase)
