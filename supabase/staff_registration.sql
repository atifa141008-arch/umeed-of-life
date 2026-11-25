-- ============ Staff registration (hidden page: /management/registration) ============
-- Run AFTER dashboard.sql. Safe to run more than once.
--
-- People who fill the hidden form are created as normal CUSTOMER accounts. The details they enter are
-- stored here so management can review them and then assign a role from Users & roles.

create or replace function public.safe_date(t text) returns date language plpgsql immutable as $$
begin
  return nullif(t, '')::date;
exception when others then return null;
end $$;

create table if not exists public.staff_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text, email text,
  father_name text, cnic text, dob date, gender text, marital_status text, nationality text, blood_group text,
  phone text, whatsapp text, address text, permanent_address text, city text, province text,
  emergency_name text, emergency_relation text, emergency_phone text,
  department text, position text, employment_type text, joining_date date, expected_salary text,
  qualification text, institute text, field_of_study text, experience_years text,
  prev_employer text, prev_role text, skills text, languages text, about text,
  status text not null default 'new' check (status in ('new','reviewed','assigned','declined')),
  review_note text, assigned_role text, reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists staff_registrations_status_idx on public.staff_registrations(status, created_at desc);
alter table public.staff_registrations enable row level security;

drop policy if exists "own registration read" on public.staff_registrations;
create policy "own registration read" on public.staff_registrations for select using (user_id = auth.uid());
drop policy if exists "management read registrations" on public.staff_registrations;
create policy "management read registrations" on public.staff_registrations for select
  using (public.has_perm('users') or public.has_perm('hr'));
drop policy if exists "management update registrations" on public.staff_registrations;
create policy "management update registrations" on public.staff_registrations for update
  using (public.has_perm('users') or public.has_perm('hr')) with check (public.has_perm('users') or public.has_perm('hr'));
drop policy if exists "management delete registrations" on public.staff_registrations;
create policy "management delete registrations" on public.staff_registrations for delete
  using (public.has_perm('users') or public.has_perm('hr'));

-- The form sends everything inside the sign-up metadata (key "reg"), so the details are saved even when
-- the project requires email confirmation. A problem here never blocks the account from being created.
create or replace function public.handle_staff_registration() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if coalesce(new.raw_user_meta_data->>'intent', '') <> 'staff' then return new; end if;
  begin
    r := coalesce((new.raw_user_meta_data->>'reg')::jsonb, '{}'::jsonb);
    insert into public.staff_registrations (
      user_id, full_name, email, father_name, cnic, dob, gender, marital_status, nationality, blood_group,
      phone, whatsapp, address, permanent_address, city, province,
      emergency_name, emergency_relation, emergency_phone,
      department, position, employment_type, joining_date, expected_salary,
      qualification, institute, field_of_study, experience_years, prev_employer, prev_role, skills, languages, about)
    values (
      new.id, left(coalesce(new.raw_user_meta_data->>'full_name', r->>'full_name'), 200), new.email,
      left(r->>'father_name', 200), left(r->>'cnic', 30), public.safe_date(r->>'dob'), left(r->>'gender', 30), left(r->>'marital_status', 30), left(r->>'nationality', 60), left(r->>'blood_group', 10),
      left(r->>'phone', 40), left(r->>'whatsapp', 40), left(r->>'address', 500), left(r->>'permanent_address', 500), left(r->>'city', 100), left(r->>'province', 100),
      left(r->>'emergency_name', 200), left(r->>'emergency_relation', 60), left(r->>'emergency_phone', 40),
      left(r->>'department', 100), left(r->>'position', 200), left(r->>'employment_type', 60), public.safe_date(r->>'joining_date'), left(r->>'expected_salary', 60),
      left(r->>'qualification', 100), left(r->>'institute', 200), left(r->>'field_of_study', 200), left(r->>'experience_years', 60), left(r->>'prev_employer', 200), left(r->>'prev_role', 200),
      left(r->>'skills', 2000), left(r->>'languages', 300), left(r->>'about', 3000))
    on conflict (user_id) do nothing;
  exception when others then
    null;
  end;
  return new;
end $$;
drop trigger if exists on_auth_staff_registration on auth.users;
create trigger on_auth_staff_registration after insert on auth.users
  for each row execute function public.handle_staff_registration();
