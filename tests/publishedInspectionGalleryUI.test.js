import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('published inspection photos render only backend-provided authorized photo records', () => {
  const app = read('src/App.jsx');
  const gallery = read('src/components/PublishedInspectionGallery.jsx');
  assert.match(app, /<PublishedInspectionGallery photos=\{photos\} t=\{t\} lang=\{lang\}/);
  assert.match(app, /const photos=\(data\.photos\|\|\[\]\)\.filter/);
  assert.match(gallery, /portalApi\.photoUrl\(photo\.id\)/);
  assert.match(gallery, /portalApi\.photoUrl\(activePhoto\.id\)/);
  assert.doesNotMatch(gallery, /fetch\(|POST|type="file"|Upload Photos|Take Photo/);
});

test('gallery has compact empty state and readable photo cards', () => {
  const gallery = read('src/components/PublishedInspectionGallery.jsx');
  const css = read('src/styles.css');
  assert.match(gallery, /className="published-inspection-empty"/);
  assert.match(gallery, /t\.nonePhotos/);
  assert.match(gallery, /t\.photoEmptyHelp/);
  assert.match(gallery, /className="photo-grid published-inspection-grid"/);
  assert.match(gallery, /loading="lazy"/);
  assert.match(gallery, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(css, /\.published-inspection-empty\{/);
  assert.match(css, /\.published-inspection-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:630px\)/);
});

test('full-size preview can close with keyboard, pointer or close button', () => {
  const gallery = read('src/components/PublishedInspectionGallery.jsx');
  assert.match(gallery, /role="dialog" aria-modal="true"/);
  assert.match(gallery, /event\.key === 'Escape'/);
  assert.match(gallery, /event\.key === 'Tab'/);
  assert.match(gallery, /aria-label=\{t\.photoClose\}/);
  assert.match(gallery, /if \(event\.target === event\.currentTarget\) setActivePhoto\(null\)/);
  assert.match(gallery, /previousFocus\.current\?\.focus\?\.\(\)/);
});

test('gallery uses translated photo labels and no decorative arrows', () => {
  const gallery = read('src/components/PublishedInspectionGallery.jsx');
  assert.doesNotMatch(gallery, /ArrowRight|ArrowUpRight|ChevronRight/);
  for (const lang of ['en', 'ml']) {
    for (const key of [
      'photoCount', 'photoOpen', 'photoPreview', 'photoClose', 'photoUnavailable',
      'photoUntitled', 'photoEmptyHelp', 'photoSharedByWorkshop',
    ]) {
      assert.ok(copy[lang][key], lang + '.' + key);
    }
  }
});
