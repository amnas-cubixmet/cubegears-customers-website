import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import handler from '../api/portal/[...path].js';
import { copy, niceDate } from '../src/i18n.js';

const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function mockResponse() {
  return {
    statusCode: 200, headers: {}, cookies: [], payload: null,
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; },
    end() { return this; },
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; return this; },
    appendHeader(key, value) { this.cookies.push([key, value]); return this; },
    send(value) { this.payload = Buffer.from(value); return this; },
  };
}
function makeReq(path = ['branding'], method = 'GET', host = 'garage.example.com') {
  return { method, headers: { host }, query: { path }, body: {}, socket: { remoteAddress: '127.0.0.1' } };
}
function env() {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.test';
  process.env.PORTAL_PROXY_SHARED_SECRET = 'customer-website-unit-test-secret-32chars';
}
test('customer browser content is filtered only within signed session response', () => {
  const app = file('src/App.jsx');
  assert.match(app, /const vehicles=data\.vehicles\|\|\[\]/);
  assert.match(app, /const allJobs=data\.jobs\|\|\[\]/);
  assert.match(app, /const jobs=allJobs\.filter/);
  assert.match(app, /const visibleVehicles=vehicles\.filter/);
  assert.match(app, /matchingJobIds\.has/);
  assert.match(app, /setSelected\('all'\);setQuery\(''\)/);
  assert.doesNotMatch(app, /getCustomers\(|\/customers\/\w+\/?\?/);
  assert.match(app, /catch\{\s*window\.history\.replaceState/);
});
test('Malayalam and English have customer record search labels', () => {
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
test('gateway rejects non-GET/POST, origin mismatch and malformed paths', async () => {
  env();
  const patch = mockResponse();
  await handler(makeReq(['session'], 'PATCH'), patch);
  assert.equal(patch.statusCode, 405);

  const host = mockResponse();
  await handler(makeReq(['session'], 'GET', 'example.com/evil'), host);
  assert.equal(host.statusCode, 400);

  const origin = mockResponse();
  const request = makeReq(['session'], 'POST');
  request.headers.origin = 'https://evil.example.net';
  await handler(request, origin);
  assert.equal(origin.statusCode, 403);

  const invalid = mockResponse();
  await handler(makeReq(['..'], 'GET'), invalid);
  assert.equal(invalid.statusCode, 404);
});
test('gateway HMAC-signs workshop hostname and preserves private cache headers', async () => {
  env();
  const originalFetch = globalThis.fetch;
  let got = null;
  globalThis.fetch = async (url, options) => {
    got = { url: String(url), options };
    return new Response(JSON.stringify({ publicName: 'Test Workshop' }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  };
  try {
    const response = mockResponse();
    await handler(makeReq(['branding']), response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['cache-control'], 'private, no-store');
    assert.equal(response.headers['referrer-policy'], 'no-referrer');
    assert.equal(got.url, 'https://api.example.test/api/v1/customer-website/branding');
    const h = got.options.headers;
    assert.equal(h['X-CG-Portal-Host'], 'garage.example.com');
    const expected = createHmac('sha256', process.env.PORTAL_PROXY_SHARED_SECRET)
      .update(h['X-CG-Portal-TS'] + ':garage.example.com').digest('hex');
    assert.equal(h['X-CG-Portal-Sig'], expected);
    assert.ok(!Object.keys(h).some(name => name.toLowerCase().includes('tenant-id')));
    assert.equal(JSON.parse(response.payload.toString()).publicName, 'Test Workshop');
  } finally { globalThis.fetch = originalFetch; }
});
test('gateway refuses production requests without server-side shared secret', async () => {
  const original = process.env.PORTAL_PROXY_SHARED_SECRET;
  delete process.env.PORTAL_PROXY_SHARED_SECRET;
  try {
    const response = mockResponse();
    await handler(makeReq(), response);
    assert.equal(response.statusCode, 503);
  } finally {
    if (original !== undefined) process.env.PORTAL_PROXY_SHARED_SECRET = original;
  }
});
