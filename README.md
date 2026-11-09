# cubixgear — Next.js Customer Website

A dedicated **Next.js 16 App Router** customer-facing website for every cubixgear workshop. This project replaces the Vite standalone customer site and is **not hosted inside the Company Panel**.

## Domain-first routing

- `https://<workshop>.cubegears.com/` — public branded workshop homepage (subject to verified wildcard DNS/TLS).
- `https://<verified-custom-domain>/` — the same workshop public homepage.
- `https://<workshop-domain>/access/<secure-token>` — a customer's private, login-less service tracking link.
- The token is exchanged for a session using the same-origin backend gateway and promptly removed from the visible browser URL.
- `/api/portal/*` — **Next.js server route handlers** proxy only supported customer website endpoints to Django. The hostname is signed with an HMAC secret that is **never exposed to the browser**.

The Django backend is the authoritative source for tenant routing, customer session data and domain approvals. All customer records are private. Opening a workshop's root domain without a valid session renders **public workshop information only**, never a customer's records.

## Local development

1. Install Node.js **22+**.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `PORTAL_BACKEND_URL=http://127.0.0.1:8000` and a random `PORTAL_PROXY_SHARED_SECRET` of at least 32 characters, matching Django's value.
5. Configure Django with `DEBUG=true` and `PORTAL_DEV_COMPANY_SLUG=<existing-workshop-slug>` for local host mapping.
6. Run `npm run dev` and open `http://localhost:5174/`.

The public homepage must render under `/`. Private links are under `/access/<token>`. Django must have valid database migrations and workshop configuration.

## Workshop-specific local public link (e.g. myworkshop.localhost)

The workshop public website is at `http://myworkshop.localhost:5174/`;
the same workshop's private customer dashboard is reachable only with its own
`http://myworkshop.localhost:5174/access/<secure-token>` link.

1. Run the Django backend locally with `DJANGO_DEBUG=True`, a migrated database
   and a registered **active workshop**.
2. In the Company Panel, open **Settings → Customer Website** and set the
   **Default Website Subdomain** to `myworkshop`. Save the value; this must be
   assigned to the workshop in Django. The name is not a demo toggle.
3. Set Django's `PORTAL_PROXY_SHARED_SECRET` to a random 32+ character value
   and set the same secret in Customer Website `.env.local`. For local
   development configure `CUSTOMER_PORTAL_BASE_URL=http://localhost:5174/access`
   and leave `CUSTOMER_WEBSITE_LINKS_ENABLED=false` until production DNS/TLS is
   ready.
4. Set `PORTAL_BACKEND_URL=http://127.0.0.1:8000` in the Customer Website
   `.env.local`; run `npm install && npm run dev` (Node 22+).
5. Open `http://myworkshop.localhost:5174/`. It displays **public workshop
   branding and contact details only**, not private customer records.
   Open the Company Panel Customer Details → Customer Tracking Portal to get
   a tenant-bound secure customer URL. The generated link uses
   `myworkshop.localhost:5174/access/...` in local DEBUG mode.

The new `next.config.mjs` permits `*.localhost` for development assets
only; it does **not** allow arbitrary remote origins or bypass Django tenant
verification. The development link is only reachable on the machine running
the local Next.js service, not a public internet link. For a static fictional
preview without database data use `http://localhost:5174/demo` instead.

If the public homepage says "Website not found", make sure the requested
subdomain exactly matches the saved label for an active Django workshop.
If it says "Portal backend is not configured", verify the matching
`PORTAL_PROXY_SHARED_SECRET` and `PORTAL_BACKEND_URL` values.


## Real workshop hero photograph and favicon

