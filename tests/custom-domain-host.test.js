import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handlePortalRequest } from '../src/server/portalProxy.js';

const secret = 'workshop-customer-portal-signed-secret-32-characters';
function request(host, path = 'branding', options = {}) {
  return new Request('https://example.org/api/portal/' + path, {
    method: options.method || 'GET',
    headers: { host, ...(options.origin ? { origin: options.origin } : {}) },
    body: options.method === 'POST' ? '{}' : undefined,
  });
}
function setup() {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.org';
  process.env.PORTAL_PROXY_SHARED_SECRET = secret;
}

test('custom domain requests get tenant-specific signed hostnames and no-store responses', async () => {
  setup();
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers });
    return new Response('{"name":"Workshop"}', {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    const first = await handlePortalRequest(request('alpha.example.org'), ['branding']);
    const second = await handlePortalRequest(request('beta.example.org'), ['branding']);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(calls[0].url, 'https://api.example.org/api/v1/customer-website/branding');
    assert.equal(calls[1].url, calls[0].url);
    const [a,b] = calls.map(c => c.headers);
    assert.equal(a.get('X-CG-Portal-Host'), 'alpha.example.org');
    assert.equal(b.get('X-CG-Portal-Host'), 'beta.example.org');
    assert.notEqual(a.get('X-CG-Portal-Sig'), b.get('X-CG-Portal-Sig'));
    for (const h of [a,b]) {
      const expected = createHmac('sha256', secret)
        .update(h.get('X-CG-Portal-TS') + ':' + h.get('X-CG-Portal-Host')).digest('hex');
      assert.equal(h.get('X-CG-Portal-Sig'), expected);
    }
    assert.equal(first.headers.get('Cache-Control'), 'private, no-store');
  } finally { globalThis.fetch = originalFetch; }
});

test('malformed hosts and cross-origin access attempts are refused without backend calls', async () => {
  setup();
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw Error('Should not call upstream'); };
  try {
    const invalid = await handlePortalRequest(request('localhost/../../private'), ['branding']);
    assert.equal(invalid.status, 400);
    const crossOrigin = await handlePortalRequest(
      request('tenant.example.org', 'session', {
        method: 'POST', origin: 'https://attacker.example.org',
      }), ['session'],
    );
    assert.equal(crossOrigin.status, 403);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});
