import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';
import { handlePortalRequest } from '../src/server/portalProxy.js';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('customer sees a visible itemized estimate, GST and totals before confirming', () => {
  const app = file('src/App.jsx');
  assert.match(app, /d\.reviewable&&Array\.isArray\(d\.lines\)/);
  assert.match(app, /className="portal-quote-table"/);
  assert.match(app, /line\.description/);
  assert.match(app, /line\.quantity/);
  assert.match(app, /rupees\(line\.unitPrice\)/);
  assert.match(app, /rupees\(line\.total\)/);
  assert.match(app, /rupees\(d\.subtotal\)/);
  assert.match(app, /rupees\(d\.discount\)/);
  assert.match(app, /rupees\(d\.tax\)/);
  assert.match(app, /rupees\(d\.total\)/);
  assert.match(app, /rupees\(d\.gst\.cgst\)/);
  assert.match(app, /rupees\(d\.gst\.sgst\)/);
  assert.match(app, /rupees\(d\.gst\.igst\)/);
});

test('accept and decline require a reviewed exact quote and display server receipt', () => {
  const app = file('src/App.jsx');
  assert.match(app, /reviewedQuotes\.has\(d\.id\+':'\+d\.reviewHash\)/);
  assert.match(app, /<input type="checkbox"/);
  assert.match(app, /d\.status==='Awaiting Customer'&&d\.reviewable&&d\.reviewHash/);
  assert.match(app, /portalApi\.decideEstimate\(estimate\.id,estimate\.version,decision,estimate\.reviewHash\)/);
  assert.match(app, /d\.decisionReceipt\?\.id/);
  assert.match(app, /d\.decisionReceipt\.respondedAt/);
  assert.match(app, /t\.quoteUnavailable/);
  assert.match(app, /await portalApi\.session\(\)/);
  assert.doesNotMatch(app, /portalApi\.createPayment/);
});

test('Malayalam and English labels include itemization, consent and recorded decision', () => {
  for (const locale of ['en', 'ml']) {
    for (const key of [
      'quoteBreakdown', 'quoteItem', 'quantity', 'unitPrice', 'lineTotal',
      'subtotal', 'discount', 'tax', 'grandTotal', 'reviewConfirm',
      'typePart', 'typeLabour', 'typeService', 'typeOther',
      'quoteUnavailable', 'decisionReceipt', 'receiptReference', 'decisionDate',
    ]) {
      assert.ok(copy[locale][key], locale + ':' + key);
    }
  }
  const css=file('src/styles.css');
  assert.match(css, /\.portal-quote-table-wrap/);
  assert.match(css, /\.portal-quote-confirm input/);
  assert.match(css, /@media\(max-width:630px\)/);
});

test('signed same-origin quote request forwards review hash without a client tenant identifier', async () => {
  process.env.CUBEGEARS_BACKEND_URL='https://api.example.test';
  process.env.PORTAL_PROXY_SHARED_SECRET='part18-estimate-review-test-secret-32-characters-long';
  const originalFetch=globalThis.fetch;
  let seen;
  globalThis.fetch=async (url, options)=>{
    seen={url:String(url),options};
    return Response.json({status:'Customer Approved',decisionReceipt:{id:'receipt-1'}});
  };
  try {
    const request=new Request(
      'https://garage.example.com/api/portal/estimates/12345678-1234-1234-1234-123456789abc/decision',{
        method:'POST',
        headers:{host:'garage.example.com',origin:'https://garage.example.com',
          'x-cg-csrf':'csrf',cookie:'sessionid=abc; cg_portal_csrf=csrf'},
        body:JSON.stringify({decision:'accept',version:1,reviewHash:'a'.repeat(64)}),
      }
    );
    const response=await handlePortalRequest(request,[
      'estimates','12345678-1234-1234-1234-123456789abc','decision'
    ]);
    assert.equal(response.status,200);
    assert.equal(seen.options.headers.get('X-CG-CSRF'),'csrf');
    assert.equal(seen.options.headers.has('X-CG-Portal-Tenant-ID'),false);
    assert.deepEqual(JSON.parse(seen.options.body),{
      decision:'accept',version:1,reviewHash:'a'.repeat(64)
    });
    assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  } finally {
    globalThis.fetch=originalFetch;
  }
});
