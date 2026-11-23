# cubixgear — Next.js Customer Website

A dedicated **Next.js 16 App Router** customer-facing website for every cubixgear workshop. This project replaces the Vite standalone customer site and is **not hosted inside the Company Panel**.

## Default workshop subdomain routing

- `https://<workshop>.customer.cubixgear.tech/` — public branded workshop homepage (subject to verified wildcard DNS and HTTPS).
- `https://<workshop>.customer.cubixgear.tech/access/<secure-token>` — a customer's private, login-less service tracking link.
- The token is exchanged for a session using the same-origin backend gateway and promptly removed from the visible browser URL.
- `/api/portal/*` — **Next.js server route handlers** proxy only supported customer website endpoints to Django. The hostname is signed with an HMAC secret that is **never exposed to the browser**.

The Django backend is the authoritative source for tenant routing and private customer sessions. All customer records are private. Opening a workshop's root domain without a valid session renders **public workshop information only**, never a customer's records.

## Local development

1. Install Node.js **22+**.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `PORTAL_BACKEND_URL=http://127.0.0.1:8000` and a random `PORTAL_PROXY_SHARED_SECRET` of at least 32 characters, matching Django's value.
5. Configure Django with `DEBUG=true` and `PORTAL_DEV_COMPANY_SLUG=<existing-workshop-slug>` for local host mapping.
6. Run `npm run dev -- -p 5174` and open `http://localhost:5174/` (or choose a different port).

The Customer Website port is **not hard-coded in the application**.
Run `npm run dev -- -p 5174` for the examples below or
`npm run dev -- -p 5414` if your machine uses port 5414.
Keep the Company Panel `VITE_CUSTOMER_WEBSITE_DEV_ORIGIN` and Django
`CUSTOMER_PORTAL_BASE_URL` values aligned with that selected port.
Production hosting uses the configured HTTPS platform root, never localhost.

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
   `.env.local`; run `npm install && npm run dev -- -p 5174` (Node 22+).
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

## Private /access links in local development

The Next.js client exchanges the generated `/access/<token>` capability on the
same workshop hostname after loading workshop branding. The token is kept in
memory through React Strict Mode effect replays and the visible URL is
immediately scrubbed; the secure session lives in an HttpOnly browser cookie.

If a tracking link fails:

1. Check the workshop root homepage and `/api/portal/branding` on the **same**
   `<workshop>.localhost:5174` hostname. Branding should return 200; a
   successful unauthenticated `/api/portal/session` GET should return 401.
2. In browser Developer Tools → Network, inspect the *status codes only* of
   `/api/portal/branding`, POST `/api/portal/session`, and subsequent GET
   `/api/portal/session`. Do **not** copy or share the POST request body,
   `Set-Cookie`, CSRF headers, or full access URL.
3. If branding is 404, confirm that the saved subdomain is assigned to the
   active workshop in the **same Django database** used by the customer site.
   If exchange is 403, confirm the same 32+ character
   `PORTAL_PROXY_SHARED_SECRET` is set in both services and development
   session cookies are not marked Secure on plain HTTP.
