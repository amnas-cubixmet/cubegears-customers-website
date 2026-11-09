import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('development allows workshop.localhost without trusting arbitrary remote domains', () => {
  const config = read('next.config.mjs');
  assert.match(config, /allowedDevOrigins:\s*\['\*\.localhost', '\*\.test'\]/);
  assert.doesNotMatch(config, /allowedDevOrigins:\s*\['\*'\]/);
  assert.match(read('src/server/portalProxy.js'), /X-CG-Portal-Host/);
});

test('public home renders real workshop branding and contact actions, not customer records', () => {
  const app = read('src/App.jsx');
  const publicHome = app.split('function PublicPage(')[1].split('function Timeline(')[0];
  assert.match(publicHome, /brand\?\.welcomeMessage/);
  assert.match(publicHome, /brand\?\.publicName/);
  assert.match(publicHome, /public-how/);
  assert.match(publicHome, /public-contact-card/);
  assert.match(publicHome, /public-directions/);
  assert.match(publicHome, /maps\/search\/\?api=1/);
  assert.match(publicHome, /encodeURIComponent\(/);
  assert.match(publicHome, /cleanPhone\(/);
  assert.doesNotMatch(publicHome, /portalApi\.session\(/);
  assert.doesNotMatch(publicHome, /data\.jobs|data\.vehicles|data\.invoices/);
});

test('public workshop content is localized for both supported languages', () => {
  const keys = [
    'publicIntro', 'publicEnquiry', 'publicEnquiryMessage', 'publicHowTitle',
    'publicHowDescription', 'publicStepOneTitle', 'publicStepTwoTitle',
    'publicStepThreeTitle', 'publicDirections', 'publicContactAndAccess',
  ];
  for (const lang of ['en', 'ml']) {
    for (const key of keys) assert.ok(copy[lang][key], lang + ':' + key);
    assert.ok(copy[lang].publicEnquiryMessage.includes('{workshop}'));
  }
});
