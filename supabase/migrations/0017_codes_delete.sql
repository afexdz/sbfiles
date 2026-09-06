-- ────────────────────────────────────────────────────────────────────────────
-- 0017_codes_delete.sql
-- Permet au super_admin de supprimer physiquement un code non utilisé.
-- La contrainte utilise_le is null est dans la policy : un code déjà
-- utilisé par un atelier ne peut jamais être supprimé pour garantir la
-- traçabilité des mouvements de tokens.
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "codes super admin delete" on public.token_codes;
create policy "codes super admin delete" on public.token_codes
  for delete to authenticated
  using (public.is_super_admin() and utilise_le is null);
