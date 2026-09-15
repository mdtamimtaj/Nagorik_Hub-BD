-- Production database design for shared user reports.
create table if not exists public.user_updates (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('bus','market','new_info')),
  target_key text not null,
  payload jsonb not null,
  report_count integer not null default 1,
  ai_flag boolean not null default false,
  ai_confidence numeric(5,2) not null default 0,
  ai_reason text,
  ai_sources jsonb not null default '[]'::jsonb,
  status text not null default 'pending_ai' check (status in ('pending_ai','ai_green','pending_admin','approved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists user_updates_target_key_idx on public.user_updates(target_key);
create index if not exists user_updates_status_idx on public.user_updates(status);

-- IMPORTANT: enable RLS and expose only the operations you actually need.
alter table public.user_updates enable row level security;
-- Do not add a public UPDATE/DELETE policy. Admin approval must happen through authenticated admin tooling/server-side rules.

-- ===== Admin authentication / authorization =====
-- Create an admin by inserting their Supabase Auth user UUID here AFTER creating
-- the account in Supabase Dashboard > Authentication > Users.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Admin check used by the browser. SECURITY DEFINER avoids exposing the table.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.admin_users a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin-only policies for review data.
create policy "admins can read user updates" on public.user_updates
for select to authenticated using (public.is_admin());
create policy "admins can update user updates" on public.user_updates
for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- NOTE: Do not expose service_role keys in frontend code.
-- To create the first admin:
-- 1) Create the user in Supabase Auth.
-- 2) Copy that user's UUID.
-- 3) Run: insert into public.admin_users(user_id) values ('USER-UUID-HERE');
