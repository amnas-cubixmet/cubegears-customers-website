import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';
import { demoBranding, demoSession } from '../src/demoData.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('English and Malayalam displayed strings do not contain Customer branding', () => {
  for (const lang of ['en', 'ml']) {
    for (const [key, value] of Object.entries(copy[lang])) {
      if (typeof value !== 'string') continue;
      assert.doesNotMatch(value, /customer|കസ്റ്റമർ/i, lang + '.' + key);
    }
    assert.ok(copy[lang].label);
    assert.ok(copy[lang].portal);
  }
});

test('header has only workshop name and never renders Customer Portal subtitle', () => {
  const app = read('src/App.jsx');
  const header = app.split('function Header(')[1].split('function PublicPage(')[0];
  assert.doesNotMatch(header, /<small>\{t\.portal\}<\/small>/);
  assert.match(header, /brand\?\.publicName\|\|brand\?\.name/);
  assert.doesNotMatch(app, /\| Customer Portal/);
});

test('web metadata and demo content do not show Customer Website text', () => {
  const metadata = read('app/layout.jsx');
  assert.doesNotMatch(metadata, /Customer Website|Customer Portal/i);
  assert.doesNotMatch(demoBranding.description, /customer/i);
  assert.doesNotMatch(demoSession.customer.name, /customer/i);
});

test('secure tracking workflow and internal API status names remain intact', () => {
  const app = read('src/App.jsx');
  assert.match(app, /d\.status==='Awaiting Customer'/);
  assert.match(app, /d\.status==='Customer Approved'/);
  assert.match(app, /portalApi\.exchange\(token\)/);
  assert.match(app, /portalApi\.session\(\)/);
  assert.match(app, /data\.customer\?\.name/);
  assert.match(app, /onEstimateDecision\?\.\(d,'accept'\)/);
});
