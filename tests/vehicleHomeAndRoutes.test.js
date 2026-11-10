import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dashboardRoute, vehicleUrl } from '../src/portalRouting.js';
import { copy } from '../src/i18n.js';
import { demoSession } from '../src/demoData.js';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

const one=[{id:'id-100',registration:'CAR-001'}];
const many=[...one,{id:'id-200',registration:'CAR-002'},{id:'id-300',registration:'CAR-003'}];

test('one authorized vehicle always opens its details directly',()=>{
  assert.deepEqual(dashboardRoute(one,'/'),{kind:'vehicle',vehicleId:'id-100',path:'/vehicles/id-100'});
  assert.deepEqual(dashboardRoute(one,'/vehicles/id-200'),{kind:'vehicle',vehicleId:'id-100',path:'/vehicles/id-100'});
  assert.equal(vehicleUrl('id-100'),'/vehicles/id-100');
});
test('many vehicles start on home and accept only authorized deep-link IDs',()=>{
  assert.deepEqual(dashboardRoute(many,'/'),{kind:'home',vehicleId:null,path:'/'});
  assert.deepEqual(dashboardRoute(many,'/access/private'),{kind:'home',vehicleId:null,path:'/'});
  assert.deepEqual(dashboardRoute(many,'/vehicles/id-200'),{kind:'vehicle',vehicleId:'id-200',path:'/vehicles/id-200'});
  assert.deepEqual(dashboardRoute(many,'/vehicles/id-999'),{kind:'home',vehicleId:null,path:'/'});
  assert.deepEqual(dashboardRoute(many,'/vehicles/%zz'),{kind:'home',vehicleId:null,path:'/'});
  assert.deepEqual(dashboardRoute([],'/vehicles/id-100'),{kind:'home',vehicleId:null,path:'/'});
  assert.equal(dashboardRoute(demoSession.vehicles,'/').kind,'home');
});
test('the Next.js vehicle route is a client view and never resolves unauthorized vehicles server-side',()=>{
  const page=source('app/vehicles/[vehicleId]/page.jsx');
  const app=source('src/App.jsx');
  assert.match(page,/<App \/>/);
  assert.match(app,/const \[viewVehicleId,setViewVehicleId\]=useState\(null\)/);
  assert.match(app,/syncVehicleRoute\(response\)/);
  assert.match(app,/window\.history\.pushState\(\{\},'',vehicleUrl\(allowed\.id\)\+\(target\?'#'\+target:''\)\)/);
  assert.match(app,/window\.addEventListener\('popstate',onPopState\)/);
  assert.match(app,/<CustomerHomeDashboard data=\{data\}/);
  assert.match(app,/vehicleId=\{viewVehicleId\}/);
  assert.match(app,/const scopedJobs=allJobs\.filter/);
  assert.match(app,/const scopedInvoices=\(data\.invoices\|\|\[\]\)\.filter/);
  assert.match(app,/const photos=\(data\.photos\|\|\[\]\)\.filter/);
  assert.match(app,/onEstimateDecision\?\.\(d,'accept'\)/);
  assert.match(app,/onEstimateDecision\?\.\(d,'decline'/);
});
test('multi-vehicle home renders latest real job and all authorized vehicle cards',()=>{
  const home=source('src/components/CustomerHomeDashboard.jsx');
  assert.match(home,/const latestActive = latest\.find\(j => inProgress\.has\(j\.status\)\)/);
  assert.match(home,/const latestWork = latestActive \|\| latest\[0\]/);
  assert.match(home,/vehicles\.map\(vehicle =>/);
  assert.match(home,/followVehicleLink\(event, vehicle\.id, onVehicleOpen\)/);
  assert.match(home,/String\(p\.vehicleId\) === String\(vehicle\.id\)/);
  assert.match(home,/portalApi\.photoUrl\(photo\.id\)/);
  assert.doesNotMatch(home,/type="file"|<ArrowRight|Math\.random\(/);
});
test('dashboard uses white and only workshop primary/secondary branding accents',()=>{
  const css=source('src/referenceDashboard.css');
  assert.match(css,/body:has\(\.ref-dashboard\)\{background:#fff\}/);
  assert.match(css,/--portal-brand:var\(--accent/);
  assert.match(css,/--portal-brand-soft:color-mix\(in srgb,var\(--accent-soft/);
  assert.match(css,/--portal-text-primary:/);
  assert.match(css,/--portal-text-secondary:/);
  assert.doesNotMatch(css, /orange|rose|pink|#f57645|#d9582e|#ea795a|#fff1e7/i);
  for(const breakpoint of [1130,900,680,360]){
    assert.ok(css.includes('@media(max-width:'+breakpoint+'px)'),String(breakpoint));
  }
  assert.match(css,/\.portal-home-vehicle-list\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.portal-home-vehicle-list\{grid-template-columns:minmax\(0,1fr\)/);
});
test('new home/detail labels exist in English and Malayalam',()=>{
  const keys=['homeSummaryDescription','latestWork','noServiceYet','chooseVehicle',
    'viewVehicleDetails','viewDetails','backToHome','vehicleRecords'];
  for(const lang of ['en','ml']){
    for(const key of keys)assert.ok(copy[lang][key],lang+'.'+key);
  }
});
