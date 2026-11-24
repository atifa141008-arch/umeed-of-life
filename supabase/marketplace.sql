-- ============ Umeed Marketplace schema ============
-- Run AFTER schema.sql

-- ---------- helpers ----------
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_marketplace_staff() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() in ('marketplace_head','marketplace_staff'), false) $$;
create or replace function public.is_finance() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() in ('finance_manager','ceo','co_ceo'), false) $$;
create or replace function public.is_hr() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() in ('hr_manager','ceo','co_ceo'), false) $$;
create or replace function public.my_vendor_id() returns uuid language plpgsql stable security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from public.vendors where user_id = auth.uid();
  return v;
end $$;
-- true only for direct client requests (not for trusted server functions)
create or replace function public.is_client_call() returns boolean language sql stable as
$$ select current_user in ('authenticated','anon') $$;

-- ---------- settings ----------
create table if not exists public.platform_settings (key text primary key, value text not null, updated_at timestamptz default now());
alter table public.platform_settings enable row level security;
drop policy if exists "public read settings" on public.platform_settings;
create policy "public read settings" on public.platform_settings for select using (true);
drop policy if exists "finance write settings" on public.platform_settings;
create policy "finance write settings" on public.platform_settings for all using (public.is_finance()) with check (public.is_finance());
insert into public.platform_settings (key, value) values
  ('default_commission_rate','10'),      -- PLACEHOLDER: decide before launch
  ('delivery_fee_per_vendor','250')       -- PLACEHOLDER: decide before launch
on conflict (key) do nothing;

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null, description text,
  sort_order int default 0, active boolean default true
);
alter table public.categories enable row level security;
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (active or public.is_marketplace_staff());
drop policy if exists "staff manage categories" on public.categories;
create policy "staff manage categories" on public.categories for all using (public.is_marketplace_staff()) with check (public.is_marketplace_staff());
insert into public.categories (slug,name,description,sort_order) values
  ('fashion','Fashion','Clothing and accessories',1),
  ('electronics','Electronics','Mobiles and gadgets',2),
  ('home-living','Home & Living','Furniture and home decor',3),
  ('beauty-health','Beauty & Health','Beauty and personal care',4),
  ('bags-luggage','Bags & Luggage','Bags, wallets and travel',5),
  ('sports-outdoors','Sports & Outdoors','Fitness and outdoor gear',6),
  ('baby-kids','Baby & Kids','Products for little ones',7),
  ('books-stationery','Books & Stationery','Books and learning',8)
on conflict (slug) do nothing;

-- ---------- vendor applications ----------
create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','under_review','more_information','approved','rejected','suspended')),
  email text, applicant_type text, legal_name text, phone text, address text, city text,
  business_name text, business_type text, category text, description text, website text,
  store_display_name text, store_description text, return_address text, support_contact text,
  policies_accepted_at timestamptz, policy_version text,
  reviewer_id uuid, decision_note text, submitted_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.vendor_applications enable row level security;
drop policy if exists "owner read application" on public.vendor_applications;
create policy "owner read application" on public.vendor_applications for select using (user_id = auth.uid());
drop policy if exists "owner update application" on public.vendor_applications;
create policy "owner update application" on public.vendor_applications for update using (user_id = auth.uid());
drop policy if exists "staff read applications" on public.vendor_applications;
create policy "staff read applications" on public.vendor_applications for select using (public.is_marketplace_staff());

create or replace function public.app_guard() returns trigger language plpgsql as $$
begin
  if not public.is_client_call() then return new; end if;
  if old.status not in ('draft','more_information') then raise exception 'Application is locked'; end if;
  if new.status not in ('draft','under_review') then raise exception 'Invalid status'; end if;
  new.user_id := old.user_id; new.reviewer_id := old.reviewer_id; new.decision_note := old.decision_note;
  if new.status = 'under_review' then new.submitted_at := now(); end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists app_guard_t on public.vendor_applications;
create trigger app_guard_t before update on public.vendor_applications for each row execute function public.app_guard();

-- restricted financial data
create table if not exists public.vendor_bank_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_holder text, bank_name text, account_number text, updated_at timestamptz default now()
);
alter table public.vendor_bank_details enable row level security;
drop policy if exists "owner bank" on public.vendor_bank_details;
create policy "owner bank" on public.vendor_bank_details for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "finance read bank" on public.vendor_bank_details;
create policy "finance read bank" on public.vendor_bank_details for select using (public.is_finance());

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.vendor_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null, file_path text not null, created_at timestamptz default now()
);
alter table public.application_documents enable row level security;
drop policy if exists "owner docs" on public.application_documents;
create policy "owner docs" on public.application_documents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "staff read docs" on public.application_documents;
create policy "staff read docs" on public.application_documents for select using (public.is_marketplace_staff());

