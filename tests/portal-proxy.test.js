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
  for (const host of [root, 'abc1.cubixgear.tech', `extra.abc1.${root}`]) {
    assert.equal((await branding(host)).status, 404, host);
  }
  assert.equal(upstream.mock.callCount(), 0);
  const result = await branding(`abc1.${root}`);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { name: 'മലബാർ ഓട്ടോ' });
  assert.equal(upstream.mock.callCount(), 1);
});
