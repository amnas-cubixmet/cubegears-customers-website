import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handlePortalRequest } from '../src/server/portalProxy.js';
import { copy } from '../src/i18n.js';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('customer decisions are only offered on latest staff-shared estimate', () => {
  const app = file('src/App.jsx');
  assert.match(app, /d\.status==='Awaiting Customer'/);
  assert.match(app, /latestQuoteVersions\.get/);
  assert.match(app, /d\.id/);
  assert.match(app, /portalApi\.decideEstimate\(estimate\.id,estimate\.version,decision,estimate\.reviewHash\)/);
  assert.match(app, /await portalApi\.session\(\)/);
  assert.match(app, /window\.confirm\(message\)/);
  assert.match(app, /demoMode\|\|decisionBusy/);
  assert.match(app, /decisionBusy===d\.id/);
  assert.match(app, /d\.status==='Customer Approved'/);
  assert.match(app, /d\.status==='Customer Rejected'/);
});

test('Malayalam and English customer quote decisions are complete', () => {
  for (const lang of ['en','ml']) {
    for (const key of [
      'awaitingReview', 'customerAccepted', 'customerDeclined',
      'awaitingWorkshopConfirmation', 'reviewNote', 'acceptEstimate',
      'declineEstimate', 'submitting', 'confirmAccept', 'confirmDecline',
      'acceptedNotice', 'declinedNotice', 'quoteChanged', 'decisionFailed',
    ]) {
      assert.ok(copy[lang][key], lang + ':' + key);
    }
    assert.ok(copy[lang].confirmAccept.includes('{version}'));
    assert.ok(copy[lang].confirmDecline.includes('{total}'));
  }
  assert.match(file('src/styles.css'), /\.portal-estimate-actions/);
});

test('same-origin BFF signs customer estimate POST, forwards session and csrf, never a tenant ID', async () => {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.test';
  process.env.PORTAL_PROXY_SHARED_SECRET = 'part17-test-shared-secret-has-32-characters';
  const orig = globalThis.fetch;
  let call;
  globalThis.fetch = async (url,options) => {
    call = {url:String(url),options};
    return Response.json({id:'12345678-1234-1234-1234-123456789abc',status:'Customer Approved'});
  };
  try {
    const request = new Request('https://garage.example.com/api/portal/estimates/12345678-1234-1234-1234-123456789abc/decision',{
      method:'POST',
      headers:{host:'garage.example.com',origin:'https://garage.example.com',
        'x-cg-csrf':'csrf-from-cookie',cookie:'sessionid=private; cg_portal_csrf=csrf-from-cookie'},
      body:JSON.stringify({decision:'accept',version:2}),
    });
    const result = await handlePortalRequest(request,[
      'estimates','12345678-1234-1234-1234-123456789abc','decision'
    ]);
    assert.equal(result.status,200);
    assert.equal(call.url,'https://api.example.test/api/v1/customer-website/estimates/12345678-1234-1234-1234-123456789abc/decision');
    assert.equal(call.options.headers.get('X-CG-CSRF'),'csrf-from-cookie');
    assert.match(call.options.headers.get('Cookie'),/sessionid=private/);
    assert.equal(call.options.headers.has('X-CG-Portal-Tenant-ID'),false);
    assert.deepEqual(JSON.parse(call.options.body),{decision:'accept',version:2});
    assert.equal(result.headers.get('Cache-Control'),'private, no-store');
  } finally { globalThis.fetch=orig; }
});

test('cross-site origin is blocked even when quote path is valid', async () => {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.test';
  process.env.PORTAL_PROXY_SHARED_SECRET = 'part17-test-shared-secret-has-32-characters';
  const request=new Request('https://garage.example.com/api/portal/estimates/123/decision',{
    method:'POST',headers:{host:'garage.example.com',origin:'https://malicious.example'},
    body:'{"decision":"accept","version":1}',
  });
  assert.equal((await handlePortalRequest(request,['estimates','123','decision'])).status,403);
});
