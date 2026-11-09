import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('public hero uses a licensed real automotive workshop photograph, not the car illustration', () => {
  const page = read('src/App.jsx');
  const publicHome = page.split('function PublicPage(')[1].split('function Timeline(')[0];
  assert.match(publicHome, /className="hero-graphic hero-photo"/);
  assert.match(publicHome, /className="hero-real-photo"/);
  assert.match(publicHome, /images\.unsplash\.com\/photo-1643700973089-baa86a1ab9ee/);
  assert.match(publicHome, /alt=\{t\.publicHeroPhotoAlt\}/);
  assert.match(publicHome, /loading="eager"/);
  assert.match(publicHome, /fetchPriority="high"/);
  assert.match(publicHome, /Jimmy Nilsson Masth \/ Unsplash/);
  assert.doesNotMatch(publicHome, /circle circle-a|car-graphic/);
  assert.doesNotMatch(read('src/styles.css'), /\.car-graphic\{/);
});

test('photo remains visible on narrow screens and has language-aware alternative text', () => {
  const css = read('src/styles.css');
  assert.match(css, /\.public-hero \.hero-graphic\.hero-photo\{/);
  assert.match(css, /object-fit:cover/);
  assert.match(css, /@media\(max-width:920px\)\{[\s\S]*?\.public-hero \.hero-graphic\.hero-photo\{[\s\S]*?display:block/);
  assert.match(css, /@media\(max-width:630px\)\{[\s\S]*?\.public-hero \.hero-graphic\.hero-photo\{[\s\S]*?display:block/);
  assert.ok(copy.en.publicHeroPhotoAlt);
  assert.ok(copy.ml.publicHeroPhotoAlt);
});

test('Next.js provides its own favicon and uses workshop logo when configured', () => {
  const icon = read('app/icon.svg');
  assert.match(icon, /<svg /);
  assert.match(icon, /Cubixgear automotive service/);
  const app = read('src/App.jsx');
  assert.match(app, /function updateSiteFavicon\(brand\)/);
  assert.match(app, /brand\?\.hasLogo \? portalApi\.logoUrl : '\/icon\.svg'/);
  assert.match(app, /updateSiteFavicon\(brand\)/);
  assert.match(app, /src="\/icon.svg" className="brand-fallback-logo"/);
});
