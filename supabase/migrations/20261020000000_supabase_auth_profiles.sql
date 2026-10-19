-- Supabase Auth identities and application roles.
-- Public signup always creates a customer; elevated roles are assigned only by a trusted administrator.
create table if not exists public.auth_profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auth_profiles enable row level security;
grant select on public.auth_profiles to authenticated;

drop policy if exists "Users can read their own auth profile" on public.auth_profiles;
create policy "Users can read their own auth profile"
  on public.auth_profiles for select
  to authenticated
  using (auth.uid() = auth_user_id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.auth_profiles (auth_user_id, role)
  values (new.id, 'customer')
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- The function is only for the Auth trigger; API roles must not invoke it directly.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- Safely backfill existing Auth users without elevating anyone.
insert into public.auth_profiles (auth_user_id, role)
select id, 'customer' from auth.users
on conflict (auth_user_id) do nothing;
