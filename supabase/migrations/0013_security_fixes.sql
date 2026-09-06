-- ────────────────────────────────────────────────────────────────────────────
-- 0013_security_fixes.sql
-- Corrections de sécurité issues de l'audit
-- ────────────────────────────────────────────────────────────────────────────

-- ─── 1. code_redemption_attempts ─────────────────────────────────────────────
-- RLS est activé mais sans aucune politique SELECT → le super_admin ne peut
-- pas auditer les tentatives depuis le dashboard Supabase ni depuis /sbx.
-- INSERT est déjà autorisé via les fonctions security definer (bypass RLS).

drop policy if exists "attempts super admin read" on public.code_redemption_attempts;

create policy "attempts super admin read" on public.code_redemption_attempts
  for select to authenticated
  using (public.is_super_admin());

-- ─── 2. login_attempts — index sur email pour accélérer le rate-limit check ──
-- checkRateLimit() filtre par email + reussi + created_at.
-- L'index existant est sur (ip, email, created_at) ; un index email-first
-- accélère les requêtes par email seul.

create index if not exists login_attempts_email_created_idx
  on public.login_attempts (email, created_at desc);

-- ─── 3. login_attempts — politique INSERT pour service_role ──────────────────
-- La table a déjà RLS + super_admin SELECT.
-- logLoginAttempt utilise le client service_role qui bypasse RLS,
-- donc aucune politique INSERT n'est nécessaire pour les utilisateurs.
-- On ajoute une vérification explicite que personne d'autre ne peut écrire.

drop policy if exists "login_attempts no direct insert" on public.login_attempts;
-- (Pas besoin de politique : l'absence de politique = accès refusé pour tous
--  sauf service_role qui bypass RLS. Pas de modification nécessaire.)
