# Uniya Website v0.5.4

v0.5.4 upgrades the site from browser-only local storage to a real Supabase database.

## What is included

- Public homepage and product catalogue
- Cart and order form
- Fixed Wednesday / Saturday delivery or ship-out dates
- Local delivery + cold shipping
- Supabase product database
- Supabase order database
- Admin login through Supabase Auth
- Product add/edit/delete
- Product image upload through Supabase Storage
- Site settings editor
- Order CSV export
- Supplier list CSV export
- Driver route preview with Google Maps links

## 1. Create Supabase project

1. Go to Supabase and create a new project.
2. Open SQL Editor.
3. Copy and run all SQL from `supabase_schema.sql`.

## 2. Create admin user

1. In Supabase, go to Authentication > Users.
2. Click Add user.
3. Create your admin email and password.
4. Copy the user's UUID.
5. Go back to SQL Editor and run:

```sql
insert into public.admin_profiles(user_id)
values ('PASTE-YOUR-AUTH-USER-UUID-HERE');
```

Only users in `admin_profiles` can edit products/settings and view orders.

## 3. Add Vercel Environment Variables

In Vercel project:

Settings > Environment Variables

Add:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

You can find both in Supabase:

Project Settings > API

Use the Project URL and anon public key.

## 4. Deploy

Upload this full v0.5.4 folder to GitHub, replacing the v0.3 files, then Vercel will redeploy automatically.

Or run locally:

```bash
npm install
npm run dev
```

## 5. Admin page

Open:

```text
https://your-vercel-site.vercel.app/#admin
```

Login with the Supabase Auth user you created.

## Important notes

- v0.5.4 does not process payment yet.
- Stripe checkout will be v0.5.
- Delivery routing is preview only. Full route optimization and driver status will be later.
- Product edits are now saved in Supabase and shared across devices.


## v0.5.4.2 updates
- Admin > Site Settings: upload/change the main page hero photo.
- Admin > Products: drag product cards up/down to change website display order. The order is saved to `products.sort_order` in Supabase.
- `supabase_schema.sql` now includes `hero_image_url`; rerun the SQL in Supabase SQL Editor if your database was created with an older version.


## v0.5.4 changes
- Fixed CSV import: visible status, UTF-8/BOM handling, success/error alerts.
- Added paste box for Airmart __NEXT_DATA__ so you do not need to create a file.
- Added Airmart URL fetch attempt; if Airmart blocks browser fetch, use the paste/upload method.
