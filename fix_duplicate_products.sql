-- Uniya v0.4.3 duplicate cleanup
-- Run this ONCE in Supabase SQL Editor if products doubled.

-- 1) Remove exact duplicate products, keeping the oldest row.
-- This groups by the visible product fields, so it will NOT delete products with different names/details.
with ranked as (
  select id,
         row_number() over (
           partition by lower(trim(name)), lower(trim(coalesce(origin,''))), price, lower(trim(coalesce(unit,''))), lower(trim(coalesce(tag,''))), lower(trim(coalesce(description,'')))
           order by created_at asc, id asc
         ) as rn
  from public.products
)
delete from public.products p
using ranked r
where p.id = r.id and r.rn > 1;

-- 2) Re-number display order after cleanup.
with ordered as (
  select id, row_number() over (order by sort_order nulls last, created_at asc, id asc) as new_order
  from public.products
)
update public.products p
set sort_order = ordered.new_order
from ordered
where p.id = ordered.id;

-- 3) IMPORTANT: do not keep re-running the old seed INSERT from older schema files.
-- v0.4.3 schema now seeds demo products only when the same product name does not already exist.
