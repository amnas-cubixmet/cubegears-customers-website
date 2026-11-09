import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePortalRequest } from '../src/server/portalProxy.js';

test('local .test custom domain uses signed local Django gateway', async () => {
  const old = {
    NODE_ENV: process.env.NODE_ENV,
    CUBEGEARS_BACKEND_URL: process.env.CUBEGEARS_BACKEND_URL,
    PORTAL_BACKEND_URL: process.env.PORTAL_BACKEND_URL,
    PORTAL_PROXY_SHARED_SECRET: process.env.PORTAL_PROXY_SHARED_SECRET,
  };
  const originalFetch = globalThis.fetch;
  const upstreamCalls = [];
  process.env.NODE_ENV = 'development';
  delete process.env.CUBEGEARS_BACKEND_URL;
  process.env.PORTAL_BACKEND_URL = 'http://127.0.0.1:8000';
  process.env.PORTAL_PROXY_SHARED_SECRET = 'local-domain-test-secret-32-characters-minimum';
  globalThis.fetch = async (url, opts) => {
    upstreamCalls.push({ url: String(url), headers: opts.headers });
    return Response.json({ publicName: 'Alpha Garage' });
  };
  try {
    const response = await handlePortalRequest(new Request(
      'http://alpha-garage.test:5174/api/portal/branding',
      { headers: { host: 'alpha-garage.test:5174' } },
    ), ['branding']);
    assert.equal(response.status, 200);
    assert.equal(upstreamCalls.length, 1);
    assert.equal(upstreamCalls[0].url, 'http://127.0.0.1:8000/api/v1/customer-website/branding');
    assert.equal(upstreamCalls[0].headers.get('X-CG-Portal-Host'), 'alpha-garage.test:5174');
    assert.ok(upstreamCalls[0].headers.get('X-CG-Portal-Sig'));

    const otherOrigin = await handlePortalRequest(new Request(
      'http://alpha-garage.test:5174/api/portal/session',
      { method: 'POST', headers: {
        host: 'alpha-garage.test:5174', origin: 'http://beta-garage.test:5174',
      }, body: '{}' },
    ), ['session']);
    assert.equal(otherOrigin.status, 403);
    assert.equal(upstreamCalls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of Object.entries(old)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
