-- ============ Product variants (Size / Color / ... each with its own price) ============
-- Run AFTER marketplace.sql (and dashboard.sql). Safe to run more than once.
--
-- products.price / sale_price / stock stay as the "headline" values (lowest variant price,
-- total variant stock) — the vendor dashboard keeps them in sync — so the existing shop pages
-- continue to work unchanged.

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,                              -- e.g. "Large / Red"
  options jsonb not null default '{}'::jsonb,      -- e.g. {"Size":"Large","Color":"Red"}
  sku text,
  price numeric not null check (price >= 0),
  sale_price numeric check (sale_price >= 0),
  stock int not null default 0 check (stock >= 0),
  position int not null default 0,
  created_at timestamptz default now(),
  constraint variant_sale_lt_price check (sale_price is null or sale_price < price)
);
create index if not exists product_variants_product_idx on public.product_variants(product_id, position);
alter table public.product_variants enable row level security;

drop policy if exists "public read approved variants" on public.product_variants;
create policy "public read approved variants" on public.product_variants for select
  using (product_id in (select id from public.products where status = 'approved'
         and vendor_id in (select id from public.vendors where status = 'active')));

drop policy if exists "owner read variants" on public.product_variants;
create policy "owner read variants" on public.product_variants for select
  using (product_id in (select id from public.products where vendor_id = public.my_vendor_id()));

drop policy if exists "staff read variants" on public.product_variants;
create policy "staff read variants" on public.product_variants for select using (public.is_marketplace_staff());

drop policy if exists "owner insert variants" on public.product_variants;
create policy "owner insert variants" on public.product_variants for insert
  with check (product_id in (select id from public.products where vendor_id = public.my_vendor_id()));

drop policy if exists "owner update variants" on public.product_variants;
create policy "owner update variants" on public.product_variants for update
  using (product_id in (select id from public.products where vendor_id = public.my_vendor_id()))
  with check (product_id in (select id from public.products where vendor_id = public.my_vendor_id()));

drop policy if exists "owner delete variants" on public.product_variants;
create policy "owner delete variants" on public.product_variants for delete
  using (product_id in (select id from public.products where vendor_id = public.my_vendor_id()));

-- A live (approved) product goes back to review when a vendor changes anything about a variant
-- except its stock — same rule products already follow for name / price / images.
create or replace function public.variant_review_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid; content_changed boolean;
begin
  if not public.is_client_call() or public.is_marketplace_staff() then return coalesce(new, old); end if;
  if tg_op = 'INSERT' then pid := new.product_id; content_changed := true;
  elsif tg_op = 'DELETE' then pid := old.product_id; content_changed := true;
  else
    pid := new.product_id;
    content_changed := new.name is distinct from old.name or new.price is distinct from old.price
      or new.sale_price is distinct from old.sale_price or new.options is distinct from old.options;
  end if;
  if content_changed then
    update public.products set status = 'pending_review' where id = pid and status = 'approved';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists variant_review_guard_t on public.product_variants;
create trigger variant_review_guard_t after insert or update or delete on public.product_variants
  for each row execute function public.variant_review_guard();
