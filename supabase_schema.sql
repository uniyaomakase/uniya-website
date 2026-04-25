-- Uniya v0.4.3 Supabase setup / repair
-- Run this in Supabase > SQL Editor. Safe to rerun.
-- Fixes: duplicate default products, product ordering, product photo delete policy, main page photo field.

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id text primary key default 'main',
  brand_name text not null default 'Uniya',
  motto text not null default 'Bring Omakase to Home',
  hero_title text not null default 'Bring Omakase to Home',
  hero_text text not null default 'Premium uni, sashimi-grade seafood, and Japanese delicacies imported directly from Japan. Order online for Wednesday or Saturday local delivery, or cold-chain shipping.',
  delivery_days int[] not null default array[3,6],
  local_delivery_fee numeric not null default 15,
  shipping_fee numeric not null default 35,
  contact_email text default 'sales@uniya.com',
  hero_image_url text default 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1200&auto=format&fit=crop',
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default true,
  name text not null,
  origin text default '',
  price numeric not null default 0,
  unit text default '',
  tag text default '',
  inventory int default 0,
  description text default '',
  sort_order int default 999,
  image_fit text default 'contain',
  image_zoom int default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int default 1,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text not null default 'new',
  fulfillment text not null check (fulfillment in ('local','shipping')),
  requested_date date not null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  customer_address text not null,
  notes text,
  subtotal numeric not null default 0,
  fee numeric not null default 0,
  total numeric not null default 0
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  unit_price numeric not null default 0,
  unit text,
  qty int not null default 1,
  line_total numeric not null default 0
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.site_settings add column if not exists hero_image_url text default 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1200&auto=format&fit=crop';
alter table public.products add column if not exists sort_order int default 999;
alter table public.products add column if not exists image_fit text default 'contain';
alter table public.products add column if not exists image_zoom int default 100;

insert into public.site_settings(id) values('main') on conflict(id) do nothing;

-- Remove duplicated products created by rerunning older SQL.
-- Keeps the oldest product row for each identical product name.
with ranked as (
  select id, row_number() over (partition by lower(trim(name)) order by created_at asc, id asc) rn
  from public.products
)
delete from public.products p
using ranked r
where p.id = r.id and r.rn > 1;

-- Only seed demo products if they do not already exist.
insert into public.products(name,origin,price,unit,tag,inventory,description,sort_order)
select 'Premium Japanese Uni Tray','Japan',128,'250g tray','Best Seller',20,'Sweet, creamy omakase-grade sea urchin imported directly from Japan.',1
where not exists (select 1 from public.products where lower(trim(name))=lower('Premium Japanese Uni Tray'));
insert into public.products(name,origin,price,unit,tag,inventory,description,sort_order)
select 'Bluefin Otoro Block','Japan / Toyosu Market',98,'per pack','Sashimi Grade',15,'Rich fatty tuna belly for DIY sashimi, sushi, or omakase dinner at home.',2
where not exists (select 1 from public.products where lower(trim(name))=lower('Bluefin Otoro Block'));
insert into public.products(name,origin,price,unit,tag,inventory,description,sort_order)
select 'Japanese Ikura','Hokkaido',58,'250g jar','Limited',30,'Bright, savory salmon roe. Perfect for rice bowls and hand rolls.',3
where not exists (select 1 from public.products where lower(trim(name))=lower('Japanese Ikura'));

-- Seed one demo image per demo product only if no image exists for that product.
insert into public.product_images(product_id,image_url,sort_order)
select p.id, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1200&auto=format&fit=crop', 1
from public.products p where p.name='Premium Japanese Uni Tray' and not exists(select 1 from public.product_images i where i.product_id=p.id);
insert into public.product_images(product_id,image_url,sort_order)
select p.id, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?q=80&w=1200&auto=format&fit=crop', 1
from public.products p where p.name='Bluefin Otoro Block' and not exists(select 1 from public.product_images i where i.product_id=p.id);
insert into public.product_images(product_id,image_url,sort_order)
select p.id, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1200&auto=format&fit=crop', 1
from public.products p where p.name='Japanese Ikura' and not exists(select 1 from public.product_images i where i.product_id=p.id);

-- Storage bucket for product and hero image uploads.
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_profiles enable row level security;

create or replace function public.is_admin() returns boolean language sql security definer as $$
  select exists(select 1 from public.admin_profiles where user_id = auth.uid());
$$;

DO $$ DECLARE r record; BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('site_settings','products','product_images','orders','order_items','admin_profiles')) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Admin upload product images" on storage.objects;
drop policy if exists "Admin update product images" on storage.objects;
drop policy if exists "Admin delete product images" on storage.objects;

create policy "Public read settings" on public.site_settings for select using (true);
create policy "Admin update settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read active products" on public.products for select using (active = true or public.is_admin());
create policy "Admin manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read product images" on public.product_images for select using (true);
create policy "Admin manage product images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone create orders" on public.orders for insert with check (true);
create policy "Admin read orders" on public.orders for select using (public.is_admin());
create policy "Admin update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());

create policy "Anyone create order items" on public.order_items for insert with check (true);
create policy "Admin read order items" on public.order_items for select using (public.is_admin());

create policy "Admin read admin_profiles" on public.admin_profiles for select using (public.is_admin());

create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admin update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- AFTER creating a Supabase Auth user, add that user's UUID here:
-- insert into public.admin_profiles(user_id) values ('PASTE-YOUR-AUTH-USER-UUID-HERE');
