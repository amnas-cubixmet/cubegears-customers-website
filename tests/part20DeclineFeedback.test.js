import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';
import { handlePortalRequest } from '../src/server/portalProxy.js';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('customer decline requires a reason and allows a bounded optional note', () => {
  const app = file('src/App.jsx');
  const api = file('src/api.js');
  assert.match(app, /declineDraft\.reason/);
  assert.match(app, /!declineDraft\.reason/);
  assert.match(app, /<select value=\{declineDraft\.reason\}/);
  assert.match(app, /value="price"/);
  assert.match(app, /value="items"/);
  assert.match(app, /value="timing"/);
  assert.match(app, /value="explanation"/);
  assert.match(app, /value="other"/);
  assert.match(app, /<textarea rows=\{3\} maxLength=\{500\}/);
  assert.match(app, /onEstimateDecision\?\.\(d,'decline',\{/);
  assert.match(app, /declineNote:declineDraft\.note/);
  assert.match(api, /decision === 'decline'/);
  assert.match(api, /declineReason: feedback\.declineReason/);
  assert.match(api, /declineNote: feedback\.declineNote/);
});

test('historical customer decision receipt includes the versioned feedback', () => {
  const app = file('src/App.jsx');
  assert.match(app, /d\.decisionReceipt\.declineFeedback/);
  assert.match(app, /d\.decisionReceipt\.declineFeedback\.note/);
  assert.match(app, /portal-decline-receipt/);
  assert.match(app, /portalApi\.decideEstimate\(estimate\.id,estimate\.version,decision,estimate\.reviewHash,feedback\)/);
  assert.match(app, /window\.confirm\(message\)/);
});

test('Malayalam and English form has every required reason label and safety message', () => {
  for (const lang of ['en', 'ml']) {
    for (const key of [
      'declineFeedbackTitle', 'declineFeedbackHelp', 'declineReason',
      'selectDeclineReason', 'reasonprice', 'reasonitems', 'reasontiming',
      'reasonexplanation', 'reasonother', 'reasonUnspecified', 'declineNote',
      'declineNotePlaceholder', 'submitDecline', 'cancel', 'feedbackInvalid',
    ]) assert.ok(copy[lang][key], lang + ':' + key);
  }
  assert.match(file('src/styles.css'), /\.portal-decline-form/);
  assert.match(file('src/styles.css'), /\.portal-decline-receipt/);
});

test('signed BFF forwards exact customer revision feedback without leaking a tenant id', async () => {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.test';
  process.env.PORTAL_PROXY_SHARED_SECRET = 'part20-secure-test-secret-longer-than-32-characters';
  const originalFetch=globalThis.fetch;
  let requestBody, headers;
  globalThis.fetch=async (_url,options)=>{
    requestBody=JSON.parse(options.body);
    headers=options.headers;
    return Response.json({status:'Customer Rejected',decisionReceipt:{id:'receipt-20'}});
  };
  try {
    const request = new Request('https://garage.example.com/api/portal/estimates/12345678-1234-1234-1234-123456789abc/decision',{
      method:'POST',
      headers:{host:'garage.example.com',origin:'https://garage.example.com',
        'x-cg-csrf':'csrf',cookie:'sessionid=abc; cg_portal_csrf=csrf'},
      body:JSON.stringify({
        decision:'decline', version:2,reviewHash:'f'.repeat(64),
        declineReason:'items',declineNote:'Please revise the parts list.',
      }),
    });
    const result = await handlePortalRequest(request,[
      'estimates','12345678-1234-1234-1234-123456789abc','decision'
    ]);
    assert.equal(result.status,200);
    assert.equal(headers.get('X-CG-CSRF'),'csrf');
    assert.equal(headers.has('X-CG-Portal-Tenant-ID'),false);
    assert.equal(requestBody.declineReason,'items');
    assert.equal(requestBody.declineNote,'Please revise the parts list.');
    assert.equal(requestBody.reviewHash,'f'.repeat(64));
    assert.equal(result.headers.get('Cache-Control'),'private, no-store');
  } finally { globalThis.fetch=originalFetch; }
});
