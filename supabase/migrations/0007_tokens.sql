-- ────────────────────────────────────────────────────────────────────────────
-- 0007_tokens.sql
-- Système de tokens, codes de recharge et demandes de tuning
-- Dépend de : 0006_auth_profiles.sql (profiles, ateliers, is_admin,
--             is_atelier_approuve, set_updated_at)
-- Entièrement idempotente (réexécutable sans erreur)
-- ────────────────────────────────────────────────────────────────────────────

-- ─── 0. Extensions ───────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─── 1. Enum types ───────────────────────────────────────────────────────────
do $$ begin
  create type public.token_request_statut as enum
    ('en_attente','code_genere','expediee','livree','utilisee','annulee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.token_motif as enum
    ('recharge','demande_tuning','remboursement','ajustement_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.demande_statut as enum
    ('recue','en_cours','livree','refusee','annulee');
exception when duplicate_object then null; end $$;

-- ─── 2. app_settings ─────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  cle        text primary key,
  valeur     text not null,
  updated_at timestamptz default now()
);

insert into public.app_settings (cle, valeur)
values ('token_dzd', '1000')
on conflict (cle) do nothing;

-- ─── 3. cout_tokens sur tuning_types et options ───────────────────────────────
alter table public.tuning_types
  add column if not exists cout_tokens int not null default 1;

alter table public.options
  add column if not exists cout_tokens int not null default 0;

-- Coûts cohérents par type de tuning
update public.tuning_types set cout_tokens = 2 where slug = 'stage-1';
update public.tuning_types set cout_tokens = 3 where slug = 'stage-2';
update public.tuning_types set cout_tokens = 5 where slug = 'stage-3';
update public.tuning_types set cout_tokens = 3 where slug = 'ethanol-e85';
update public.tuning_types set cout_tokens = 2 where slug = 'suppression-fap';
update public.tuning_types set cout_tokens = 2 where slug = 'suppression-egr';
update public.tuning_types set cout_tokens = 2 where slug = 'suppression-adblue';
update public.tuning_types set cout_tokens = 1 where slug = 'suppression-dtc';
update public.tuning_types set cout_tokens = 1 where slug = 'suppression-vmax';
update public.tuning_types set cout_tokens = 1 where slug = 'start-stop';
update public.tuning_types set cout_tokens = 2 where slug = 'pop-bang';
update public.tuning_types set cout_tokens = 2 where slug = 'launch-control';

-- ─── 4. Séquence pour les références de demandes ─────────────────────────────
create sequence if not exists public.tuning_ref_seq start 1;

-- ─── 5. token_ledger ─────────────────────────────────────────────────────────
create table if not exists public.token_ledger (
  id         uuid primary key default gen_random_uuid(),
  atelier_id uuid not null references public.ateliers(id) on delete cascade,
  delta      int not null,
  motif      public.token_motif not null,
  ref_id     uuid,
  note       text,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id),
  constraint token_ledger_delta_nonzero check (delta <> 0)
);

create index if not exists idx_token_ledger_atelier
  on public.token_ledger(atelier_id, created_at desc);

