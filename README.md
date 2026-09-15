# Nagorik Hub — V5

Citizen information website for Bangladesh.

## V5 fixes

### Market prices
Priority:
1. **DAM official daily data**
2. **Retail fallback source** when DAM does not have a product
3. Source + update date are shown on every price card

The site keeps a safe static fallback so it does not break if an external source is temporarily unavailable.

### Daily automation
GitHub Actions runs `scripts/update_prices.py` every day and updates `js/live-data.js`.

To test manually:
```bash
python scripts/update_prices.py
```

The workflow can also be started manually from GitHub Actions.

### Bus fare
- From → To district/city search
- Verified BRTA Non-AC route fares
- AC fare shown only when verified operator data exists
- **S-Chair is removed from the bus fare UI**
- Unknown routes do not get invented fares

## Important
A static GitHub Pages website cannot directly scrape external sites every time a visitor opens it. The daily GitHub Action is therefore the automation layer: it fetches data, writes `js/live-data.js`, commits the update, and GitHub Pages serves the new data.

Backup retailer adapters should only be enabled when their public data format is stable and can be verified. Never label a retailer price as DAM.


## V6 Bus Fare update
- AC / Non-AC / S-Chair removed from the Bus Fare UI.
- From/To supports all 64 district suggestions.
- Route result: distance, approximate time, local/minibus fare, coach/gate-lock fare.
- Approximate-fare disclaimer is shown on the page and on results.
- Route data in `js/bus-routes.js` is transcribed from the user-provided `bus vara.txt`.
- Missing routes show unavailable instead of invented values.
- BRTA route-permit context: https://bsp.brta.gov.bd/bsp/routePermit?lan=bn

## V11 — Secure Admin Login

1. Create a Supabase project.
2. In `supabase/config.js`, set `NAGORIK_SUPABASE_URL` and the browser-safe anon/publishable key.
3. Run `supabase/schema.sql` in Supabase SQL Editor.
4. In Supabase Authentication > Users, create the first admin user with email/password.
5. Copy that user's UUID and run `insert into public.admin_users(user_id) values ('USER-UUID-HERE');` in SQL Editor.
6. Open `admin-login.html` and sign in. `admin.html` checks the authenticated session and admin role before showing the panel.
7. Password reset uses Supabase Auth email recovery.

Important: this browser app must never contain a Supabase `service_role` key or an OpenAI API key. For production approval/publishing, keep privileged operations behind server-side authorization/RLS.
