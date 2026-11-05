# CubeGears — Next.js Customer Website

A dedicated **Next.js 16 App Router** customer-facing website for every CubeGears workshop. This project replaces the Vite standalone customer site and is **not hosted inside the Company Panel**.

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

## Production (Vercel)

Deploy **this repository** as a Next.js project using the built-in **Next.js framework preset**; no `dist` output directory or Vite rewrite is needed.

Set production runtime secrets:
- `CUBEGEARS_BACKEND_URL=https://<your HTTPS Django API host>`
- `PORTAL_PROXY_SHARED_SECRET=<strong 32+ character secret shared with Django>`

On Django:
- `PORTAL_PROXY_SHARED_SECRET` must match.
- `CUSTOMER_PORTAL_ROOT_DOMAIN` should be the actual platform domain with configured wildcard DNS/TLS.
- `CUSTOMER_WEBSITE_LINKS_ENABLED=true` only after wildcard domain deployment works.
- Configure `VERCEL_CUSTOMER_DOMAIN_TOKEN`, project and team identifiers **on Django**, only for the existing domain management integration.

Add wildcard workshop subdomains and verified workshop custom domains to the **same customer website deployment**. Use the **Company Panel → Customer Website → Domains** flow to request, verify and select the primary custom domain; do not invent DNS verification, SSL status or record values.

## Backend API contract

- `GET /api/v1/customer-website/branding` — per-host public branding and CSRF cookie.
- `POST /api/v1/customer-website/session` with token — customer-bound HttpOnly browser session.
- `GET /api/v1/customer-website/session` — only this customer's vehicle, job, invoice, approved estimate and intentionally published photo data.
- `POST /api/v1/customer-website/logout` — close session.
- `GET /api/v1/customer-website/logo`, `/photos/{id}` — allowed tenant media.

No public customer lookup, customer IDs or admin credentials are exposed. Hostnames are authenticated by the server BFF, then checked by Django against active and verified domains.

## Verification

Run `npm test` and `npm run build`; GitHub Actions checks `.next/BUILD_ID`.

Verify workshop root and customer access routes on your actual deployed domain, including HTTPS, DNS verification, session cookies, tenant isolation, mobile layout, Malayalam/English toggle and link revocation.

**Deployment and domain activation require configured credentials and real Vercel/DNS confirmation; a GitHub commit alone does not activate a live custom domain.**
