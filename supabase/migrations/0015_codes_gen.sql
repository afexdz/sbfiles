-- ────────────────────────────────────────────────────────────────────────────
-- 0015_codes_gen.sql
-- Génération standalone + politiques super_admin pour modification de codes
-- ────────────────────────────────────────────────────────────────────────────

-- Wrapper qui appelle generer_code_token sans request_id et renvoie
-- un objet JSON avec le code en clair + les métadonnées de la ligne créée.
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

-- Permet au super_admin de modifier les codes (tokens, date expiration,
-- invalidation via expire_le dans le passé).
drop policy if exists "codes super admin update" on public.token_codes;
create policy "codes super admin update" on public.token_codes
  for update to authenticated
  using  (public.is_super_admin())
  with check (public.is_super_admin());