create table if not exists public.verification_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.vendor_applications(id) on delete cascade,
  actor uuid, action text, note text, created_at timestamptz default now()
);
alter table public.verification_events enable row level security;
drop policy if exists "staff read events" on public.verification_events;
create policy "staff read events" on public.verification_events for select using (public.is_marketplace_staff());

-- ---------- vendors ----------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  slug text unique not null, store_name text not null, description text,
  logo_url text, banner_url text, support_contact text,
  status text not null default 'active' check (status in ('active','suspended')),
  commission_rate numeric not null default 10,
  created_at timestamptz default now()
);
alter table public.vendors enable row level security;
drop policy if exists "public read active vendors" on public.vendors;
create policy "public read active vendors" on public.vendors for select using (status = 'active');
drop policy if exists "owner read vendor" on public.vendors;
create policy "owner read vendor" on public.vendors for select using (user_id = auth.uid());
drop policy if exists "staff read vendors" on public.vendors;
create policy "staff read vendors" on public.vendors for select using (public.is_marketplace_staff() or public.is_finance());
drop policy if exists "owner update vendor" on public.vendors;
create policy "owner update vendor" on public.vendors for update using (user_id = auth.uid());
drop policy if exists "finance update vendor" on public.vendors;
create policy "finance update vendor" on public.vendors for update using (public.is_finance());
create or replace function public.vendor_guard() returns trigger language plpgsql as $$
begin
  if public.is_client_call() then
    new.user_id := old.user_id; new.status := old.status; new.slug := old.slug; new.store_name := old.store_name;
    if not public.is_finance() then new.commission_rate := old.commission_rate; end if;
  end if;
  return new;
end $$;
drop trigger if exists vendor_guard_t on public.vendors;
create trigger vendor_guard_t before update on public.vendors for each row execute function public.vendor_guard();

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category_id uuid references public.categories(id),
  slug text unique not null, name text not null, description text,
  price numeric not null check (price >= 0), sale_price numeric check (sale_price >= 0),
  stock int not null default 0 check (stock >= 0), sku text,
  image_urls text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected','disabled')),
  rejection_note text, is_featured boolean default false, sold_count int default 0,
  created_at timestamptz default now()
);
create index if not exists products_status_idx on public.products(status, created_at desc);
alter table public.products enable row level security;
drop policy if exists "public read approved products" on public.products;
create policy "public read approved products" on public.products for select
  using (status = 'approved' and vendor_id in (select id from public.vendors where status = 'active'));
drop policy if exists "owner read products" on public.products;
create policy "owner read products" on public.products for select using (vendor_id = public.my_vendor_id());
drop policy if exists "staff read products" on public.products;
create policy "staff read products" on public.products for select using (public.is_marketplace_staff());
drop policy if exists "owner insert products" on public.products;
create policy "owner insert products" on public.products for insert with check (vendor_id = public.my_vendor_id());
drop policy if exists "owner update products" on public.products;
create policy "owner update products" on public.products for update using (vendor_id = public.my_vendor_id());
drop policy if exists "owner delete products" on public.products;
create policy "owner delete products" on public.products for delete using (vendor_id = public.my_vendor_id() and status in ('draft','rejected'));
drop policy if exists "staff update products" on public.products;
create policy "staff update products" on public.products for update using (public.is_marketplace_staff());

create or replace function public.product_guard() returns trigger language plpgsql as $$
begin
  if not public.is_client_call() or public.is_marketplace_staff() then return new; end if;
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
drop trigger if exists product_guard_t on public.products;
create trigger product_guard_t before insert or update on public.products for each row execute function public.product_guard();

-- ---------- orders ----------
create sequence if not exists public.order_seq start 1001;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  buyer_id uuid not null references auth.users(id),
  status text not null default 'placed' check (status in ('placed','processing','completed','cancelled')),
  payment_method text not null default 'cod',
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  subtotal numeric not null default 0, delivery_fee numeric not null default 0, total numeric not null default 0,
  ship_name text, ship_phone text, ship_address text, ship_city text, notes text,
  created_at timestamptz default now()
);
alter table public.orders enable row level security;
drop policy if exists "buyer read orders" on public.orders;
create policy "buyer read orders" on public.orders for select using (buyer_id = auth.uid());
drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select using (public.is_marketplace_staff());

