-- Run once in Supabase SQL Editor for v0.4.4 product photo rotation/resize controls.
alter table public.products add column if not exists image_fit text default 'contain';
alter table public.products add column if not exists image_zoom int default 100;

-- Default all existing products to fit the full photo without cutting.
update public.products set image_fit = coalesce(image_fit, 'contain'), image_zoom = coalesce(image_zoom, 100);