4. If exchange is 404, the access record may be revoked, rotated, inactive
   or issued with a different `CUSTOMER_PORTAL_SIGNING_KEY` (which defaults
   to Django's `DJANGO_SECRET_KEY`). Use Company Panel → Customer Details →
   Tracking Link → Regenerate to issue a new secure URL.
5. If exchange is 200 but session GET is 401, check that the browser accepts
   same-site HttpOnly session cookies, that the backend database session
   migrations are applied, and that both requests use the same hostname.

Do not log or paste raw bearer tokens or browser cookies into issue reports.
A localhost link only works on the machine hosting the website; real
customers require a deployed HTTPS hostname.

## Production (default workshop subdomains only)

Deploy one Next.js Customer Website app, separate from the Company Panel,
Django backend and marketing site. Configure a wildcard for your registered,
platform-owned root (`*.customer.cubixgear.tech` for CubixGear) with valid production DNS and HTTPS.

Configure `CUSTOMER_PORTAL_ROOT_DOMAIN` on both Django and Next.js with the
**same platform root**. Set `CUSTOMER_WEBSITE_LINKS_ENABLED=true` on Django
only after end-to-end wildcard DNS, TLS and portal proxy verification.

The Next.js server-only runtime needs:

- `CUBEGEARS_BACKEND_URL=https://api.cubixgear.tech` (origin only)
- `PORTAL_PROXY_SHARED_SECRET=<same 32+ char secret as Django>`
- `CUSTOMER_PORTAL_ROOT_DOMAIN=customer.cubixgear.tech`

### DNS and release checks

For the existing reverse proxy deployment, add one `A` record named `*.customer`
in the `cubixgear.tech` zone with the verified customer edge IPv4 address. Add
an `AAAA` record only if the same edge serves IPv6. Obtain a certificate for
`*.customer.cubixgear.tech` using DNS-01 with automatic renewal. An apex
certificate for `*.cubixgear.tech` does not cover these hosts. Configure the edge
to route the nested wildcard to the existing private Next.js listener.

Forward the actual `Host` header to Next.js and overwrite any incoming
`X-Real-IP` with the client IP determined by the trusted edge. Set
`PORTAL_TRUST_PROXY_CLIENT_IP=true` only when the Next.js listener is private
and its reverse proxy performs that overwrite. Leave `USE_X_FORWARDED_HOST`
disabled on Django. The API edge must overwrite `X-Forwarded-Proto` with the
TLS scheme before proxying to the private Django listener.

For **Vercel hosting**, attach `*.customer.cubixgear.tech` to the **one**
Customer Website project. Vercel wildcard domains require the **nameserver
method** so Vercel can complete DNS-01 challenges and renew TLS certificates.
A wildcard CNAME alone, or delegating only `_acme-challenge`, is **not**
a supported substitute. Follow the exact nameservers Vercel displays.
If the `cubixgear.tech` apex DNS must remain elsewhere, assess delegating
the `customer.cubixgear.tech` DNS zone to Vercel rather than switching the
entire apex; preserve existing mail/API/app DNS and verify the delegation with
your DNS provider and Vercel first. Alternatively retain the existing reverse
proxy plus separately managed wildcard DNS-01 certificate described above.
Confirm the Vercel project serves the intended Git commit and that its plan
allows the intended commercial deployment.

Before enabling link issuance, verify an existing workshop hostname resolves
with a valid matching TLS certificate. `/api/portal/branding` must return
200 for that workshop and 404 for an unknown workshop. `/api/portal/session`
must return 401 before an access link is redeemed. In a test workshop, redeem
a generated link and verify that the dashboard, invoice and vehicle views
display that customer's records. Confirm a link used on a different workshop
hostname fails. Keep access tokens out of request logs, screenshots and shell history.

Do not expose the proxy secret or customer access tokens to the browser.
Only registered `<workshop-label>.<platform-root>` hostnames resolve to an
active workshop. Unknown or custom external hostnames are denied. Secure
tracking links still require a valid, revocable customer-specific access token;
a public workshop homepage does not expose private customer records.

Workshop owners can change their **Default Website Subdomain** under
Company Panel → Settings → Customer Website. The change only modifies
their public label; existing private tracking links should be sent again.
No per-workshop domain purchase, Vercel custom-domain registration,
DNS TXT verification or custom-domain approval workflow is supported.

Run `npm test` to validate default workshop hostname signatures and
cross-origin protection before deployment. After DNS, SSL, Django and Vercel
environments are configured, run
`npm run verify:portal -- <existing-workshop>.customer.cubixgear.tech`.
This checks the public branding response, unauthenticated private-session
response, and denial of an unknown workshop hostname without using customer
access tokens. It cannot prove a specific customer's authenticated workflow;
complete that check manually with a test customer. A successful command does
not itself verify Vercel project settings or database migration state.

## Safe fictional demo data

The separate routes `/demo` (sample public workshop website) and
`/demo/portal` (sample customer tracking dashboard) display **fictional**
vehicles, job cards, invoice figures and illustrative SVG vehicle pictures.

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
