-- ────────────────────────────────────────────────────────────────────────────
-- 0016_fix_pgcrypto.sql
-- Sur Supabase, pgcrypto est installé dans le schéma "extensions" et non
-- "public". Les fonctions SECURITY DEFINER avec set search_path = public
-- ne voient pas gen_random_bytes() sans qualification explicite.
-- Ce fichier s'assure que l'extension est dans le bon schéma et recrée
-- les deux fonctions concernées avec l'appel qualifié.
-- ────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;

-- ─── generer_code_token ───────────────────────────────────────────────────────

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

  -- extensions.gen_random_bytes : qualifié car search_path = public (pas extensions)
  v_bytes := extensions.gen_random_bytes(12);
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

-- ─── generer_code_standalone ──────────────────────────────────────────────────
-- Recrée également pour cohérence (appelle generer_code_token, donc bénéficie
-- de la correction indirectement, mais on explicite la dépendance).

create or replace function public.generer_code_standalone(
  p_tokens int,
  p_jours  int default 30
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_code    text;
  v_id      uuid;
  v_indice  text;
  v_expire  timestamptz;
  v_created timestamptz;
begin
  v_code := public.generer_code_token(null::uuid, p_tokens, p_jours);

  select id, code_indice, expire_le, created_at
  into   v_id, v_indice, v_expire, v_created
  from   public.token_codes
  where  code_hash = encode(sha256(v_code::bytea), 'hex');

  return jsonb_build_object(
    'code',        v_code,
    'id',          v_id,
    'code_indice', v_indice,
    'expire_le',   v_expire,
    'created_at',  v_created
  );
end;
$$;
