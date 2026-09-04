-- ────────────────────────────────────────────────────────────────────────────
-- 0006_auth_profiles.sql
-- Authentification, profils utilisateurs et ateliers
-- ────────────────────────────────────────────────────────────────────────────

-- ─── 1. profiles (shadow table pour auth.users) ───────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'user' check (role in ('user','admin')),
  nom        text,
  email      text,
  created_at timestamptz default now()
);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2. Fonctions de rôle — doivent exister avant toute politique RLS ─────────

-- is_admin() : security definer pour éviter la référence circulaire RLS→profiles
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

-- is_atelier_approuve() : vrai si l'utilisateur possède un atelier validé
create or replace function public.is_atelier_approuve()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.ateliers
    where user_id = auth.uid() and statut = 'approuve'
  )
$$;

-- ─── 3. ateliers ─────────────────────────────────────────────────────────────
create table if not exists public.ateliers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  nom        text not null,
  telephone  text,
  ville      text,
  adresse    text,
  statut     text not null default 'en_attente'
             check (statut in ('en_attente','approuve','refuse')),
  note_admin text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ateliers_user_id on public.ateliers(user_id);
create index if not exists idx_ateliers_statut  on public.ateliers(statut);

-- ─── 4. Trigger updated_at (réutilisé par 0007) ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_ateliers_updated_at on public.ateliers;
create trigger trg_ateliers_updated_at
  before update on public.ateliers
  for each row execute function public.set_updated_at();

-- ─── 5. RLS ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.ateliers  enable row level security;

-- profiles : lecture par le propriétaire et l'admin, modification admin
create policy "profiles own read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles admin write" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ateliers : lecture par le propriétaire et l'admin
create policy "ateliers own read" on public.ateliers for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "ateliers own insert" on public.ateliers for insert to authenticated
  with check (user_id = auth.uid());
create policy "ateliers admin update" on public.ateliers for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
