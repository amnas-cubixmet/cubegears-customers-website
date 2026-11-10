import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy } from '../src/i18n.js';
import { demoSession } from '../src/demoData.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('dashboard uses the reference-inspired warm cards and real vehicle/service records', () => {
  const app=source('src/App.jsx');
  const hero=source('src/components/VehicleOverviewCard.jsx');
  assert.match(app,/className="wrap dashboard ref-dashboard"/);
  assert.match(app,/<VehicleOverviewCard vehicles=\{vehicles\} jobs=\{allJobs\} photos=\{data\.photos\|\|\[\]\}/);
  assert.match(app,/<RecentServiceActivity jobs=\{allJobs\} lang=\{lang\} t=\{t\}/);
  assert.match(app,/className="ref-dashboard-overview"/);
  assert.match(app,/className="ref-dashboard-rail"/);
  assert.match(hero,/const featured = vehicles\.find/);
  assert.match(hero,/const latestJob = vehicleJobs\[0\]/);
  assert.match(hero,/portalApi\.photoUrl\(photo\.id\)/);
  assert.match(hero,/photo\.demoImage \|\| portalApi\.photoUrl/);
  assert.match(hero,/inProgress\.has\(job\.status\)/);
  assert.match(hero,/jobs\.filter\(job => job\.vehicleId === featured\.id\)/);
});

test('there are no fabricated battery, GPS, tire-pressure, speed, or reminder metrics', () => {
  const hero=source('src/components/VehicleOverviewCard.jsx');
  const app=source('src/App.jsx');
  assert.doesNotMatch(hero, /batteryHealth|tirePressure|gpsCoordinates|speedKmH|synthetic|Math\.random/);
  assert.doesNotMatch(hero, /<ArrowRight|<ArrowUpRight|<ChevronRight/);
  assert.doesNotMatch(app, /Book a Service/);
  assert.ok(demoSession.vehicles.every(vehicle => vehicle.registration.startsWith('DEMO-')));
});

test('maintenance, history, documents, and private published photos keep their working sections', () => {
  const app=source('src/App.jsx');
  assert.match(app,/id="maintenance"/);
  assert.match(app,/id="history"/);
  assert.match(app,/id="documents"/);
  assert.match(app,/id="vehicles"/);
  assert.match(app,/href="#overview"/);
  assert.match(app,/href="#maintenance"/);
  assert.match(app,/href="#documents"/);
  assert.match(app,/<PublishedInspectionGallery photos=\{photos\} t=\{t\} lang=\{lang\}/);
  assert.match(app,/onEstimateDecision\?\.\(d,'accept'\)/);
  assert.match(app,/onEstimateDecision\?\.\(d,'decline'/);
});

test('design is scoped to private dashboard and responsive down to small phones', () => {
  const css=source('src/referenceDashboard.css');
  const layout=source('app/layout.jsx');
  assert.match(layout,/import '\.\.\/src\/referenceDashboard\.css'/);
  assert.match(css,/body:has\(\.ref-dashboard\)/);
  assert.match(css,/\.ref-dashboard-overview\{/);
  assert.match(css,/\.ref-vehicle-feature\{/);
  assert.match(css,/\.ref-recent-activity\{/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  for(const bp of [1130,900,680,360]){
    assert.ok(css.includes('@media(max-width:'+bp+'px)'), 'missing responsive breakpoint '+bp);
  }
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/\.sr-only/);
});

test('English and Malayalam have all reference-dashboard labels without public jargon', () => {
  const keys=[
    'dashboardSections','overviewTab','maintenanceTab','documentsTab','historyTab',
    'myGarage','featuredVehicle','noVehicleYet','workshopVehiclePhoto',
    'vehiclePhotoNotAvailable','latestService','serviceStarted',
    'serviceAtGlance','recentActivity','totalRecords'
  ];
  for(const lang of ['en','ml']){
    for(const key of keys) assert.ok(copy[lang][key], lang + '.' + key);
    assert.doesNotMatch(keys.map(key=>copy[lang][key]).join(' '),/Customer Portal|Customer Website/);
  }
});
