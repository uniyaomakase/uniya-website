-- Uniya v0.4.5 product expansion update
-- Run once in Supabase > SQL Editor after uploading v0.4.5 files.

alter table public.products add column if not exists category text default '';
alter table public.products add column if not exists inventory_type text default 'number';
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists bundle_enabled boolean not null default false;
alter table public.products add column if not exists bundle_items jsonb not null default '[]'::jsonb;

-- Keep existing rows compatible
update public.products set inventory_type='number' where inventory_type is null;
update public.products set category='' where category is null;
update public.products set bundle_items='[]'::jsonb where bundle_items is null;

-- Optional helpful unique index to avoid duplicate imports by exact product name.
create unique index if not exists products_unique_name_lower_idx on public.products (lower(trim(name)));
