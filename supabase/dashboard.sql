-- ============ Dashboard & access control ============
-- Run AFTER schema.sql and marketplace.sql. Safe to run more than once.

-- ---------- 0. Repair older installs (safe to re-run) ----------
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists city text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in
  ('customer','applicant','vendor','marketplace_head','marketplace_staff','ceo','co_ceo','central_admin','finance_manager','hr_manager','it_manager'));

-- ---------- 0b. Table / function privileges (fixes "permission denied for table …") ----------
-- Row Level Security still decides which rows each person can see; these grants only let the API reach the tables.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;

-- ---------- 0c. Sign-up: vendor sign-ups become 'applicant' right away (works with email confirmation) ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_vendor boolean := coalesce(new.raw_user_meta_data->>'intent', '') = 'vendor';
begin
  insert into public.profiles (id, full_name, email, phone, city, address, role)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    nullif(new.raw_user_meta_data->>'phone',''), nullif(new.raw_user_meta_data->>'city',''), nullif(new.raw_user_meta_data->>'address',''),
    case when v_vendor then 'applicant' else 'customer' end);
  if v_vendor then
    insert into public.vendor_applications (user_id, email) values (new.id, new.email) on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

-- ---------- 0d. Fuller vendor application (safe to re-run) ----------
alter table public.vendor_applications
  add column if not exists id_number text,
  add column if not exists business_address text,
  add column if not exists registration_no text,
  add column if not exists tax_no text,
  add column if not exists experience text,
  add column if not exists product_count text,
  add column if not exists social_links text;

-- ---------- 1. Permission matrix ----------
create table if not exists public.role_permissions (
  role text not null,
  module text not null,
  allowed boolean not null default false,
  primary key (role, module)
);
alter table public.role_permissions enable row level security;