-- ─── 6. token_requests ───────────────────────────────────────────────────────
create table if not exists public.token_requests (
  id                uuid primary key default gen_random_uuid(),
  atelier_id        uuid not null references public.ateliers(id) on delete cascade,
  tokens_demandes   int not null check (tokens_demandes > 0),
  adresse_livraison text not null,
  telephone         text not null,
  statut            public.token_request_statut not null default 'en_attente',
  note_atelier      text,
  note_admin        text,
  transporteur      text,
  numero_suivi      text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── 7. token_codes ──────────────────────────────────────────────────────────
create table if not exists public.token_codes (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid unique references public.token_requests(id) on delete cascade,
  code_hash   text not null unique,
  code_indice text not null,
  tokens      int not null check (tokens > 0),
  expire_le   timestamptz not null,
  utilise_le  timestamptz,
  utilise_par uuid references public.ateliers(id),
  created_at  timestamptz default now(),
  created_by  uuid references public.profiles(id)
);

create index if not exists idx_token_codes_hash on public.token_codes(code_hash);

-- ─── 8. code_redemption_attempts ─────────────────────────────────────────────
create table if not exists public.code_redemption_attempts (
  id         uuid primary key default gen_random_uuid(),
  atelier_id uuid,
  ip         text,
  reussi     bool not null,
  created_at timestamptz default now()
);

create index if not exists idx_code_attempts_atelier
  on public.code_redemption_attempts(atelier_id, created_at desc);

-- ─── 9. tuning_demandes ──────────────────────────────────────────────────────
create table if not exists public.tuning_demandes (
  id                      uuid primary key default gen_random_uuid(),
  reference               text unique not null,
  atelier_id              uuid not null references public.ateliers(id),
  engine_id               uuid not null references public.engines(id),
  tuning_type_id          uuid not null references public.tuning_types(id),
  option_ids              uuid[] not null default '{}',
  cout_tokens             int not null,
  fichier_original        text not null,
  fichier_original_nom    text not null,
  fichier_original_taille int not null,
  fichier_tune            text,
  fichier_tune_nom        text,
  statut                  public.demande_statut not null default 'recue',
  note_atelier            text,
  note_admin              text,
  traite_par              uuid references public.profiles(id),
  livree_le               timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index if not exists idx_tuning_demandes_atelier
  on public.tuning_demandes(atelier_id, created_at desc);
create index if not exists idx_tuning_demandes_statut
  on public.tuning_demandes(statut);

-- ─── 10. RLS ─────────────────────────────────────────────────────────────────
alter table public.app_settings             enable row level security;
alter table public.token_ledger             enable row level security;
alter table public.token_requests           enable row level security;
alter table public.token_codes              enable row level security;
alter table public.code_redemption_attempts enable row level security;
alter table public.tuning_demandes          enable row level security;

-- app_settings
drop policy if exists "settings public read" on public.app_settings;
drop policy if exists "settings admin write" on public.app_settings;

create policy "settings public read" on public.app_settings
  for select to anon, authenticated using (true);
create policy "settings admin write" on public.app_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- token_ledger
drop policy if exists "ledger own read" on public.token_ledger;

create policy "ledger own read" on public.token_ledger for select to authenticated
  using (
    atelier_id in (select id from public.ateliers where user_id = auth.uid())
    or public.is_admin()
  );

-- token_requests
drop policy if exists "requests own read"    on public.token_requests;
drop policy if exists "requests own insert"  on public.token_requests;
drop policy if exists "requests admin update" on public.token_requests;

create policy "requests own read" on public.token_requests for select to authenticated
  using (
    atelier_id in (select id from public.ateliers where user_id = auth.uid())
    or public.is_admin()
  );
create policy "requests own insert" on public.token_requests for insert to authenticated
  with check (
    atelier_id in (select id from public.ateliers where user_id = auth.uid() and statut = 'approuve')
  );
create policy "requests admin update" on public.token_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- token_codes
drop policy if exists "codes admin read" on public.token_codes;

create policy "codes admin read" on public.token_codes for select to authenticated
  using (public.is_admin());

-- tuning_demandes
drop policy if exists "demandes own read"    on public.tuning_demandes;
drop policy if exists "demandes admin update" on public.tuning_demandes;

create policy "demandes own read" on public.tuning_demandes for select to authenticated
  using (
    atelier_id in (select id from public.ateliers where user_id = auth.uid())
    or public.is_admin()
  );
create policy "demandes admin update" on public.tuning_demandes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── 11. Triggers updated_at ─────────────────────────────────────────────────
-- set_updated_at() est définie dans 0006_auth_profiles.sql

drop trigger if exists trg_token_requests_updated_at on public.token_requests;
create trigger trg_token_requests_updated_at
  before update on public.token_requests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tuning_demandes_updated_at on public.tuning_demandes;
create trigger trg_tuning_demandes_updated_at
  before update on public.tuning_demandes
  for each row execute function public.set_updated_at();

-- ─── 12. Fonctions Postgres ──────────────────────────────────────────────────

-- solde_tokens : somme du registre (jamais une colonne)
create or replace function public.solde_tokens(p_atelier uuid)
returns int language sql security definer stable set search_path = public as $$
  select coalesce(sum(delta), 0)::int
  from public.token_ledger
  where atelier_id = p_atelier
$$;

-- generer_code_token : admin uniquement
create or replace function public.generer_code_token(
  p_request uuid,
  p_tokens  int,
  p_jours   int default 30
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes    bytea;
  v_raw      text := '';
  v_code     text;
  i          int;
begin
  if not public.is_admin() then
    raise exception 'unauthorized: admin role required';
  end if;

  -- 12 chars depuis 32 symboles ; 32 divise 256 exactement → zéro biais modulaire
  v_bytes := gen_random_bytes(12);
  for i in 0..11 loop
    v_raw := v_raw || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;

  v_code := substr(v_raw,1,4) || '-' || substr(v_raw,5,4) || '-' || substr(v_raw,9,4);

  insert into public.token_codes
    (request_id, code_hash, code_indice, tokens, expire_le, created_by)
  values (
    p_request,
    encode(sha256(v_code::bytea), 'hex'),
    right(v_raw, 4),
    p_tokens,
    now() + (p_jours || ' days')::interval,
    auth.uid()
  );

  update public.token_requests
  set statut = 'code_genere', updated_at = now()
  where id = p_request;

  return v_code;
end;
$$;

-- utiliser_code_token : atelier approuvé, 5 tentatives max/heure
create or replace function public.utiliser_code_token(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_atelier_id    uuid;
  v_code_row      public.token_codes%rowtype;
  v_tentatives    int;
  v_nouveau_solde int;
begin
  select id into v_atelier_id
  from public.ateliers
  where user_id = auth.uid() and statut = 'approuve'
  limit 1;

  if v_atelier_id is null then
    raise exception 'atelier non approuvé';
  end if;

  select count(*) into v_tentatives
  from public.code_redemption_attempts
  where atelier_id = v_atelier_id
    and created_at > now() - interval '1 hour';

  if v_tentatives >= 5 then
    insert into public.code_redemption_attempts (atelier_id, reussi)
    values (v_atelier_id, false);
    return jsonb_build_object('ok', false, 'message', 'Trop de tentatives. Réessayez dans une heure.');
  end if;

  select * into v_code_row
  from public.token_codes
  where code_hash = encode(sha256(p_code::bytea), 'hex')
  for update;

  if v_code_row.id is null then
    insert into public.code_redemption_attempts (atelier_id, reussi)
    values (v_atelier_id, false);
    return jsonb_build_object('ok', false, 'message', 'Code invalide.');
  end if;

  if v_code_row.utilise_le is not null then
    insert into public.code_redemption_attempts (atelier_id, reussi)
    values (v_atelier_id, false);
    return jsonb_build_object('ok', false, 'message', 'Ce code a déjà été utilisé.');
  end if;

  if v_code_row.expire_le < now() then
    insert into public.code_redemption_attempts (atelier_id, reussi)
    values (v_atelier_id, false);
    return jsonb_build_object('ok', false, 'message', 'Ce code a expiré.');
  end if;

  update public.token_codes
  set utilise_le = now(), utilise_par = v_atelier_id
  where id = v_code_row.id;

  insert into public.token_ledger (atelier_id, delta, motif, ref_id, created_by)
  values (v_atelier_id, v_code_row.tokens, 'recharge', v_code_row.id, auth.uid());

  if v_code_row.request_id is not null then
    update public.token_requests
    set statut = 'utilisee', updated_at = now()
    where id = v_code_row.request_id;
  end if;

  v_nouveau_solde := public.solde_tokens(v_atelier_id);

  insert into public.code_redemption_attempts (atelier_id, reussi)
  values (v_atelier_id, true);

  return jsonb_build_object(
    'ok', true,
    'message', 'Tokens crédités avec succès.',
    'tokens_credites', v_code_row.tokens,
    'nouveau_solde', v_nouveau_solde
  );
end;
$$;

-- creer_demande_tuning : atelier approuvé
create or replace function public.creer_demande_tuning(
  p_engine      uuid,
  p_tuning_type uuid,
  p_options     uuid[],
  p_fichier     text,
  p_nom         text,
  p_taille      int,
  p_note        text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_atelier_id   uuid;
  v_cout_type    int;
  v_cout_options int;
  v_cout_total   int;
  v_solde        int;
  v_demande_id   uuid := gen_random_uuid();
  v_ref          text;
begin
  select id into v_atelier_id
  from public.ateliers
  where user_id = auth.uid() and statut = 'approuve'
  limit 1;

  if v_atelier_id is null then
    raise exception 'atelier non approuvé';
  end if;

  select cout_tokens into v_cout_type
  from public.tuning_types where id = p_tuning_type;

  select coalesce(sum(cout_tokens), 0) into v_cout_options
  from public.options where id = any(p_options);

  v_cout_total := coalesce(v_cout_type, 1) + v_cout_options;

  -- Verrou sur l'atelier pour sérialiser les demandes concurrentes
  perform 1 from public.ateliers where id = v_atelier_id for update;

  v_solde := public.solde_tokens(v_atelier_id);

  if v_solde < v_cout_total then
    return jsonb_build_object(
      'ok',     false,
      'code',   'SOLDE_INSUFFISANT',
      'requis', v_cout_total,
      'solde',  v_solde
    );
  end if;

  v_ref := 'SB-' || to_char(now(), 'YYYY') || '-'
           || lpad(nextval('public.tuning_ref_seq')::text, 4, '0');

  insert into public.tuning_demandes (
    id, reference, atelier_id, engine_id, tuning_type_id,
    option_ids, cout_tokens,
    fichier_original, fichier_original_nom, fichier_original_taille,
    note_atelier
  ) values (
    v_demande_id, v_ref, v_atelier_id, p_engine, p_tuning_type,
    coalesce(p_options, '{}'), v_cout_total,
    p_fichier, p_nom, p_taille, p_note
  );

  insert into public.token_ledger (atelier_id, delta, motif, ref_id, created_by)
  values (v_atelier_id, -v_cout_total, 'demande_tuning', v_demande_id, auth.uid());

  return jsonb_build_object(
    'ok',            true,
    'reference',     v_ref,
    'demande_id',    v_demande_id,
    'nouveau_solde', public.solde_tokens(v_atelier_id)
  );
end;
$$;

-- rembourser_demande : admin uniquement
create or replace function public.rembourser_demande(
  p_demande uuid,
  p_note    text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_demande public.tuning_demandes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'unauthorized: admin role required';
  end if;

  select * into v_demande from public.tuning_demandes where id = p_demande;

  if v_demande.id is null then
    raise exception 'demande introuvable';
  end if;

  if v_demande.statut in ('refusee', 'annulee') then
    raise exception 'demande déjà clôturée';
  end if;

  update public.tuning_demandes
  set statut = 'refusee', note_admin = p_note,
      traite_par = auth.uid(), updated_at = now()
  where id = p_demande;

  insert into public.token_ledger
    (atelier_id, delta, motif, ref_id, note, created_by)
  values (
    v_demande.atelier_id, v_demande.cout_tokens,
    'remboursement', v_demande.id, p_note, auth.uid()
  );
end;
$$;

-- ajuster_solde : crédite ou débite manuellement
create or replace function public.ajuster_solde(
  p_atelier uuid,
  p_delta   int,
  p_note    text
) returns int language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized: admin role required';
  end if;
  if p_delta = 0 then
    raise exception 'delta ne peut pas être zéro';
  end if;

  insert into public.token_ledger (atelier_id, delta, motif, note, created_by)
  values (p_atelier, p_delta, 'ajustement_admin', p_note, auth.uid());

  return public.solde_tokens(p_atelier);
end;
$$;

-- ─── 13. Storage ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('bin-original', 'bin-original', false, 20971520, array['application/octet-stream']),
  ('bin-tune',     'bin-tune',     false, 20971520, array['application/octet-stream'])
on conflict (id) do nothing;

-- bin-original
drop policy if exists "bin_original atelier insert" on storage.objects;
drop policy if exists "bin_original read"           on storage.objects;
drop policy if exists "bin_original admin delete"   on storage.objects;

create policy "bin_original atelier insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bin-original'
    and (string_to_array(name, '/'))[1] = (
      select id::text from public.ateliers
      where user_id = auth.uid() and statut = 'approuve'
      limit 1
    )
  );

create policy "bin_original read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bin-original'
    and (
      public.is_admin()
      or (string_to_array(name, '/'))[1] = (
        select id::text from public.ateliers
        where user_id = auth.uid() and statut = 'approuve'
        limit 1
      )
    )
  );

create policy "bin_original admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bin-original' and public.is_admin());

-- bin-tune
drop policy if exists "bin_tune admin insert" on storage.objects;
drop policy if exists "bin_tune read"         on storage.objects;
drop policy if exists "bin_tune admin delete" on storage.objects;

create policy "bin_tune admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bin-tune' and public.is_admin());

create policy "bin_tune read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bin-tune'
    and (
      public.is_admin()
      or (string_to_array(name, '/'))[1] = (
        select id::text from public.ateliers
        where user_id = auth.uid() and statut = 'approuve'
        limit 1
      )
    )
  );

create policy "bin_tune admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bin-tune' and public.is_admin());
