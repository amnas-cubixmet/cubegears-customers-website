import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { handlePortalRequest } from '../src/server/portalProxy.js';

test('the default production root forwards only one workshop label to Django', async (t) => {
  const root = 'customer.cubixgear.tech';
  const backend = 'https://api.cubixgear.tech';
  const secret = 'test-only-portal-secret-over-32-characters';
  const originalEnvironment = process.env;
  process.env = { ...originalEnvironment, NODE_ENV: 'production', CUBEGEARS_BACKEND_URL: backend,
    PORTAL_PROXY_SHARED_SECRET: secret };
  delete process.env.CUSTOMER_PORTAL_ROOT_DOMAIN;
  t.after(() => { process.env = originalEnvironment; });

  const upstream = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.href, `${backend}/api/v1/customer-website/branding`);
    const host = options.headers.get('X-CG-Portal-Host');
    assert.equal(host, `abc1.${root}`);
    const timestamp = options.headers.get('X-CG-Portal-TS');
    assert.equal(options.headers.get('X-CG-Portal-Sig'),
      createHmac('sha256', secret).update(`${timestamp}:${host}`).digest('hex'));
    return Response.json({ name: 'മലബാർ ഓട്ടോ' });
  });

  const branding = (host) => handlePortalRequest(new Request(`https://${host}/api/portal/branding`, {
    headers: { host },
  }), ['branding']);
  for (const host of [root, 'abc1.cubixgear.tech', `extra.abc1.${root}`, `ab.${root}`, `abc1.${root}:443`]) {
    assert.equal((await branding(host)).status, 404, host);
  }
  assert.equal(upstream.mock.callCount(), 0);
  const result = await branding(`abc1.${root}`);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { name: 'മലബാർ ഓട്ടോ' });
  assert.equal(upstream.mock.callCount(), 1);
});

test('portal writes require the same origin and ignore browser client-IP headers', async (t) => {
  const originalEnvironment = process.env;
  process.env = { ...originalEnvironment, NODE_ENV: 'production', VERCEL: '0',
    CUSTOMER_PORTAL_ROOT_DOMAIN: 'customer.cubixgear.tech',
    CUBEGEARS_BACKEND_URL: 'https://api.cubixgear.tech',
    PORTAL_PROXY_SHARED_SECRET: 'test-only-portal-secret-over-32-characters',
    PORTAL_TRUST_PROXY_CLIENT_IP: 'false' };
  t.after(() => { process.env = originalEnvironment; });

  const forwardedClients = [];
  const upstream = t.mock.method(globalThis, 'fetch', async (_url, options) => {
    forwardedClients.push(options.headers.get('X-CG-Portal-Client'));
    return Response.json({ authenticated: false });
  });
  const host = 'abc.customer.cubixgear.tech';
  const post = (origin) => handlePortalRequest(new Request(`https://${host}/api/portal/logout`, {
    method: 'POST', body: '{}', headers: {
      host, ...(origin ? { origin } : {}), 'x-forwarded-for': '192.0.2.1',
      'x-real-ip': '192.0.2.2', 'x-cg-portal-client': '192.0.2.3',
    },
  }), ['logout']);

  assert.equal((await post()).status, 403);
  assert.equal((await post('https://other.customer.cubixgear.tech')).status, 403);
  assert.equal(upstream.mock.callCount(), 0);
  assert.equal((await post(`https://${host}`)).status, 200);
  process.env.PORTAL_TRUST_PROXY_CLIENT_IP = 'true';
  assert.equal((await post(`https://${host}`)).status, 200);
  assert.deepEqual(forwardedClients, [null, '192.0.2.2']);
});