The public workshop homepage uses a real car-service photo by
[Jimmy Nilsson Masth on Unsplash](https://unsplash.com/photos/a-man-working-on-a-car-in-a-garage-jL9zfzTVSwY).
The image is an **illustrative automotive service photograph**, not a photo of
any specific tenant's premises. It is served from the Unsplash image CDN under
the [Unsplash License](https://unsplash.com/license).

Next.js serves `app/icon.svg` as the default cubixgear favicon. Once a
workshop's branding loads, the customer website uses that workshop's uploaded
logo as the tab icon where available; otherwise it retains the bundled icon.
The logo comes from the existing hostname-scoped `/api/portal/logo` route.
Both desktop and mobile render the photograph; no customer data is included.

## Production (Vercel)

Use one dedicated Vercel project for this repository; it must NOT be the Company Panel, backend, or public marketing website. The Django backend controls project-domain assignments with server-only VERCEL_CUSTOMER_DOMAIN_TOKEN, VERCEL_CUSTOMER_PROJECT_ID and VERCEL_CUSTOMER_TEAM_ID. Domain records must come from Vercel's live API, never hardcoded in the frontend.

Add the `*.cubegears.com` wildcard to THIS project only if your actual DNS zone is delegated to Vercel nameservers. Changing nameservers must preserve MX/TXT/CAA and other existing records. Set CUSTOMER_PORTAL_ROOT_DOMAIN=cubegears.com on Django. Enable CUSTOMER_WEBSITE_LINKS_ENABLED=true only after the wildcard deployment and HTTPS are working. Existing staff panel links remain the fallback before this flag is enabled.

Workshop admins use `/settings/customer-website/domains` in the Company Panel: add domain, select registrar, copy exact A/CNAME/TXT records returned by Django from Vercel, verify ownership, verify DNS, wait for valid HTTPS, then select the primary domain. DNS changes at GoDaddy/Cloudflare/Hostinger/Namecheap are manual; the API never silently changes external DNS. The hostname is resolved by Django from the signed request, not from browser parameters.

Run `npm test` to validate signed custom-host routing and cross-origin protection.

Set production runtime secrets:
- `CUBEGEARS_BACKEND_URL=https://<your HTTPS Django API host>`
- `PORTAL_PROXY_SHARED_SECRET=<strong 32+ character secret shared with Django>`

On Django:
- `PORTAL_PROXY_SHARED_SECRET` must match.
- `CUSTOMER_PORTAL_ROOT_DOMAIN` should be the actual platform domain with configured wildcard DNS/TLS.
- `CUSTOMER_WEBSITE_LINKS_ENABLED=true` only after wildcard domain deployment works.
- Configure `VERCEL_CUSTOMER_DOMAIN_TOKEN`, project and team identifiers **on Django**, only for the existing domain management integration.

Add wildcard workshop subdomains and verified workshop custom domains to the **same customer website deployment**. Use the **Company Panel → Customer Website → Domains** flow to request, verify and select the primary custom domain; do not invent DNS verification, SSL status or record values.

### Activation safety

No workshop hostname is served until its server-side domain record is approved and marked active after Vercel ownership, DNS and HTTPS checks. The default wildcard tenant host continues to resolve independently. Domain assignment and SSL checks do not automatically create or configure third-party DNS records. Do not expose the shared proxy secret or Vercel API token in any `VITE_` environment variable. Verify DNS, TLS, company isolation and a real customer magic link on staging before using production domains.

## Safe fictional demo data

The separate routes `/demo` (sample public workshop website) and
`/demo/portal` (sample customer tracking dashboard) display **fictional**
vehicles, job cards, invoice/estimate figures and illustrative SVG vehicle pictures.

- In local development, open `http://localhost:5174/demo`.
- In production, set `CUBEGEARS_DEMO_ENABLED=true` on the **Customer Website Vercel project**
  to opt into the demo routes. Without it, both demo pages return 404.
- Every demo page displays a prominent **DEMO PREVIEW** notice. Example phone
  numbers, real customer identities and real payment actions are not included.
- Demo pages never call the Django customer API, never create customer sessions,
  never alter stock/payments, and never expose existing customer records.
- The normal `/` workshop homepage and `/access/<token>` customer website still
  require authentic Django data and are unaffected.
- To disable the demonstration, remove the environment flag and redeploy.
