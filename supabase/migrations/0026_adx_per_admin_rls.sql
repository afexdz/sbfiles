-- ────────────────────────────────────────────────────────────────────────────
-- 0026_adx_per_admin_rls.sql
-- Refonte /adx : isolation par admin sur tuning_demandes +
-- fonction atomique de prise en charge
-- Entièrement idempotente
-- ────────────────────────────────────────────────────────────────────────────

-- ─── 1. prendre_en_charge : claim atomique avec protection race condition ─────
create or replace function public.prendre_en_charge(p_demande uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_rows int;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  update public.tuning_demandes
  set
    assigned_admin_id = auth.uid(),
    statut            = 'en_cours',
    telecharge_le     = now()
  where
    id                = p_demande
    and statut        = 'recue'
    and assigned_admin_id is null;

  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    insert into public.admin_actions (acteur_id, action, cible_type, cible_id)
    values (auth.uid(), 'prise_en_charge', 'tuning_demande', p_demande);
  end if;

  return v_rows > 0;
end;
$$;

-- ─── 2. Index pour les requêtes d'historique par demande ────────────────────
create index if not exists idx_admin_actions_cible_id
  on public.admin_actions(cible_id, created_at desc);

-- ─── 3. RLS tuning_demandes : isolation par admin ────────────────────────────

-- SELECT : propriétaire atelier | super_admin voit tout |
--          admin voit : non attribuées (recue) + les siennes (en_cours/livrées)
drop policy if exists "demandes own read" on public.tuning_demandes;
create policy "demandes own read" on public.tuning_demandes
  for select to authenticated using (
    atelier_id in (select id from public.ateliers where user_id = auth.uid())
    or public.is_super_admin()
    or (
      public.is_admin() and (
        statut = 'recue'
        or assigned_admin_id = auth.uid()
        or traite_par = auth.uid()
      )
    )
  );

-- UPDATE : super_admin met à jour toutes | admin met à jour non attribuées (claim)
--          ou celles qui lui sont assignées
drop policy if exists "demandes admin update" on public.tuning_demandes;
create policy "demandes admin update" on public.tuning_demandes
  for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_admin() and (
        (statut = 'recue' and assigned_admin_id is null)
        or assigned_admin_id = auth.uid()
      )
    )
  )
  with check (public.is_admin());

-- ─── 4. profiles : les admins peuvent lire les profils des autres admins ─────
-- (nécessaire pour afficher le nom de l'admin traitant sur /sbx)
drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (public.is_admin() and role in ('admin', 'super_admin'))
  );
