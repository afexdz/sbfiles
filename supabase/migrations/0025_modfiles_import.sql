-- supabase/migrations/0025_modfiles_import.sql
-- Prépare les tables pour l'import des données mod-files.com (chiptuning).
-- Idempotente : ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
--
-- Ajouts :
--   brands   → modfiles_id text, source text default 'seed'
--   models   → modfiles_id text, source text default 'seed'
--   engines  → modfiles_id text, source text default 'seed',
--               ch_stage1 int, nm_stage1 int
--   Index unique partiel sur modfiles_id (WHERE IS NOT NULL)

-- ── brands ───────────────────────────────────────────────────────────────────
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS modfiles_id text,
  ADD COLUMN IF NOT EXISTS source      text NOT NULL DEFAULT 'seed';

CREATE UNIQUE INDEX IF NOT EXISTS brands_modfiles_id_uq
  ON public.brands (modfiles_id)
  WHERE modfiles_id IS NOT NULL;

-- ── models ───────────────────────────────────────────────────────────────────
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS modfiles_id text,
  ADD COLUMN IF NOT EXISTS source      text NOT NULL DEFAULT 'seed';

CREATE UNIQUE INDEX IF NOT EXISTS models_modfiles_id_uq
  ON public.models (modfiles_id)
  WHERE modfiles_id IS NOT NULL;

-- ── engines ──────────────────────────────────────────────────────────────────
ALTER TABLE public.engines
  ADD COLUMN IF NOT EXISTS modfiles_id text,
  ADD COLUMN IF NOT EXISTS source      text NOT NULL DEFAULT 'seed',
  ADD COLUMN IF NOT EXISTS ch_stage1   int,
  ADD COLUMN IF NOT EXISTS nm_stage1   int;

CREATE UNIQUE INDEX IF NOT EXISTS engines_modfiles_id_uq
  ON public.engines (modfiles_id)
  WHERE modfiles_id IS NOT NULL;
