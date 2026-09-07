-- ────────────────────────────────────────────────────────────────────────────
-- 0018_delai_heures_72.sql
-- Passe le délai de traitement par défaut de 24 h à 72 h.
-- Les demandes existantes gardent leur valeur.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.tuning_demandes
  alter column delai_heures set default 72;
