import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/verify-portal.mjs', import.meta.url));
const mockFetch = `globalThis.fetch = async (input, options) => {
  const url = new URL(input);
  if (options.redirect !== 'manual' || options.cache !== 'no-store') throw new Error('Unsafe request');
  if (url.hostname === 'office.customer.cubixgear.tech') {
    if (url.pathname === '/api/portal/branding') return Response.json({name:'Office'});
    if (url.pathname === '/api/portal/session') return new Response(null, {status:401});
  }
  if (/^portal-probe-[a-f0-9]{12}\\.customer\\.cubixgear\\.tech$/.test(url.hostname) && url.pathname === '/api/portal/branding') {
    return new Response(null, {status:404});
  }
  throw new Error('Unexpected request: ' + input);
};`;
function run(input) {
  return spawnSync(process.execPath, ['--import', 'data:text/javascript,' + encodeURIComponent(mockFetch), script, input], {encoding:'utf8', timeout:10000});
}

test('production hostname runs all three smoke probes', () => {
  for (const input of ['office.customer.cubixgear.tech','https://office.customer.cubixgear.tech/']) {
    const result = run(input);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /PASS Public branding \(HTTP 200\)/);
    assert.match(result.stdout, /PASS Unauthenticated session \(HTTP 401\)/);
    assert.match(result.stdout, /PASS Unknown workshop denied \(HTTP 404\)/);
  }
});

test('rejects private access URLs and insecure or malformed input before probing', () => {
  for (const input of ['https://office.customer.cubixgear.tech/access/example','http://office.customer.cubixgear.tech','localhost','https://office.customer.cubixgear.tech/?token=example','https://user:pass@office.customer.cubixgear.tech']) {
    const result = run(input);
    assert.equal(result.status, 2, result.stderr);
    assert.doesNotMatch(result.stdout, /Checking customer website/);
  }
});
