# CubeGears — Branded Customer Website

Separate multilingual React/Vite Customer Website for CubeGears workshop tenants.

## New frontend

- One frontend for every workshop, using company branding returned by the backend.
- Responsive public page, workshop contact options, English/Malayalam.
- Passwordless access link at /access/{token}. React clears the link from the browser address immediately, then exchanges it for a server-side session.
- Private dashboard with vehicles, active jobs, timelines, service history, published inspection photos, approved estimates and invoices.
- Same-origin API gateway under /api/portal: Vite local proxy and Vercel Node function for production.
- The proxy signs the incoming hostname with a shared secret; the Django backend must verify the signature and resolve the tenant. Never derive tenant identity from a browser-provided company ID.
- Auth secrets are not saved in localStorage; only the harmless language preference is stored.

## Local setup

1. Install Node 20.19+ and run npm install.
2. Copy .env.example to .env.local.
3. Configure PORTAL_BACKEND_URL and a random 32+ character PORTAL_PROXY_SHARED_SECRET. Django must be configured with the same secret.
4. Start Django, apply its new migrations and set PORTAL_DEV_COMPANY_SLUG to an existing workshop slug (development only).
5. Run npm run dev and open http://localhost:5174.

## Production setup

Deploy this repository to Vercel as a Vite app. Build command: npm run build; output: dist.

Set CUBEGEARS_BACKEND_URL to an HTTPS Django backend and PORTAL_PROXY_SHARED_SECRET to the same secret used in Django. Do not use a VITE_ prefix for these secrets.

Use one dedicated Vercel project for this repository; it must NOT be the Company Panel, backend, or public marketing website. The Django backend controls project-domain assignments with server-only VERCEL_CUSTOMER_DOMAIN_TOKEN, VERCEL_CUSTOMER_PROJECT_ID and VERCEL_CUSTOMER_TEAM_ID. Domain records must come from Vercel's live API, never hardcoded in the frontend.

Add the `*.cubegears.com` wildcard to THIS project only if your actual DNS zone is delegated to Vercel nameservers. Changing nameservers must preserve MX/TXT/CAA and other existing records. Set CUSTOMER_PORTAL_ROOT_DOMAIN=cubegears.com on Django. Enable CUSTOMER_WEBSITE_LINKS_ENABLED=true only after the wildcard deployment and HTTPS are working. Existing staff panel links remain the fallback before this flag is enabled.

Workshop admins use `/settings/customer-website/domains` in the Company Panel: add domain, select registrar, copy exact A/CNAME/TXT records returned by Django from Vercel, verify ownership, verify DNS, wait for valid HTTPS, then select the primary domain. DNS changes at GoDaddy/Cloudflare/Hostinger/Namecheap are manual; the API never silently changes external DNS. The hostname is resolved by Django from the signed request, not from browser parameters.

Run `npm test` to validate signed custom-host routing and cross-origin protection.

## Backend contract

- GET /api/v1/customer-website/branding — public workshop branding; sets CSRF cookie.
- POST /api/v1/customer-website/session with token — creates tenant/customer-bound HttpOnly session.
- GET /api/v1/customer-website/session — scoped customer, vehicles, jobs, approved estimates, published invoices and photos.
- POST /api/v1/customer-website/logout — revokes local browser session.
- GET /api/v1/customer-website/logo and /photos/{id} — allowlisted tenant resources only.

All customer endpoints must verify the proxy HMAC hostname, enforce rate limits and isolation, prevent session replay after link revocation, use Secure/SameSite cookies and no-store responses.

### Activation safety

No workshop hostname is served until its server-side domain record is approved and marked active after Vercel ownership, DNS and HTTPS checks. The default wildcard tenant host continues to resolve independently. Domain assignment and SSL checks do not automatically create or configure third-party DNS records. Do not expose the shared proxy secret or Vercel API token in any `VITE_` environment variable. Verify DNS, TLS, company isolation and a real customer magic link on staging before using production domains.