-- CEO and Co-CEO always have every permission. Everyone else follows the matrix.
create or replace function public.has_perm(p_module text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() in ('ceo','co_ceo') then true
    else coalesce((select allowed from public.role_permissions where role = public.my_role() and module = p_module), false)
  end
$$;

drop policy if exists "read own role perms" on public.role_permissions;
create policy "read own role perms" on public.role_permissions for select
  using (role = public.my_role() or public.my_role() in ('ceo','co_ceo'));
drop policy if exists "ceo manage perms" on public.role_permissions;
create policy "ceo manage perms" on public.role_permissions for all
  using (public.my_role() in ('ceo','co_ceo')) with check (public.my_role() in ('ceo','co_ceo'));

insert into public.role_permissions (role, module, allowed)
select r, m, true from (values
  ('central_admin','overview'),('central_admin','messages'),('central_admin','impact'),('central_admin','news'),
  ('central_admin','content'),('central_admin','departments'),('central_admin','banners'),
  ('finance_manager','overview'),('finance_manager','finance'),
  ('hr_manager','overview'),('hr_manager','hr'),
  ('it_manager','overview'),('it_manager','users'),('it_manager','audit'),
  ('marketplace_head','mp_applications'),('marketplace_head','mp_vendors'),('marketplace_head','mp_products'),
  ('marketplace_head','mp_orders'),('marketplace_head','mp_categories'),('marketplace_head','banners'),
  ('marketplace_staff','mp_applications'),('marketplace_staff','mp_products'),('marketplace_staff','mp_orders')
) as t(r, m)
on conflict (role, module) do nothing;

-- ---------- 2. Existing helpers now follow the matrix ----------
create or replace function public.is_finance() returns boolean language sql stable security definer set search_path = public as
$$ select public.has_perm('finance') $$;
create or replace function public.is_hr() returns boolean language sql stable security definer set search_path = public as
$$ select public.has_perm('hr') $$;
create or replace function public.is_marketplace_staff() returns boolean language sql stable security definer set search_path = public as
$$ select public.has_perm('mp_applications') or public.has_perm('mp_vendors') or public.has_perm('mp_products')
        or public.has_perm('mp_orders') or public.has_perm('mp_categories') $$;

-- ---------- 3. Central policies follow the matrix ----------
drop policy if exists "management read profiles" on public.profiles;
create policy "management read profiles" on public.profiles for select using (public.has_perm('users'));

drop policy if exists "management read messages" on public.contact_messages;
create policy "management read messages" on public.contact_messages for select using (public.has_perm('messages'));
drop policy if exists "management update messages" on public.contact_messages;
create policy "management update messages" on public.contact_messages for update using (public.has_perm('messages'));

drop policy if exists "management write stats" on public.impact_stats;
create policy "management write stats" on public.impact_stats for all using (public.has_perm('impact')) with check (public.has_perm('impact'));

drop policy if exists "management all news" on public.news_posts;
create policy "management all news" on public.news_posts for all using (public.has_perm('news')) with check (public.has_perm('news'));

drop policy if exists "management read audit" on public.audit_logs;
create policy "management read audit" on public.audit_logs for select using (public.has_perm('audit'));

-- ---------- 4. Marketplace policies follow the matrix ----------
drop policy if exists "staff read applications" on public.vendor_applications;
create policy "staff read applications" on public.vendor_applications for select using (public.has_perm('mp_applications'));
drop policy if exists "staff read docs" on public.application_documents;
create policy "staff read docs" on public.application_documents for select using (public.has_perm('mp_applications'));
drop policy if exists "staff read events" on public.verification_events;
create policy "staff read events" on public.verification_events for select using (public.has_perm('mp_applications'));

drop policy if exists "staff read products" on public.products;
create policy "staff read products" on public.products for select using (public.has_perm('mp_products'));
drop policy if exists "staff update products" on public.products;
create policy "staff update products" on public.products for update using (public.has_perm('mp_products'));

drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select using (public.has_perm('mp_orders'));
drop policy if exists "staff read vendor_orders" on public.vendor_orders;
create policy "staff read vendor_orders" on public.vendor_orders for select using (public.has_perm('mp_orders'));
drop policy if exists "staff update vendor_orders" on public.vendor_orders;
create policy "staff update vendor_orders" on public.vendor_orders for update using (public.has_perm('mp_orders'));
drop policy if exists "staff read items" on public.order_items;
create policy "staff read items" on public.order_items for select using (public.has_perm('mp_orders'));

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (active or public.has_perm('mp_categories'));
drop policy if exists "staff manage categories" on public.categories;
create policy "staff manage categories" on public.categories for all using (public.has_perm('mp_categories')) with check (public.has_perm('mp_categories'));

drop policy if exists "own or staff read docs" on storage.objects;
create policy "own or staff read docs" on storage.objects for select to authenticated
  using (bucket_id = 'vendor-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_perm('mp_applications')));

-- ---------- 5. Trusted functions re-created with specific permissions ----------

create or replace function public.decide_application(p_id uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare a record; v_rate numeric;
begin
  if not public.has_perm('mp_applications') then raise exception 'Not allowed'; end if;
  if p_decision not in ('approved','rejected','more_information') then raise exception 'Invalid decision'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'A decision note is required'; end if;
  select * into a from vendor_applications where id = p_id for update;
  if a.status not in ('under_review') then raise exception 'Application is not under review'; end if;
  update vendor_applications set status = p_decision, decision_note = p_note, reviewer_id = auth.uid(), updated_at = now() where id = p_id;
  if p_decision = 'approved' then
    select value::numeric into v_rate from platform_settings where key = 'default_commission_rate';
    insert into vendors (user_id, slug, store_name, description, support_contact, commission_rate)
    values (a.user_id,
      trim(both '-' from lower(regexp_replace(coalesce(a.store_display_name, a.business_name, 'store'), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(gen_random_uuid()::text, 1, 4),
      coalesce(a.store_display_name, a.business_name, 'New store'), a.store_description, a.support_contact, coalesce(v_rate, 10))
    on conflict (user_id) do nothing;
    update profiles set role = 'vendor' where id = a.user_id;
  end if;
  insert into verification_events (application_id, actor, action, note) values (p_id, auth.uid(), p_decision, p_note);
  insert into audit_logs (actor, action, entity, details) values (auth.uid(), 'application_' || p_decision, 'vendor_applications', jsonb_build_object('id', p_id, 'note', p_note));
end $$;
create or replace function public.set_vendor_status(p_vendor uuid, p_status text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_perm('mp_vendors') then raise exception 'Not allowed'; end if;
  if p_status not in ('active','suspended') then raise exception 'Invalid status'; end if;
  update vendors set status = p_status where id = p_vendor;
  insert into audit_logs (actor, action, entity, details) values (auth.uid(), 'vendor_' || p_status, 'vendors', jsonb_build_object('id', p_vendor, 'note', p_note));
end $$;
create or replace function public.moderate_product(p_id uuid, p_status text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_perm('mp_products') then raise exception 'Not allowed'; end if;
  if p_status not in ('approved','rejected','disabled') then raise exception 'Invalid status'; end if;
  if p_status = 'rejected' and coalesce(trim(p_note), '') = '' then raise exception 'A reason is required'; end if;
  update products set status = p_status, rejection_note = case when p_status = 'approved' then null else p_note end where id = p_id;
  insert into audit_logs (actor, action, entity, details) values (auth.uid(), 'product_' || p_status, 'products', jsonb_build_object('id', p_id, 'note', p_note));
end $$;
create or replace function public.product_guard() returns trigger language plpgsql as $$
begin
  if not public.is_client_call() or public.has_perm('mp_products') then return new; end if;
  if tg_op = 'INSERT' then
    if new.status not in ('draft','pending_review') then new.status := 'draft'; end if;
    new.is_featured := false; new.sold_count := 0; new.rejection_note := null;
    return new;
  end if;
  new.vendor_id := old.vendor_id; new.is_featured := old.is_featured; new.sold_count := old.sold_count;
  new.rejection_note := old.rejection_note; new.slug := old.slug;
  if new.status not in ('draft','pending_review') then new.status := old.status; end if;
  -- stock-only edits keep an approved product live; any content edit needs re-review
  if old.status = 'approved' and new.name = old.name and new.description is not distinct from old.description
     and new.price = old.price and new.sale_price is not distinct from old.sale_price
     and new.image_urls = old.image_urls and new.category_id is not distinct from old.category_id then
    new.status := 'approved';
  elsif old.status = 'approved' or old.status = 'disabled' then
    new.status := 'pending_review';
    if old.status = 'disabled' then new.status := 'disabled'; end if;
  end if;
  return new;
end $$;
create or replace function public.vendor_order_guard() returns trigger language plpgsql as $$
begin
  if not public.is_client_call() then return new; end if;
  new.order_id := old.order_id; new.vendor_id := old.vendor_id; new.subtotal := old.subtotal;
  new.delivery_fee := old.delivery_fee; new.commission_rate := old.commission_rate;
  new.commission_amount := old.commission_amount; new.vendor_payable := old.vendor_payable;
  if not public.has_perm('mp_orders') then
    if new.status <> old.status then
      if new.status not in ('accepted','processing','shipped','cancelled') then raise exception 'Status not allowed'; end if;
      if new.status = 'cancelled' and old.status not in ('new','accepted') then raise exception 'Order can no longer be cancelled'; end if;
    end if;
  end if;
  return new;
end $$;
create or replace function public.marketplace_summary() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not (public.has_perm('overview') or public.has_perm('finance')) then raise exception 'Not allowed'; end if;
  return jsonb_build_object(
    'vendors', (select count(*) from vendors where status = 'active'),
    'pending_applications', (select count(*) from vendor_applications where status = 'under_review'),
    'products', (select count(*) from products where status = 'approved'),
    'orders', (select count(*) from orders),
    'gross_sales', (select coalesce(sum(subtotal), 0) from vendor_orders where status = 'delivered'),
    'commission', (select coalesce(sum(commission_amount), 0) from vendor_orders where status = 'delivered'),
    'vendor_payable', (select coalesce(sum(amount), 0) from vendor_ledger_entries));
end $$;

create or replace function public.set_user_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare v_old text;
begin
  if not public.has_perm('users') then raise exception 'Not allowed'; end if;
  if p_role not in ('customer','marketplace_head','marketplace_staff','central_admin','finance_manager','hr_manager','it_manager','co_ceo','ceo') then raise exception 'Invalid role'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own role'; end if;
  select role into v_old from profiles where id = p_user;
  if v_old is null then raise exception 'User not found'; end if;
  if v_old in ('vendor','applicant') then raise exception 'Vendors and applicants are managed from Marketplace'; end if;
  if (p_role in ('ceo','co_ceo') or v_old in ('ceo','co_ceo')) and public.my_role() <> 'ceo' then raise exception 'Only the CEO can change this role'; end if;
  update profiles set role = p_role where id = p_user;
  insert into audit_logs (actor, action, entity, details) values (auth.uid(), 'set_role', 'profiles', jsonb_build_object('user', p_user, 'from', v_old, 'role', p_role));
end $$;

-- ---------- 6. Website content tables ----------
create table if not exists public.site_settings (key text primary key, value text not null default '', updated_at timestamptz default now());
alter table public.site_settings enable row level security;
drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select using (true);
drop policy if exists "content write site settings" on public.site_settings;
create policy "content write site settings" on public.site_settings for all using (public.has_perm('content')) with check (public.has_perm('content'));
insert into public.site_settings (key, value) values ('marketplace_enabled','true'), ('announcement_enabled','false')
on conflict (key) do nothing;

create table if not exists public.department_settings (
  slug text primary key, name text, short text,
  status text not null default 'Coming Soon' check (status in ('Now open','Coming Soon','Paused')),
  visible boolean not null default true, updated_at timestamptz default now()
);
alter table public.department_settings enable row level security;
drop policy if exists "public read department settings" on public.department_settings;
create policy "public read department settings" on public.department_settings for select using (true);
drop policy if exists "manage department settings" on public.department_settings;
create policy "manage department settings" on public.department_settings for all using (public.has_perm('departments')) with check (public.has_perm('departments'));

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null, text text, cta_label text, link text,
  tone text not null default 'red' check (tone in ('red','orange','peach','green')),
  active boolean not null default true, sort_order int not null default 0, created_at timestamptz default now()
);
alter table public.banners enable row level security;
drop policy if exists "read banners" on public.banners;
create policy "read banners" on public.banners for select using (active or public.has_perm('banners'));
drop policy if exists "manage banners" on public.banners;
create policy "manage banners" on public.banners for all using (public.has_perm('banners')) with check (public.has_perm('banners'));

-- close / open the marketplace from the dashboard (blocks new orders while closed)
create or replace function public.orders_open_check() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((select value from site_settings where key = 'marketplace_enabled'), 'true') = 'false' then
    raise exception 'Umeed Marketplace is temporarily closed. Please try again later.';
  end if;
  return new;
end $$;
drop trigger if exists orders_open_check_t on public.orders;
create trigger orders_open_check_t before insert on public.orders for each row execute function public.orders_open_check();

-- ---------- 7. Dashboard data ----------
create or replace function public.dashboard_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_perm('overview') then raise exception 'Not allowed'; end if;
  return jsonb_build_object(
    'customers', (select count(*) from profiles where role = 'customer'),
    'vendors', (select count(*) from vendors where status = 'active'),
    'products', (select count(*) from products where status = 'approved'),
    'orders', (select count(*) from orders),
    'orders_today', (select count(*) from orders where created_at::date = current_date),
    'order_value', (select coalesce(sum(total), 0) from orders where status <> 'cancelled'),
    'gross_sales', (select coalesce(sum(subtotal), 0) from vendor_orders where status = 'delivered'),
    'commission', (select coalesce(sum(commission_amount), 0) from vendor_orders where status = 'delivered'),
    'vendor_payable', (select coalesce(sum(amount), 0) from vendor_ledger_entries),
    'series', (select coalesce(jsonb_agg(jsonb_build_object('day', to_char(d, 'DD Mon'), 'orders', c, 'value', v) order by d), '[]'::jsonb)
      from (select g::date as d, count(o.id) as c, coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0) as v
            from generate_series(current_date - 13, current_date, interval '1 day') g
            left join orders o on o.created_at::date = g::date group by g) s),
    'status', (select coalesce(jsonb_object_agg(status, c), '{}'::jsonb) from (select status, count(*) as c from vendor_orders group by status) t),
    'top_vendors', (select coalesce(jsonb_agg(jsonb_build_object('name', store_name, 'value', v) order by v desc), '[]'::jsonb)
      from (select ve.store_name, sum(vo.subtotal) as v from vendor_orders vo join vendors ve on ve.id = vo.vendor_id
            where vo.status <> 'cancelled' group by ve.store_name order by v desc limit 5) tv),
    'pending', jsonb_build_object(
      'applications', (select count(*) from vendor_applications where status = 'under_review'),
      'products', (select count(*) from products where status = 'pending_review'),
      'messages', (select count(*) from contact_messages where status = 'new'),
      'orders', (select count(*) from vendor_orders where status = 'new'))
  );
end $$;

-- small counts for the notification bell (each count only if the role may see that module)
create or replace function public.pending_counts() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'messages', case when public.has_perm('messages') then (select count(*) from contact_messages where status = 'new') end,
    'applications', case when public.has_perm('mp_applications') then (select count(*) from vendor_applications where status = 'under_review') end,
    'products', case when public.has_perm('mp_products') then (select count(*) from products where status = 'pending_review') end,
    'orders', case when public.has_perm('mp_orders') then (select count(*) from vendor_orders where status = 'new') end)
$$;

-- ---------- 8. Vendor verification helpers ----------
-- Reviewers can check that the payout account matches the applicant, without seeing the full account number.
create or replace function public.application_bank_preview(p_app uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.has_perm('mp_applications') then raise exception 'Not allowed'; end if;
  select jsonb_build_object('account_holder', b.account_holder, 'bank_name', b.bank_name, 'account_last4', right(b.account_number, 4))
    into r from vendor_bank_details b join vendor_applications a on a.user_id = b.user_id where a.id = p_app;
  return r;
end $$;

-- A declined applicant can correct their details and apply again (the earlier decision stays in the history).
create or replace function public.reapply_application() returns void
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from vendor_applications where user_id = auth.uid() and status = 'rejected';
  if v is null then raise exception 'Nothing to re-apply for'; end if;
  update vendor_applications set status = 'draft', updated_at = now() where id = v;
  insert into verification_events (application_id, actor, action, note) values (v, auth.uid(), 'reapply', 'Applicant reopened a declined application');
end $$;

-- Applicants can read the history of their own application (decisions and notes).
drop policy if exists "owner read events" on public.verification_events;
create policy "owner read events" on public.verification_events for select
  using (application_id in (select id from public.vendor_applications where user_id = auth.uid()));
