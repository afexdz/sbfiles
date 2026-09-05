create table public.login_attempts (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  email      text,
  ip         text,
  user_agent text,
  reussi     boolean not null,
  created_at timestamptz default now()
);

alter table public.login_attempts enable row level security;

-- Only super admins can read the log
create policy "super_admin_read_login_attempts"
  on public.login_attempts for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- Index for efficient suspicious-activity queries
create index login_attempts_ip_email_idx on public.login_attempts (ip, email, created_at desc);
create index login_attempts_created_at_idx on public.login_attempts (created_at desc);
