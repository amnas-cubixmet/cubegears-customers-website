import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { handlePortalRequest } from '../src/server/portalProxy.js';
import { copy, niceDate } from '../src/i18n.js';

const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function request(path = 'branding', options = {}) {
  const host = options.host || 'garage.cubegears.com';
  const method = options.method || 'GET';
  return new Request('https://' + host + '/api/portal/' + path, {
    method,
    headers: {
      host, ...(options.origin ? { origin: options.origin } : {}),
      ...(options.csrf ? { 'X-CG-CSRF': options.csrf } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: method === 'POST' ? JSON.stringify(options.body || {}) : undefined,
  });
}
function configure() {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.test';
  process.env.PORTAL_PROXY_SHARED_SECRET = 'customer-website-unit-test-secret-32chars';
}

test('Next.js App Router serves workshop website at the root and token page separately', () => {
  assert.match(file('package.json'), /"next": "16\.4\.5"/);
  assert.match(file('app/page.jsx'), /<App \/>/);
  assert.match(file('app/access/[token]/page.jsx'), /<App \/>/);
  assert.match(file('app/api/portal/[...path]/route.js'), /handlePortalRequest/);
  assert.match(file('src/App.jsx'), /'use client'/);
  assert.doesNotMatch(file('src/App.jsx'), /localStorage\.getItem\('cubegears:portal-language'\)===/);
});

test('customer data visible only after tenant-bound signed-session response', () => {
  const app = file('src/App.jsx');
  assert.match(app, /const vehicles=data\.vehicles\|\|\[\]/);
  assert.match(app, /const allJobs=data\.jobs\|\|\[\]/);
  assert.match(app, /const scopedJobs=allJobs\.filter/);
  assert.match(app, /const jobs=scopedJobs;/);
  assert.match(app, /matchingJobIds\.has/);
  assert.match(app, /const selected = vehicleId/);
  assert.match(app, /dashboardRoute\(session\?\.vehicles\|\|\[\],path\)/);
  assert.doesNotMatch(app, /getCustomers\(|\/customers\/\w+\/?\?/);
  assert.match(app, /window\.history\.replaceState/);
});

test('Malayalam and English portal filters remain present', () => {
  for (const locale of ['en', 'ml']) {
    assert.ok(copy[locale].searchRecords);
    assert.ok(copy[locale].searchPlaceholder);
    assert.ok(copy[locale].filterVehicle);
    assert.ok(copy[locale].reset);
  }
  assert.equal(niceDate('invalid', 'ml'), '—');
  assert.match(file('src/styles.css'), /\.portal-filters input/);
  assert.match(file('src/styles.css'), /font-size:16px/);
});

test('Next BFF rejects origin spoofing, malformed host, missing segments and wrong method', async () => {
  configure();
  assert.equal((await handlePortalRequest(request('session', { method: 'POST', origin: 'https://evil.example.net' }), ['session'])).status, 403);
  assert.equal((await handlePortalRequest(request('session', { host: 'example.com' }), ['..'])).status, 404);
  assert.equal((await handlePortalRequest(request('session'), [])).status, 404);
  const invalidHost = new Request('https://example.test/api/portal/session', { headers: { host: 'example.com/evil' } });
  assert.equal((await handlePortalRequest(invalidHost, ['session'])).status, 400);
});

test('Next BFF HMAC-signs the requested workshop host and never exposes tenant-id headers', async () => {
  configure();
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, options) => {
    sent = { url: String(url), options };
    return new Response(JSON.stringify({ publicName: 'Test Workshop' }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'set-cookie': 'cg_portal_csrf=abc; Path=/; SameSite=Lax' },
    });
  };
  try {
    const response = await handlePortalRequest(request('branding'), ['branding']);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(response.headers.get('set-cookie') || '', /cg_portal_csrf/);
    assert.equal(sent.url, 'https://api.example.test/api/v1/customer-website/branding');
    const h = sent.options.headers;
    assert.equal(h.get('X-CG-Portal-Host'), 'garage.cubegears.com');
    const ts = h.get('X-CG-Portal-TS');
    const expected = createHmac('sha256', process.env.PORTAL_PROXY_SHARED_SECRET)
      .update(ts + ':garage.cubegears.com').digest('hex');
    assert.equal(h.get('X-CG-Portal-Sig'), expected);
    assert.equal(h.has('X-CG-Portal-Tenant-ID'), false);
    assert.equal((await response.json()).publicName, 'Test Workshop');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Next BFF preserves CSRF and HttpOnly session cookies on POST', async () => {
  configure();
  const originalFetch = globalThis.fetch;
  let headers;
  globalThis.fetch = async (url, options) => {
    headers = options.headers;
    return new Response(JSON.stringify({ authenticated: true }), { status: 200 });
  };
  try {
    const response = await handlePortalRequest(request('session', {
      method: 'POST', origin: 'https://garage.cubegears.com', csrf: 'csrf-value',
      cookie: 'sessionid=secret; cg_portal_csrf=token', body: { token: 'securetoken' },
    }), ['session']);
    assert.equal(response.status, 200);
    assert.equal(headers.get('X-CG-CSRF'), 'csrf-value');
    assert.equal(headers.get('Cookie'), 'sessionid=secret; cg_portal_csrf=token');
  } finally { globalThis.fetch = originalFetch; }
});

test('Next BFF fails closed when production proxy secret is missing', async () => {
  configure();
  const oldSecret = process.env.PORTAL_PROXY_SHARED_SECRET;
  delete process.env.PORTAL_PROXY_SHARED_SECRET;
  try {
    const response = await handlePortalRequest(request('branding'), ['branding']);
    assert.equal(response.status, 503);
  } finally {
    process.env.PORTAL_PROXY_SHARED_SECRET = oldSecret;
  }
});