create table if not exists public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id),
  order_number text, status text not null default 'new'
    check (status in ('new','accepted','processing','shipped','delivered','cancelled')),
  subtotal numeric not null default 0, delivery_fee numeric not null default 0,
  commission_rate numeric not null default 0, commission_amount numeric not null default 0, vendor_payable numeric not null default 0,
  courier text, tracking_number text,
  ship_name text, ship_phone text, ship_address text, ship_city text,
  created_at timestamptz default now()
);
alter table public.vendor_orders enable row level security;
drop policy if exists "vendor read own orders" on public.vendor_orders;
create policy "vendor read own orders" on public.vendor_orders for select using (vendor_id = public.my_vendor_id());
drop policy if exists "vendor update own orders" on public.vendor_orders;
create policy "vendor update own orders" on public.vendor_orders for update using (vendor_id = public.my_vendor_id());
drop policy if exists "buyer read vendor_orders" on public.vendor_orders;
create policy "buyer read vendor_orders" on public.vendor_orders for select using (order_id in (select id from public.orders where buyer_id = auth.uid()));
drop policy if exists "staff read vendor_orders" on public.vendor_orders;
create policy "staff read vendor_orders" on public.vendor_orders for select using (public.is_marketplace_staff());
drop policy if exists "staff update vendor_orders" on public.vendor_orders;
create policy "staff update vendor_orders" on public.vendor_orders for update using (public.is_marketplace_staff());

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_order_id uuid not null references public.vendor_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, sku text, vendor_name text, image_url text,
  unit_price numeric not null, quantity int not null check (quantity > 0), line_total numeric not null
);
alter table public.order_items enable row level security;
drop policy if exists "buyer read items" on public.order_items;
create policy "buyer read items" on public.order_items for select using (order_id in (select id from public.orders where buyer_id = auth.uid()));
drop policy if exists "vendor read items" on public.order_items;
create policy "vendor read items" on public.order_items for select using (vendor_order_id in (select id from public.vendor_orders where vendor_id = public.my_vendor_id()));
drop policy if exists "staff read items" on public.order_items;
create policy "staff read items" on public.order_items for select using (public.is_marketplace_staff());

create or replace function public.vendor_order_guard() returns trigger language plpgsql as $$
begin
  if not public.is_client_call() then return new; end if;
  new.order_id := old.order_id; new.vendor_id := old.vendor_id; new.subtotal := old.subtotal;
  new.delivery_fee := old.delivery_fee; new.commission_rate := old.commission_rate;
  new.commission_amount := old.commission_amount; new.vendor_payable := old.vendor_payable;
  if not public.is_marketplace_staff() then
    if new.status <> old.status then
      if new.status not in ('accepted','processing','shipped','cancelled') then raise exception 'Status not allowed'; end if;
      if new.status = 'cancelled' and old.status not in ('new','accepted') then raise exception 'Order can no longer be cancelled'; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists vendor_order_guard_t on public.vendor_orders;
create trigger vendor_order_guard_t before update on public.vendor_orders for each row execute function public.vendor_order_guard();

-- ---------- ledger ----------
create table if not exists public.vendor_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  vendor_order_id uuid references public.vendor_orders(id),
  type text not null check (type in ('sale','commission','refund','adjustment','settlement')),
  amount numeric not null, note text, created_by uuid, created_at timestamptz default now()
);
alter table public.vendor_ledger_entries enable row level security;
drop policy if exists "vendor read ledger" on public.vendor_ledger_entries;
create policy "vendor read ledger" on public.vendor_ledger_entries for select using (vendor_id = public.my_vendor_id());
drop policy if exists "finance read ledger" on public.vendor_ledger_entries;
create policy "finance read ledger" on public.vendor_ledger_entries for select using (public.is_finance());
drop policy if exists "finance insert settlement" on public.vendor_ledger_entries;
create policy "finance insert settlement" on public.vendor_ledger_entries for insert
  with check (public.is_finance() and type in ('settlement','adjustment','refund') and created_by = auth.uid());

