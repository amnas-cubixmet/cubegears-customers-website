import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { capturePendingAccessToken } from '../src/accessLink.js';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const token = 'a'.repeat(32) + '.' + 'b'.repeat(64);

test('token survives the effect replay after the URL is scrubbed', () => {
  const initial = capturePendingAccessToken('/access/' + token);
  assert.equal(initial,token);
  assert.equal(capturePendingAccessToken('/', initial), token);
  assert.equal(capturePendingAccessToken('/'), null);
});
test('malformed tokens are rejected without logging or storage', () => {
  assert.throws(() => capturePendingAccessToken('/access/bad'),/Invalid access link/);
  assert.throws(() => capturePendingAccessToken('/access/%zz'),/Invalid access link/);
  assert.doesNotMatch(read('src/accessLink.js'),/localStorage|sessionStorage|console\.log/);
});
test('effect replay and retry do not remove pending token', () => {
  const app=read('src/App.jsx');
  assert.match(app,/const pendingAccessToken=useRef\(null\)/);
  assert.match(app,/let token=pendingAccessToken\.current/);
  assert.match(app,/pendingAccessToken\.current=token/);
  assert.match(app,/controller\.abort\(\)/);
  assert.match(app,/portalApi\.exchange\(token,controller\.signal\)/);
  assert.match(app,/setAccessRetry\(count=>count\+1\)/);
  assert.match(app,/\[demoMode,accessRetry\]/);
  assert.match(app,/const invalid=exchangeStarted && e\.status===404/);
  assert.doesNotMatch(app,/window\.location\.reload\(\)/);
  assert.match(read('src/api.js'),/signal,credentials:'same-origin'/);
});
