import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('small phone layout has no forced 320px body width and keeps header usable', () => {
  const css = file('src/styles.css');
  assert.match(css, /body\{min-width:0\}/);
  assert.match(css, /@media\(max-width:390px\)\{/);
  assert.match(css, /\.nav\{height:auto;min-height:70px;padding-block:11px;gap:9px;flex-wrap:wrap\}/);
  assert.match(css, /\.nav-actions\{width:100%;justify-content:space-between\}/);
  assert.match(css, /\.brand-name strong\{max-width:calc\(100vw - 110px\)/);
});

test('workshop hero photography, buttons and content remain visible and full-width on mobile', () => {
  const css = file('src/styles.css');
  assert.match(css, /@media\(max-width:630px\)\{/);
  assert.match(css, /\.public-hero \.hero-graphic\.hero-photo\{min-height:235px;height:235px\}/);
  assert.match(css, /\.public-hero \.contacts\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.public-steps,\.public-info-grid\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.public-contact-card \.contacts .btn\{width:100%/);
  assert.match(file('src/App.jsx'), /hero-real-photo/);
});

test('customer dashboard cards, timeline and gallery fit 320px screens', () => {
  const css = file('src/styles.css');
  assert.match(css, /\.stats\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.vehicle-grid\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.timeline\{grid-template-columns:repeat\(2,minmax\(0,1fr\)/);
  assert.match(css, /\.photo-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)/);
  assert.match(css, /\.portal-document\{flex-direction:column;align-items:stretch\}/);
  assert.match(css, /\.portal-estimate-actions \.btn,\.portal-decline-form-buttons \.btn\{min-height:48px/);
  assert.match(css, /\.portal-filters select,\.portal-filters input\{font-size:16px/);
});

test('estimate table retains every financial field and shows labeled mobile cards', () => {
  const jsx = file('src/App.jsx');
  const css = file('src/styles.css');
  for (const field of ['t.quoteItem', 't.quantity', 't.unitPrice', 't.lineTotal']) {
    assert.ok(jsx.includes('data-label={' + field + '}'), field);
  }
  assert.match(css, /@media\(max-width:540px\)\{/);
  assert.match(css, /\.portal-quote-table tbody\{display:grid;gap:9px\}/);
  assert.match(css, /\.portal-quote-table td::before\{\s*content:attr\(data-label\)/);
  assert.match(css, /\.portal-quote-table\{display:block;width:100%;min-width:0\}/);
  for (const key of ['rupees(d.subtotal)', 'rupees(d.discount)', 'rupees(d.tax)', 'rupees(d.total)']) {
    assert.ok(jsx.includes(key), key);
  }
});

test('mobile layout preserves keyboard focus visibility and reduced motion handling', () => {
  const css = file('src/styles.css');
  assert.match(css, /button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /touch-action:manipulation/);
});
