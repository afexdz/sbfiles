alter table public.engines
  add column if not exists disponible boolean not null default true;
