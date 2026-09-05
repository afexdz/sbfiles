-- Add registre de commerce field to ateliers
alter table public.ateliers
  add column if not exists registre_commerce text;
