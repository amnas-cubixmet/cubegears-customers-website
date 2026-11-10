import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dashboardRoute, vehicleUrl } from '../src/portalRouting.js';

const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');

test('all home vehicle cards use real navigable links, not buttons or static divs', () => {
  const home = read('src/components/CustomerHomeDashboard.jsx');
  assert.match(home, /<a key=\{vehicle\.id\}/);
  assert.match(home, /className="portal-home-vehicle-card"/);
  assert.match(home, /href=\{vehicleUrl\(vehicle\.id\)\}/);
  assert.match(home, /onClick=\{event => followVehicleLink\(event, vehicle\.id, onVehicleOpen\)\}/);
  assert.match(home, /<\/a>/);
  assert.doesNotMatch(home, /<button key=\{vehicle\.id\}/);
  assert.match(home, /href=\{vehicleUrl\(latestWork\.vehicleId\)\}/);
});

test('normal click navigates in-app while modified clicks retain native browser link actions', () => {
  const home = read('src/components/CustomerHomeDashboard.jsx');
  assert.match(home, /event\.defaultPrevented \|\| event\.button !== 0/);
  assert.match(home, /event\.metaKey \|\|/);
  assert.match(home, /event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/);
  assert.match(home, /event\.preventDefault\(\);\s*onVehicleOpen\(vehicleId\)/);
  assert.equal(vehicleUrl('vehicle-1'),'/vehicles/vehicle-1');
  assert.equal(dashboardRoute([{id:'vehicle-1'}],'/vehicles/vehicle-1').vehicleId,'vehicle-1');
});

test('vehicle details no longer show duplicate Vehicle records search panel and static card', () => {
  const app = read('src/App.jsx');
  const details = app.split('function Dashboard(')[1].split('export default function App(')[0];
  assert.doesNotMatch(details, /className="filter portal-filters"/);
  assert.doesNotMatch(details, /<div className="vehicle-grid"/);
  assert.doesNotMatch(details, /<article className="vehicle"/);
  assert.doesNotMatch(details, /setQuery/);
  assert.match(details, /<VehicleOverviewCard vehicles=\{vehicles\}/);
  assert.match(details, /<PublishedInspectionGallery photos=\{photos\}/);
  assert.match(details, /id="maintenance"/);
  assert.match(details, /id="documents"/);
  assert.match(details, /id="history"/);
});

test('vehicle links keep mobile card dimensions and accessible keyboard focus',()=>{
  const css=read('src/referenceDashboard.css');
  assert.match(css,/\.portal-home-vehicle-card\{display:flex/);
  assert.match(css,/text-decoration:none;color:inherit;cursor:pointer/);
  assert.match(css,/\.portal-home-vehicle-card:focus-visible/);
  assert.match(css,/\.portal-home-vehicle-list\{grid-template-columns:minmax\(0,1fr\)/);
});
