import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handlePortalRequest } from '../src/server/portalProxy.js';

const secret = 'default-subdomain-portal-shared-secret-more-than-32-chars';
const env = {
  CUBEGEARS_BACKEND_URL: process.env.CUBEGEARS_BACKEND_URL,
  PORTAL_PROXY_SHARED_SECRET: process.env.PORTAL_PROXY_SHARED_SECRET,
  CUSTOMER_PORTAL_ROOT_DOMAIN: process.env.CUSTOMER_PORTAL_ROOT_DOMAIN,
};

function req(host, path = 'branding', options = {}) {
  return new Request('https://portal.example.org/api/portal/' + path, {
    method: options.method || 'GET',
    headers: { host, ...(options.origin ? { origin: options.origin } : {}) },
    body: options.method === 'POST' ? '{}' : undefined,
  });
}

test('only platform default workshop subdomains create independently signed tenant calls', async () => {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.org';
  process.env.PORTAL_PROXY_SHARED_SECRET = secret;
  process.env.CUSTOMER_PORTAL_ROOT_DOMAIN = 'cubegears.com';
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers });
    return Response.json({ name: 'Workshop' });
  };
  try {
    const alpha = await handlePortalRequest(req('alpha.cubegears.com'), ['branding']);
    const beta = await handlePortalRequest(req('beta.cubegears.com'), ['branding']);
    assert.equal(alpha.status, 200);
    assert.equal(beta.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, 'https://api.example.org/api/v1/customer-website/branding');
    assert.equal(calls[0].headers.get('X-CG-Portal-Host'), 'alpha.cubegears.com');
    assert.equal(calls[1].headers.get('X-CG-Portal-Host'), 'beta.cubegears.com');
    assert.notEqual(calls[0].headers.get('X-CG-Portal-Sig'),
      calls[1].headers.get('X-CG-Portal-Sig'));
    for (const call of calls) {
      const h = call.headers;
      const expected = createHmac('sha256', secret)
        .update(h.get('X-CG-Portal-TS') + ':' + h.get('X-CG-Portal-Host'))
        .digest('hex');
      assert.equal(h.get('X-CG-Portal-Sig'), expected);
    }
    assert.equal(alpha.headers.get('Cache-Control'), 'private, no-store');
  } finally { globalThis.fetch = originalFetch; }
});

test('custom and unknown domain hosts fail closed before any backend request', async () => {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.org';
  process.env.PORTAL_PROXY_SHARED_SECRET = secret;
  process.env.CUSTOMER_PORTAL_ROOT_DOMAIN = 'cubegears.com';
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw Error('No upstream calls allowed'); };
  try {
    for (const host of [
      'skylora.sus', 'alpha.example.org', 'alpha-garage.test:5174',
      'cubegears.com', 'a.b.cubegears.com', 'evilcubegears.com',
    ]) {
      assert.equal((await handlePortalRequest(req(host), ['branding'])).status, 404, host);
    }
    assert.equal((await handlePortalRequest(req('localhost/../../private'), ['branding'])).status, 400);
    assert.equal((await handlePortalRequest(req('alpha.cubegears.com', 'session', {
      method: 'POST', origin: 'https://attacker.example.org',
    }), ['session'])).status, 403);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
