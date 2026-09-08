-- Fix: abs() FILTER (...) est invalide — FILTER ne peut s'appliquer qu'à un agrégat.
-- Correction : abs(sum(delta) FILTER (WHERE delta < 0))
-- La valeur résultante est positive car sum des deltas négatifs est négatif,
-- et abs() le rend positif. Comportement identique à l'intention d'origine.

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

  -- abs() appliqué sur le résultat du SUM agrégé, pas sur FILTER directement
  select coalesce(abs(sum(delta) filter (where delta < 0)), 0)::int into v_consommes
    from public.token_ledger;

  select coalesce(sum(delta), 0)::int into v_en_circulation
    from public.token_ledger;

  select jsonb_object_agg(statut, cnt) into v_ateliers_statut
    from (select statut, count(*)::int as cnt from public.ateliers group by statut) t;

  select jsonb_object_agg(statut::text, cnt) into v_demandes_statut
    from (select statut, count(*)::int as cnt from public.tuning_demandes group by statut) t;

  return jsonb_build_object(
    'tokens_emis',           v_emis,
    'tokens_consommes',      v_consommes,
    'tokens_en_circulation', v_en_circulation,
    'equivalent_dzd',        v_en_circulation * coalesce(v_taux, 1000),
    'taux_token_dzd',        coalesce(v_taux, 1000),
    'ateliers_par_statut',   coalesce(v_ateliers_statut,  '{}'::jsonb),
    'demandes_par_statut',   coalesce(v_demandes_statut,  '{}'::jsonb)
  );
end;
$$;
