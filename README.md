# Uniya Website v0.3

Custom starter website for Uniya — Bring Omakase to Home.

## Included
- Customer homepage
- Product catalogue
- Cart and order form
- Fixed delivery / ship-out days: Wednesday and Saturday
- Local delivery and cold shipping option
- Admin/builder page
- Product add/edit/delete
- Product image URL support
- Site text/pricing/settings editor
- Demo order saving
- Export orders CSV
- Export supplier purchase list CSV
- Driver route preview with Google Maps links
- Stripe checkout URL placeholder

## Run locally
```bash
npm install
npm run dev
```
Open the URL shown in Terminal, usually:
```bash
http://localhost:5173
```

## Admin page
Click Admin in the header, or go to:
```bash
/#admin
```
Demo password:
```bash
123456
```
Change this before real launch.

## Build for hosting
```bash
npm run build
```
The static website will be generated in:
```bash
dist/
```

## Deploy recommendation
Upload the project to GitHub and connect it to Vercel.
Vercel build command:
```bash
npm run build
```
Vercel output directory:
```bash
dist
```

## Important limitation in v0.3
This version stores products/orders in browser localStorage for testing only.
That means data is saved on the same browser/computer only.

Next version should connect to Supabase or another database so admin changes and orders are shared across all computers.

## Next versions
v0.4:
- Real database with Supabase
- Admin authentication
- Product image upload instead of image URL

v0.5:
- Real Stripe checkout session
- Paid/unpaid order status

v0.6:
- Delivery route manager
- Driver mobile page
- SMS templates
