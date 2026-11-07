import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePortalRequest } from '../src/server/portalProxy.js';

test('development workshop.localhost signs hostname and routes via local Django only', async () => {
  process.env.CUBEGEARS_BACKEND_URL = 'http://127.0.0.1:8000';
  process.env.PORTAL_PROXY_SHARED_SECRET = 'workshop-host-testing-secret-at-least-32-characters';
  const originalFetch = globalThis.fetch;
  let upstreamUrl, upstreamHeaders;
  globalThis.fetch = async (url, options) => {
    upstreamUrl = String(url);
    upstreamHeaders = options.headers;
    return Response.json({name:'Example Garage'});
  };
  try {
    const result = await handlePortalRequest(new Request(
      'http://alpha-garage.localhost:3000/api/portal/branding',{
        method:'GET',headers:{host:'alpha-garage.localhost:3000'},
      }),['branding']);
    assert.equal(result.status,200);
    assert.equal(upstreamUrl,'http://127.0.0.1:8000/api/v1/customer-website/branding');
    assert.equal(upstreamHeaders.get('X-CG-Portal-Host'),'alpha-garage.localhost:3000');
    assert.ok(upstreamHeaders.get('X-CG-Portal-Sig'));
    assert.equal(upstreamHeaders.has('X-CG-Portal-Tenant-ID'),false);

    const forbidden = await handlePortalRequest(new Request(
      'http://alpha-garage.localhost:3000/api/portal/session',{
        method:'POST',headers:{
          host:'alpha-garage.localhost:3000',origin:'http://other.localhost:3000'
        },
        body:'{}',
      }),['session']);
    assert.equal(forbidden.status,403);
  } finally {globalThis.fetch=originalFetch;}
});