-- after status change: post ledger on delivery, restock on cancel, roll up order status
create or replace function public.vendor_order_after() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'delivered' and old.status <> 'delivered' then
    insert into vendor_ledger_entries (vendor_id, vendor_order_id, type, amount, note) values
      (new.vendor_id, new.id, 'sale', new.subtotal, 'Order ' || new.order_number),
      (new.vendor_id, new.id, 'commission', -new.commission_amount, 'Commission ' || new.commission_rate || '% on ' || new.order_number);
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update products p set stock = p.stock + oi.quantity, sold_count = greatest(p.sold_count - oi.quantity, 0)
      from order_items oi where oi.vendor_order_id = new.id and oi.product_id = p.id;
  end if;
  update orders o set status = case
    when not exists (select 1 from vendor_orders where order_id = o.id and status not in ('delivered','cancelled'))
      then case when exists (select 1 from vendor_orders where order_id = o.id and status = 'delivered') then 'completed' else 'cancelled' end
    else 'processing' end
  where o.id = new.order_id;
  return new;
end $$;
drop trigger if exists vendor_order_after_t on public.vendor_orders;
create trigger vendor_order_after_t after update of status on public.vendor_orders for each row execute function public.vendor_order_after();

-- ---------- HR ----------
create table if not exists public.employee_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, email text, phone text, department text, position text,
  joined_on date, status text not null default 'active' check (status in ('active','on_leave','left')),
  created_at timestamptz default now()
);
alter table public.employee_profiles enable row level security;
drop policy if exists "hr manage employees" on public.employee_profiles;
create policy "hr manage employees" on public.employee_profiles for all using (public.is_hr()) with check (public.is_hr());

-- ---------- trusted functions ----------
create or replace function public.start_vendor_application() returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  if public.my_role() = 'customer' then update profiles set role = 'applicant' where id = auth.uid(); end if;
  if public.my_role() <> 'applicant' then raise exception 'This account cannot apply as a vendor'; end if;
  insert into vendor_applications (user_id, email) select auth.uid(), email from profiles where id = auth.uid()
    on conflict (user_id) do nothing;
  select id into v from vendor_applications where user_id = auth.uid();
  return v;
end $$;

