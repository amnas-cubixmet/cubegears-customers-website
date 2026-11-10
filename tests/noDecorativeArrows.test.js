import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('no decorative right arrow icons remain in the public and private customer website', () => {
  const app = file('src/App.jsx');
  assert.doesNotMatch(app, /\bArrowRight\b|\bArrowUpRight\b|\bChevronRight\b|\bMoveRight\b/);
  assert.doesNotMatch(app, /<svg[^>]*className="[^"]*arrow/i);
  assert.doesNotMatch(app, /[➜➔➝➞➟➡→]/);
});

test('removing arrows does not remove workshop contact or customer action controls', () => {
  const app = file('src/App.jsx');
  assert.match(app, /href=\{'tel:'\+phone\}/);
  assert.match(app, /href=\{'https:\/\/wa\.me\/'\+wa\}/);
  assert.match(app, /className="public-enquiry-link"/);
  assert.match(app, /className="public-directions"/);
  assert.match(app, /href="\/demo\/portal"/);
  assert.match(app, /onClick=\{onRefresh\}/);
  assert.match(app, /onEstimateDecision\?\.\(d,'accept'\)/);
  assert.match(app, /onEstimateDecision\?\.\(d,'decline'/);
  assert.match(app, /setAccessRetry\(count=>count\+1\)/);
});

test('customer website pages and styles are free of hardcoded decorative arrow glyphs', () => {
  for (const path of [
    'app/page.jsx',
    'app/demo/page.jsx',
    'app/demo/portal/page.jsx',
    'app/access/[token]/page.jsx',
    'src/styles.css',
  ]) {
    assert.doesNotMatch(file(path), /[➜➔➝➞➟➡→]/, path);
  }
});
