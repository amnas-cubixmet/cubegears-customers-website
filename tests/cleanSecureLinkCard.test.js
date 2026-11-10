import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('dashboard does not display unnecessary browser-cookie/session security statement', () => {
  const app = read('src/App.jsx');
  const i18n = read('src/i18n.js');
  assert.doesNotMatch(app, /className="privacy"/);
  assert.doesNotMatch(app, /t\.security/);
  assert.doesNotMatch(i18n, /Your session is protected by secure browser cookies/);
  assert.doesNotMatch(i18n, /സുരക്ഷിത ബ്രൗസർ കുക്കി ഉപയോഗിച്ചാണ് സെഷൻ പ്രവർത്തിക്കുന്നത്/);
  assert.equal(copy.en.security, undefined);
  assert.equal(copy.ml.security, undefined);
});

test('public link card explains secure workshop access without inventing or exposing a token', () => {
  const app = read('src/App.jsx');
  const css = read('src/styles.css');
  assert.match(app, /className="public-secure-link-card"/);
  assert.match(app, /t\.privateLinkTitle/);
  assert.match(app, /t\.accessNote/);
  assert.match(css, /\.public-secure-link-card\{/);
  assert.match(css, /@media\(max-width:630px\)/);
  assert.ok(copy.en.privateLinkTitle);
  assert.ok(copy.ml.privateLinkTitle);
  assert.doesNotMatch(app.split('className="public-secure-link-card"')[1].split('</article>')[0], /<input|portalApi\.exchange|href=\{'\/access\/'/);
});
