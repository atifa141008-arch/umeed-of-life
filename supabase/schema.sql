-- ============ Umeed of Life — Central schema ============
-- Run this in Supabase → SQL Editor

-- 1) Profiles & roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  address text,
  city text,
  role text not null default 'customer'
    check (role in ('customer','applicant','vendor','marketplace_head','marketplace_staff','ceo','co_ceo','central_admin','finance_manager','hr_manager','it_manager')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, city, address)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    nullif(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'city',''),
    nullif(new.raw_user_meta_data->>'address',''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_management() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('ceo','co_ceo','central_admin','finance_manager','hr_manager','it_manager')
  );
$$;

alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "management read profiles" on public.profiles;
create policy "management read profiles" on public.profiles for select using (public.is_management());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- 2) Contact messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200),
  phone text,
  subject text,
  message text not null check (char_length(message) between 5 and 4000),
  status text not null default 'new' check (status in ('new','read','replied')),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "anyone can send message" on public.contact_messages;
create policy "anyone can send message" on public.contact_messages for insert to anon, authenticated with check (true);
drop policy if exists "management read messages" on public.contact_messages;
create policy "management read messages" on public.contact_messages for select using (public.is_management());
drop policy if exists "management update messages" on public.contact_messages;
create policy "management update messages" on public.contact_messages for update using (public.is_management());

-- 3) Impact stats
create table if not exists public.impact_stats (
  key text primary key,
  label text not null,
  value integer not null default 0,
  sort_order integer not null default 0
);
alter table public.impact_stats enable row level security;
drop policy if exists "public read stats" on public.impact_stats;
create policy "public read stats" on public.impact_stats for select using (true);
drop policy if exists "management write stats" on public.impact_stats;
create policy "management write stats" on public.impact_stats for all using (public.is_management()) with check (public.is_management());

insert into public.impact_stats (key, label, value, sort_order) values
  ('lives_impacted','Lives Impacted',0,1),
  ('projects_completed','Projects Completed',0,2),
  ('active_partners','Active Partners',0,3),
  ('communities_reached','Communities Reached',0,4)
on conflict (key) do nothing;

-- 4) News
create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  body text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.news_posts enable row level security;
drop policy if exists "public read published news" on public.news_posts;
create policy "public read published news" on public.news_posts for select using (published = true);
drop policy if exists "management all news" on public.news_posts;
create policy "management all news" on public.news_posts for all using (public.is_management()) with check (public.is_management());

-- 5) Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id),
  action text not null,
  entity text,
  details jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
drop policy if exists "management read audit" on public.audit_logs;
create policy "management read audit" on public.audit_logs for select using (public.is_management());
drop policy if exists "management insert audit" on public.audit_logs;
create policy "management insert audit" on public.audit_logs for insert with check (public.is_management());

-- ============ After creating your first user in Auth → Users, make them CEO: ============
-- update public.profiles set role = 'ceo' where id = 'PASTE-USER-UUID-HERE';
