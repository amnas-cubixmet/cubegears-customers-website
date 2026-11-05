import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { demoBranding, demoSession } from '../src/demoData.js';
import { copy } from '../src/i18n.js';

const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('demo workshop and customer records are clearly fictional and internally linked', () => {
  assert.match(demoBranding.publicName, /Demo/i);
  assert.equal(demoBranding.phone, '');
  assert.equal(demoBranding.whatsapp, '');
  assert.equal(demoSession.customer.name, 'Demo Customer');
  assert.ok(demoSession.vehicles.length >= 2);
  assert.ok(demoSession.jobs.length >= 3);
  assert.ok(demoSession.photos.length >= 2);
  assert.ok(demoSession.estimates.length > 0);
  assert.ok(demoSession.invoices.length > 0);
  const vehicles = new Set(demoSession.vehicles.map(v => v.id));
  const jobs = new Set(demoSession.jobs.map(j => j.id));
  for (const vehicle of demoSession.vehicles) assert.match(vehicle.registration, /^DEMO-/);
  for (const job of demoSession.jobs) {
    assert.match(job.number, /^DEMO-/);
    assert.ok(vehicles.has(job.vehicleId));
  }
  for (const photo of demoSession.photos) {
    assert.ok(vehicles.has(photo.vehicleId));
    assert.match(photo.demoImage, /^data:image\/svg\+xml;charset=utf-8,/);
    assert.match(decodeURIComponent(photo.demoImage), /ILLUSTRATIVE DEMO ONLY/);
  }
  for (const invoice of demoSession.invoices) {
    assert.ok(jobs.has(invoice.jobId));
    assert.match(invoice.number, /^DEMO-/);
  }
  for (const estimate of demoSession.estimates) assert.ok(jobs.has(estimate.jobId));
});

test('demo routes are off by default in production', () => {
  const publicRoute = file('app/demo/page.jsx');
  const trackingRoute = file('app/demo/portal/page.jsx');
  for (const page of [publicRoute, trackingRoute]) {
    assert.match(page, /process\.env\.NODE_ENV === 'production'/);
    assert.match(page, /process\.env\.CUBEGEARS_DEMO_ENABLED !== 'true'/);
    assert.match(page, /notFound\(\)/);
    assert.match(page, /demoMode/);
  }
});

test('demo never replaces root or secure customer access and does not exchange tokens', () => {
  assert.doesNotMatch(file('app/page.jsx'), /demoMode/);
  assert.doesNotMatch(file('app/access/[token]/page.jsx'), /demoMode/);
  const app = file('src/App.jsx');
  assert.match(app, /if\(demoMode\)\{document\.title=/);
  assert.match(app, /useState\(demoMode \? demoBranding : null\)/);
  assert.match(app, /useState\(demoMode \? demoSession : null\)/);
  assert.match(app, /demoView === 'portal' \? 'dashboard' : 'public'/);
  assert.match(app, /demoMode&&<div className="demo-banner"/);
  assert.match(app, /p\.demoImage \|\| portalApi\.photoUrl\(p\.id\)/);
});

test('demo notice and navigation are bilingual', () => {
  for (const locale of ['en', 'ml']) {
    assert.ok(copy[locale].demoLabel);
    assert.ok(copy[locale].demoNotice);
    assert.ok(copy[locale].demoExplore);
    assert.ok(copy[locale].demoTrack);
    assert.ok(copy[locale].demoWorkshop);
  }
  assert.match(file('src/styles.css'), /\.demo-banner/);
  assert.match(file('README.md'), /CUBEGEARS_DEMO_ENABLED=true/);
});
