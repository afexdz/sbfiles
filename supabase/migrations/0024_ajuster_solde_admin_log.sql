-- Ajoute la journalisation dans admin_actions pour ajuster_solde
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

  insert into public.admin_actions (acteur_id, action, cible_type, cible_id, details)
  values (
    auth.uid(),
    'ajuster_solde',
    'atelier',
    p_atelier,
    jsonb_build_object('delta', p_delta, 'note', p_note)
  );

  return public.solde_tokens(p_atelier);
end;
$$;