create or replace function public.decide_application(p_id uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare a record; v_rate numeric;
begin
  if not public.is_marketplace_staff() then raise exception 'Not allowed'; end if;
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
  if not public.is_marketplace_staff() then raise exception 'Not allowed'; end if;
  if p_status not in ('active','suspended') then raise exception 'Invalid status'; end if;
  update vendors set status = p_status where id = p_vendor;
  insert into audit_logs (actor, action, entity, details) values (auth.uid(), 'vendor_' || p_status, 'vendors', jsonb_build_object('id', p_vendor, 'note', p_note));
end $$;

create or replace function public.moderate_product(p_id uuid, p_status text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_marketplace_staff() then raise exception 'Not allowed'; end if;
  if p_status not in ('approved','rejected','disabled') then raise exception 'Invalid status'; end if;
  if p_status = 'rejected' and coalesce(trim(p_note), '') = '' then raise exception 'A reason is required'; end if;
  update products set status = p_status, rejection_note = case when p_status = 'approved' then null else p_note end where id = p_id;
  insert into audit_logs (actor, action, entity, details) values (auth.uid(), 'product_' || p_status, 'products', jsonb_build_object('id', p_id, 'note', p_note));
end $$;

create or replace function public.place_order(p_items jsonb, p_ship jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_order uuid; v_num text; v_item jsonb; p record; v_qty int; v_price numeric; v_vo uuid;
  v_fee numeric := coalesce((select value::numeric from platform_settings where key = 'delivery_fee_per_vendor'), 0);
  r record;
begin
  if v_uid is null then raise exception 'Please sign in'; end if;
  if public.my_role() <> 'customer' then raise exception 'Only buyer accounts can place orders'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty'; end if;
  if coalesce(trim(p_ship->>'name'), '') = '' or coalesce(trim(p_ship->>'phone'), '') = '' or coalesce(trim(p_ship->>'address'), '') = '' or coalesce(trim(p_ship->>'city'), '') = '' then
    raise exception 'Delivery details are incomplete'; end if;
  v_num := 'UM-' || nextval('order_seq');
  insert into orders (order_number, buyer_id, ship_name, ship_phone, ship_address, ship_city, notes)
  values (v_num, v_uid, p_ship->>'name', p_ship->>'phone', p_ship->>'address', p_ship->>'city', p_ship->>'notes') returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty < 1 or v_qty > 50 then raise exception 'Invalid quantity'; end if;
    select pr.*, v.store_name as vname, v.commission_rate as vrate, v.status as vstatus into p
      from products pr join vendors v on v.id = pr.vendor_id where pr.id = (v_item->>'id')::uuid for update of pr;
    if not found or p.status <> 'approved' or p.vstatus <> 'active' then raise exception 'A product in your cart is no longer available'; end if;
    if p.stock < v_qty then raise exception 'Not enough stock for %', p.name; end if;
    v_price := coalesce(p.sale_price, p.price);
    select id into v_vo from vendor_orders where order_id = v_order and vendor_id = p.vendor_id;
    if v_vo is null then
      insert into vendor_orders (order_id, vendor_id, order_number, delivery_fee, commission_rate, ship_name, ship_phone, ship_address, ship_city)
      values (v_order, p.vendor_id, v_num, v_fee, p.vrate, p_ship->>'name', p_ship->>'phone', p_ship->>'address', p_ship->>'city') returning id into v_vo;
    end if;
    insert into order_items (order_id, vendor_order_id, product_id, product_name, sku, vendor_name, image_url, unit_price, quantity, line_total)
    values (v_order, v_vo, p.id, p.name, p.sku, p.vname, p.image_urls[1], v_price, v_qty, v_price * v_qty);
    update products set stock = stock - v_qty, sold_count = sold_count + v_qty where id = p.id;
  end loop;

  for r in select vo.id, vo.commission_rate, sum(oi.line_total) as s from vendor_orders vo join order_items oi on oi.vendor_order_id = vo.id
           where vo.order_id = v_order group by vo.id, vo.commission_rate loop
    update vendor_orders set subtotal = r.s, commission_amount = round(r.s * r.commission_rate / 100, 2),
      vendor_payable = r.s - round(r.s * r.commission_rate / 100, 2) where id = r.id;
  end loop;
  update orders set subtotal = (select sum(subtotal) from vendor_orders where order_id = v_order),
    delivery_fee = (select sum(delivery_fee) from vendor_orders where order_id = v_order),
    total = (select sum(subtotal + delivery_fee) from vendor_orders where order_id = v_order) where id = v_order;
  return v_order;
end $$;

create or replace function public.marketplace_summary() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() not in ('ceo','co_ceo','central_admin','finance_manager') then raise exception 'Not allowed'; end if;
  return jsonb_build_object(
    'vendors', (select count(*) from vendors where status = 'active'),
    'pending_applications', (select count(*) from vendor_applications where status = 'under_review'),
    'products', (select count(*) from products where status = 'approved'),
    'orders', (select count(*) from orders),
    'gross_sales', (select coalesce(sum(subtotal), 0) from vendor_orders where status = 'delivered'),
    'commission', (select coalesce(sum(commission_amount), 0) from vendor_orders where status = 'delivered'),
    'vendor_payable', (select coalesce(sum(amount), 0) from vendor_ledger_entries));
end $$;

create or replace function public.vendor_balances() returns table (vendor_id uuid, store_name text, commission_rate numeric, balance numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_finance() then raise exception 'Not allowed'; end if;
  return query select v.id, v.store_name, v.commission_rate, coalesce(sum(l.amount), 0)
    from vendors v left join vendor_ledger_entries l on l.vendor_id = v.id group by v.id order by v.store_name;
end $$;

create or replace function public.set_user_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() not in ('ceo','co_ceo','it_manager') then raise exception 'Not allowed'; end if;
  if p_role not in ('customer','marketplace_head','marketplace_staff','central_admin','finance_manager','hr_manager','it_manager','co_ceo','ceo') then raise exception 'Invalid role'; end if;
  if p_role in ('ceo','co_ceo') and public.my_role() <> 'ceo' then raise exception 'Only the CEO can assign this role'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own role'; end if;
  update profiles set role = p_role where id = p_user;
  insert into audit_logs (actor, action, entity, details) values (auth.uid(), 'set_role', 'profiles', jsonb_build_object('user', p_user, 'role', p_role));
end $$;

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('product-images','product-images',true), ('vendor-documents','vendor-documents',false)
on conflict (id) do nothing;
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "own folder upload images" on storage.objects;
create policy "own folder upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own folder modify images" on storage.objects;
create policy "own folder modify images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own folder delete images" on storage.objects;
create policy "own folder delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own folder upload docs" on storage.objects;
create policy "own folder upload docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'vendor-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own or staff read docs" on storage.objects;
create policy "own or staff read docs" on storage.objects for select to authenticated
  using (bucket_id = 'vendor-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_marketplace_staff()));

-- ---------- make first marketplace head (after they sign up at /marketplace/login) ----------
-- update public.profiles set role = 'marketplace_head' where email = 'head@example.com';
